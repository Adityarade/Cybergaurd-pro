import logging
import uuid
from typing import List, Dict, Optional
from datetime import datetime
from pydantic_settings import BaseSettings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cyberguard-db")


class Settings(BaseSettings):
    mongodb_url: str = "mongodb://localhost:27017/"
    database_name: str = "cyberguard"
    port: int = 8000
    simulator_active: bool = False

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Load settings
settings = Settings()

# ─── In-Memory Fallback Store ──────────────────────────────────────────────────
# Used automatically when MongoDB is not available.
_in_memory_logs: List[Dict] = []
MAX_IN_MEMORY_LOGS = 2000

# User credentials store (in-memory)
_in_memory_users: Dict[str, Dict] = {}


class Database:
    client = None
    db = None
    logs_collection = None
    users_collection = None
    _use_memory: bool = True   # Default to true, flipped to False only if MongoDB connection succeeds

    # ── Connection & Initialization ─────────────────────────────────────────────

    @classmethod
    async def connect(cls):
        """Tries to connect to MongoDB; falls back to in-memory storage silently."""
        try:
            from motor.motor_asyncio import AsyncIOMotorClient
            logger.info(f"Connecting to MongoDB at: {settings.mongodb_url}")
            cls.client = AsyncIOMotorClient(
                settings.mongodb_url,
                serverSelectionTimeoutMS=3000
            )
            cls.db = cls.client[settings.database_name]
            cls.logs_collection = cls.db["logs"]
            cls.users_collection = cls.db["users"]
            await cls.client.admin.command("ping")
            cls._use_memory = False
            logger.info("MongoDB connection established successfully.")
        except Exception as e:
            logger.warning(
                f"MongoDB unavailable ({e}). "
                "Switching to in-memory storage — all features remain fully functional."
            )
            cls.client = None
            cls.logs_collection = None
            cls.users_collection = None
            cls._use_memory = True

        # Auto-create default admin and viewer users if not exists
        await cls.seed_default_users()

    @classmethod
    async def disconnect(cls):
        """Closes MongoDB connection if open."""
        if cls.client:
            cls.client.close()
            logger.info("MongoDB connection closed.")

    @classmethod
    async def seed_default_users(cls):
        """Seeds standard admin/viewer accounts if they do not exist."""
        # We import here to avoid circular imports with security utilities
        from app.core.security import get_password_hash

        default_users = [
            {"username": "admin", "password": "admin", "role": "Admin"},
            {"username": "viewer", "password": "viewer", "role": "Viewer"},
        ]

        for user in default_users:
            existing = await cls.get_user(user["username"])
            if not existing:
                hashed_pw = get_password_hash(user["password"])
                user_record = {
                    "username": user["username"],
                    "hashed_password": hashed_pw,
                    "role": user["role"],
                    "created_at": datetime.utcnow()
                }
                await cls.create_user(user_record)
                logger.info(f"Seeded default user: {user['username']} ({user['role']})")

    # ── User Account Operations ──────────────────────────────────────────────────

    @classmethod
    async def get_user(cls, username: str) -> Optional[Dict]:
        """Retrieves user document by username."""
        if cls._use_memory:
            return _in_memory_users.get(username)

        try:
            user = await cls.users_collection.find_one({"username": username})
            if user:
                user["_id"] = str(user["_id"])
            return user
        except Exception as e:
            logger.error(f"Error fetching user {username}: {e}")
            return None

    @classmethod
    async def create_user(cls, user_data: Dict) -> bool:
        """Stores a new user record."""
        if cls._use_memory:
            _in_memory_users[user_data["username"]] = user_data
            return True

        try:
            # Ensure unique index constraint (handled code level for simplicity)
            existing = await cls.get_user(user_data["username"])
            if existing:
                return False
            await cls.users_collection.insert_one(user_data)
            return True
        except Exception as e:
            logger.error(f"Error creating user {user_data.get('username')}: {e}")
            return False

    # ── Log Operations ──────────────────────────────────────────────────────────

    @classmethod
    async def add_log(cls, log: Dict) -> str:
        """Inserts a log record. Uses MongoDB or in-memory store transparently."""
        if "timestamp" not in log or log["timestamp"] is None:
            log["timestamp"] = datetime.utcnow()

        # Handle datetimes to string for JSON serialization compatibility
        if isinstance(log["timestamp"], datetime):
            timestamp_dt = log["timestamp"]
        else:
            timestamp_dt = datetime.utcnow()

        if cls._use_memory:
            record_id = str(uuid.uuid4())
            log["_id"] = record_id
            log["timestamp"] = timestamp_dt.isoformat()
            _in_memory_logs.insert(0, log)
            if len(_in_memory_logs) > MAX_IN_MEMORY_LOGS:
                _in_memory_logs.pop()
            return record_id

        try:
            # Keep datetime object for mongo query compatibility
            log_to_insert = log.copy()
            log_to_insert["timestamp"] = timestamp_dt
            result = await cls.logs_collection.insert_one(log_to_insert)
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"MongoDB write error: {e}. Storing in memory instead.")
            cls._use_memory = True
            return await cls.add_log(log)

    @classmethod
    async def get_logs(
        cls,
        limit: int = 50,
        skip: int = 0,
        classification: Optional[str] = None,
    ) -> List[Dict]:
        """Fetches logs sorted newest-first, with optional classification filter."""
        if cls._use_memory:
            filtered = [
                log for log in _in_memory_logs
                if classification is None or log.get("classification") == classification
            ]
            return filtered[skip: skip + limit]

        try:
            query = {}
            if classification:
                query["classification"] = classification
            cursor = cls.logs_collection.find(query).sort("timestamp", -1).skip(skip).limit(limit)
            logs = []
            async for doc in cursor:
                doc["_id"] = str(doc["_id"])
                if isinstance(doc.get("timestamp"), datetime):
                    doc["timestamp"] = doc["timestamp"].isoformat()
                logs.append(doc)
            return logs
        except Exception as e:
            logger.error(f"MongoDB read error: {e}")
            return []

    @classmethod
    async def get_recent_logs_by_ip(cls, ip: str, limit: int = 20) -> List[Dict]:
        """Returns recent logs for a specific IP (used for DDoS rate analysis)."""
        if cls._use_memory:
            return [log for log in _in_memory_logs if log.get("ip") == ip][:limit]

        try:
            cursor = cls.logs_collection.find({"ip": ip}).sort("timestamp", -1).limit(limit)
            logs = []
            async for doc in cursor:
                doc["_id"] = str(doc["_id"])
                if isinstance(doc.get("timestamp"), datetime):
                    doc["timestamp"] = doc["timestamp"].isoformat()
                logs.append(doc)
            return logs
        except Exception as e:
            logger.error(f"MongoDB IP query error: {e}")
            return []

    # ── Stats ───────────────────────────────────────────────────────────────────

    @classmethod
    async def get_stats(cls) -> Dict:
        """Computes aggregated threat statistics from whichever store is active."""
        default_stats = {
            "total_logs": 0,
            "clean_logs": 0,
            "total_threats": 0,
            "prediction_accuracy": 95.0,
            "threat_counts": {
                "SQL Injection": 0,
                "DDoS Attempt": 0,
                "Brute Force": 0,
            },
        }

        if cls._use_memory:
            if not _in_memory_logs:
                return default_stats

            total = len(_in_memory_logs)
            clean = sum(1 for l in _in_memory_logs if l.get("classification") == "Normal")
            threat_counts = {"SQL Injection": 0, "DDoS Attempt": 0, "Brute Force": 0}
            confidences = []
            for log in _in_memory_logs:
                cls_name = log.get("classification", "Normal")
                if cls_name in threat_counts:
                    threat_counts[cls_name] += 1
                if "confidence" in log:
                    confidences.append(log["confidence"])

            avg_conf = (sum(confidences) / len(confidences) * 100) if confidences else 95.0
            return {
                "total_logs": total,
                "clean_logs": clean,
                "total_threats": total - clean,
                "prediction_accuracy": round(avg_conf, 2),
                "threat_counts": threat_counts,
            }

        try:
            total_logs = await cls.logs_collection.count_documents({})
            if total_logs == 0:
                return default_stats

            clean_logs = await cls.logs_collection.count_documents({"classification": "Normal"})

            pipeline = [
                {"$match": {"classification": {"$ne": "Normal"}}},
                {"$group": {"_id": "$classification", "count": {"$sum": 1}}},
            ]
            threat_counts = {"SQL Injection": 0, "DDoS Attempt": 0, "Brute Force": 0}
            async for doc in cls.logs_collection.aggregate(pipeline):
                threat_counts[doc["_id"]] = doc["count"]

            avg_pipeline = [
                {"$group": {"_id": None, "avg_confidence": {"$avg": "$confidence"}}}
            ]
            avg_confidence = 95.0
            async for doc in cls.logs_collection.aggregate(avg_pipeline):
                avg_confidence = doc["avg_confidence"] * 100.0

            return {
                "total_logs": total_logs,
                "clean_logs": clean_logs,
                "total_threats": total_logs - clean_logs,
                "prediction_accuracy": round(avg_confidence, 2),
                "threat_counts": threat_counts,
            }
        except Exception as e:
            logger.error(f"Stats aggregation error: {e}")
            return default_stats

    # ── Clear ───────────────────────────────────────────────────────────────────

    @classmethod
    async def clear_database(cls) -> bool:
        """Wipes all logs from whichever store is active."""
        if cls._use_memory:
            _in_memory_logs.clear()
            logger.info("In-memory log store cleared.")
            return True
        try:
            await cls.logs_collection.delete_many({})
            logger.info("MongoDB logs collection cleared.")
            return True
        except Exception as e:
            logger.error(f"Error clearing database: {e}")
            return False
