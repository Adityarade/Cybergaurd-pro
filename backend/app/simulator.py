import asyncio
import random
import logging
from datetime import datetime
from typing import Optional
from app.model import ThreatClassifier
from app.database import Database

logger = logging.getLogger("cyberguard-simulator")

class ThreatSimulator:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(ThreatSimulator, cls).__new__(cls, *args, **kwargs)
            cls._instance.initialized = False
        return cls._instance

    def __init__(self):
        if self.initialized:
            return
        self.initialized = True
        self.active = False
        self.frequency_per_min = 60.0  # Default: 60 logs per minute (1 log/sec)
        self.task: Optional[asyncio.Task] = None
        self.classifier = ThreatClassifier()

        # Mock IP pools representing normal and malicious actors
        self.safe_ips = [
            "192.168.1.45", "192.168.1.102", "10.0.0.15", "10.0.2.190",
            "172.16.5.4", "172.16.8.22", "8.8.8.8", "1.1.1.1",
            "204.79.197.200", "13.107.21.200", "142.250.190.46"
        ]
        self.threat_ips = [
            "198.51.100.12", "203.0.113.88", "45.227.254.10", "185.220.101.5",
            "91.240.118.42", "103.89.228.18", "77.247.110.15", "195.154.122.9"
        ]

        # Normal paths and payloads
        self.normal_paths = [
            ("/api/v1/dashboard", "GET"),
            ("/api/v1/reports", "GET"),
            ("/api/v1/profile", "GET"),
            ("/api/v1/settings", "GET"),
            ("/api/v1/settings", "POST"),
            ("/api/v1/inventory", "GET"),
            ("/index.html", "GET"),
            ("/static/js/main.js", "GET"),
            ("/static/css/styles.css", "GET")
        ]

    def set_frequency(self, frequency: float):
        """Updates frequency dynamically."""
        self.frequency_per_min = max(1.0, min(300.0, frequency))
        logger.info(f"Simulator frequency updated to {self.frequency_per_min} logs/min")

    async def start(self):
        """Starts the simulator background worker if not already active."""
        if self.active:
            logger.info("Simulator is already running.")
            return
        
        self.active = True
        self.task = asyncio.create_task(self._simulation_loop())
        logger.info("Simulator background service started.")

    async def stop(self):
        """Stops the simulator background worker."""
        if not self.active:
            logger.info("Simulator is not running.")
            return
        
        self.active = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
            self.task = None
        logger.info("Simulator background service stopped.")

    async def _simulation_loop(self):
        """Infinite loop creating threat and safe request logs."""
        try:
            while self.active:
                # Calculate sleep delay based on active frequency (e.g., 60 logs/min = 1s sleep)
                delay = 60.0 / self.frequency_per_min
                
                # Check database status (allows in-memory fallback)
                if Database.logs_collection is not None or Database._use_memory:
                    # Randomly decide threat vs normal
                    # 75% Normal, 25% Threat (split: SQLi, Brute Force, DDoS)
                    roll = random.random()
                    if roll < 0.75:
                        await self.generate_and_store_log("Normal")
                    elif roll < 0.83:
                        await self.generate_and_store_log("SQL Injection")
                    elif roll < 0.91:
                        # Brute force often comes as a burst of requests
                        burst_size = random.randint(4, 7)
                        ip = random.choice(self.threat_ips)
                        for _ in range(burst_size):
                            await self.generate_and_store_log("Brute Force", ip_override=ip)
                            await asyncio.sleep(0.1) # Rapid consecutive requests
                    else:
                        # DDoS comes as a heavy flood from single IP
                        flood_size = random.randint(12, 18)
                        ip = random.choice(self.threat_ips)
                        for _ in range(flood_size):
                            await self.generate_and_store_log("DDoS Attempt", ip_override=ip)
                            await asyncio.sleep(0.05) # Extreme rapid flood
                
                await asyncio.sleep(delay)
        except asyncio.CancelledError:
            logger.info("Simulation loop cancelled.")
        except Exception as e:
            logger.error(f"Error in simulation loop: {e}")
            self.active = False

    async def generate_and_store_log(self, threat_type: str, ip_override: Optional[str] = None) -> dict:
        """Generates mock HTTP parameters, runs classification, and saves to MongoDB."""
        ip = ip_override or (random.choice(self.safe_ips) if threat_type == "Normal" else random.choice(self.threat_ips))
        timestamp = datetime.utcnow()

        if threat_type == "Normal":
            path, method = random.choice(self.normal_paths)
            if method == "POST":
                payload = f'{{"theme":"dark","notifications":true,"update_time":{random.randint(100, 999)}}}'
            else:
                payload = f'?v={random.randint(100, 999)}&user_id={random.randint(1000, 9999)}'

        elif threat_type == "SQL Injection":
            sqli_payloads = [
                "1' OR '1'='1",
                "admin' OR 1=1 --",
                "1; DROP TABLE logs; --",
                "' UNION SELECT username, password FROM users --",
                "x' AND 1=0 UNION SELECT NULL, @@VERSION --"
            ]
            path, method = random.choice([("/api/v1/search", "GET"), ("/api/v1/users", "GET"), ("/login", "POST")])
            payload = random.choice(sqli_payloads) if method == "GET" else f'{{"username":"admin","password":"{random.choice(sqli_payloads)}"}}'

        elif threat_type == "Brute Force":
            path = "/login"
            method = "POST"
            usernames = ["admin", "root", "administrator", "guest", "test"]
            payload = f'{{"username":"{random.choice(usernames)}","password":"guess_pass_{random.randint(10, 99)}"}}'

        else:  # DDoS Attempt
            path = random.choice(["/api/v1/dashboard", "/index.html", "/api/v1/reports"])
            method = "GET"
            # Random cache buster to simulate DDoS bypass of CDN caches
            payload = f"?cache_bust={random.randint(100000, 999999)}&ref=direct"

        # Query database for recent logs from this IP to feed classifier context
        recent_requests = []
        if Database.logs_collection is not None or Database._use_memory:
            recent_requests = await Database.get_recent_logs_by_ip(ip, limit=20)

        # Call the ThreatClassifier to evaluate and score
        classification, confidence, reason = self.classifier.classify(
            ip=ip,
            method=method,
            path=path,
            payload=payload,
            recent_requests=recent_requests
        )

        log_record = {
            "ip": ip,
            "method": method,
            "path": path,
            "payload": payload,
            "timestamp": timestamp,
            "classification": classification,
            "confidence": confidence,
            "reason": reason
        }

        # Save to database
        await Database.add_log(log_record)

        # Broadcast via WebSockets in real time
        try:
            from app.api.threats import manager
            # Make a copy and prepare for websocket serialization
            ws_payload = log_record.copy()
            if "_id" in ws_payload:
                ws_payload["_id"] = str(ws_payload["_id"])
            if isinstance(ws_payload.get("timestamp"), datetime):
                ws_payload["timestamp"] = ws_payload["timestamp"].isoformat()
            await manager.broadcast(ws_payload)
        except Exception as e:
            logger.error(f"Failed to broadcast log via WebSocket: {e}")

        # Auto-trigger SOAR incident webhook for critical threats
        if classification in ["SQL Injection", "DDoS Attempt"]:
            try:
                from app.utils.notify import send_slack_discord_webhook
                ts_str = log_record["timestamp"].isoformat() if isinstance(log_record["timestamp"], datetime) else str(log_record["timestamp"])
                asyncio.create_task(send_slack_discord_webhook(classification, ip, ts_str))
            except Exception as e:
                logger.error(f"Failed to invoke SOAR webhook notification: {e}")

        return log_record
