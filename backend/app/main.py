import logging
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from prometheus_client import Counter
from prometheus_fastapi_instrumentator import Instrumentator

from app.database import Database, settings
from app.simulator import ThreatSimulator
from app.model import ThreatClassifier
from app.core.dependencies import require_role
from app.api.auth import router as auth_router
from app.api.threats import router as threats_router

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cyberguard-main")

# Initialize custom Prometheus metrics
# threats_detected_total: Tracks count of detected security threats labeled by threat_type
THREATS_COUNTER = Counter(
    "threats_detected_total",
    "Total count of detected security threats",
    ["threat_type"]
)
# requests_processed_total: Tracks overall AI engine logs processed labeled by classification
REQUESTS_COUNTER = Counter(
    "requests_processed_total",
    "Total request logs processed and classified by the AI engine",
    ["classification"]
)

# Simulator singleton instance
simulator = ThreatSimulator()
classifier = ThreatClassifier()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles application startup and shutdown hooks."""
    logger.info("Initializing CyberGuard API...")
    
    # 1. Connect to MongoDB database
    await Database.connect()
    
    # 2. Check if simulator should be auto-started from environment config
    if settings.simulator_active:
        logger.info("Auto-starting Threat Simulator...")
        simulator.set_frequency(60.0)
        await simulator.start()
        
    yield
    
    # 3. Clean up connections and workers on shutdown
    logger.info("Shutting down CyberGuard API...")
    await simulator.stop()
    await Database.disconnect()

app = FastAPI(
    title="CyberGuard AI Threat Monitoring API",
    description="Backend threat classification, traffic simulation, and system analytics API.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adapt to specific hosts in production (e.g. netlify/vercel domains)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register authentication and WebSocket routers
app.include_router(auth_router)
app.include_router(threats_router)

# Configure Prometheus instrumentation middleware
instrumentator = Instrumentator(
    should_group_status_codes=False,
    should_ignore_untemplated=True,
    should_respect_env_var=True,
    env_var_name="ENABLE_METRICS",
    excluded_handlers=[".*admin.*", "/metrics", "/docs", "/openapi.json"]
)
instrumentator.instrument(app).expose(app, endpoint="/metrics")

# API Models
class ThreatClassifyRequest(BaseModel):
    ip: str = Field(..., example="198.51.100.12")
    method: str = Field(..., example="POST")
    path: str = Field(..., example="/login")
    payload: str = Field(..., example="{'username': 'admin', 'password': 'or 1=1'}")

class SimulatorConfig(BaseModel):
    frequency: float = Field(..., description="Simulation logs frequency per minute", example=120.0)

# Endpoints
@app.get("/")
async def root():
    """Root endpoint verifying API state."""
    db_connected = Database.logs_collection is not None
    return {
        "app": "CyberGuard Threat Monitoring API",
        "status": "online",
        "database_connected": db_connected,
        "simulator_active": simulator.active,
        "simulator_frequency_per_min": simulator.frequency_per_min
    }

@app.get("/api/v1/logs")
async def get_logs(
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    classification: Optional[str] = Query(None, description="Filter logs by classification (e.g. Normal, Brute Force)")
):
    """Retrieves logs from database with pagination and threat filtering."""
    try:
        logs = await Database.get_logs(limit=limit, skip=skip, classification=classification)
        return {"status": "success", "count": len(logs), "data": logs}
    except Exception as e:
        logger.error(f"Error serving GET /api/v1/logs: {e}")
        raise HTTPException(status_code=500, detail="Internal server error retrieving logs.")

@app.get("/api/v1/stats")
async def get_stats():
    """Returns aggregated threat metrics, prediction accuracy, and simulator configuration."""
    try:
        db_stats = await Database.get_stats()
        # Enrich stats with simulator status
        stats_response = {
            "status": "success",
            "data": {
                **db_stats,
                "simulator_active": simulator.active,
                "simulator_frequency": simulator.frequency_per_min,
                "system_uptime_seconds": 0 # Tracked client side or can be computed if needed
            }
        }
        return stats_response
    except Exception as e:
        logger.error(f"Error serving GET /api/v1/stats: {e}")
        raise HTTPException(status_code=500, detail="Internal server error compiling metrics.")

@app.post("/api/v1/threats/classify")
async def manual_classify_threat(request: ThreatClassifyRequest, current_user = Depends(require_role(["Admin"]))):
    """
    Manually classifies a custom traffic log payload,
    stores it in MongoDB, and increments Prometheus metrics counters.
    """
    try:
        recent_requests = await Database.get_recent_logs_by_ip(request.ip, limit=20)
        
        # Classify via the AI engine model
        classification, confidence, reason = classifier.classify(
            ip=request.ip,
            method=request.method,
            path=request.path,
            payload=request.payload,
            recent_requests=recent_requests
        )

        log_record = {
            "ip": request.ip,
            "method": request.method,
            "path": request.path,
            "payload": request.payload,
            "timestamp": None,  # Will be generated upon DB insertion
            "classification": classification,
            "confidence": confidence,
            "reason": reason
        }

        # Save to database
        import datetime
        log_record["timestamp"] = datetime.datetime.utcnow()
        inserted_id = await Database.add_log(log_record)
        log_record["_id"] = inserted_id

        # Increment Prometheus stats metrics
        REQUESTS_COUNTER.labels(classification=classification).inc()
        if classification != "Normal":
            THREATS_COUNTER.labels(threat_type=classification).inc()

        return {
            "status": "success",
            "data": {
                **log_record,
                "_id": str(inserted_id)
            }
        }
    except Exception as e:
        logger.error(f"Error serving POST /api/v1/threats/classify: {e}")
        raise HTTPException(status_code=500, detail="Internal server error classifying payload.")

@app.post("/api/v1/simulator/start")
async def start_simulator(current_user = Depends(require_role(["Admin"]))):
    """Toggles the traffic simulator loop to active."""
    try:
        await simulator.start()
        return {"status": "success", "message": "Simulator started.", "simulator_active": True}
    except Exception as e:
        logger.error(f"Failed to start simulator: {e}")
        raise HTTPException(status_code=500, detail="Could not start simulator service.")

@app.post("/api/v1/simulator/stop")
async def stop_simulator(current_user = Depends(require_role(["Admin"]))):
    """Toggles the traffic simulator loop to inactive."""
    try:
        await simulator.stop()
        return {"status": "success", "message": "Simulator stopped.", "simulator_active": False}
    except Exception as e:
        logger.error(f"Failed to stop simulator: {e}")
        raise HTTPException(status_code=500, detail="Could not stop simulator service.")

@app.post("/api/v1/simulator/config")
async def config_simulator(config: SimulatorConfig, current_user = Depends(require_role(["Admin"]))):
    """Adjusts log ingestion frequency rate dynamically (threats/logs per minute)."""
    try:
        simulator.set_frequency(config.frequency)
        return {
            "status": "success",
            "message": "Simulator configuration updated.",
            "frequency": simulator.frequency_per_min
        }
    except Exception as e:
        logger.error(f"Failed to config simulator: {e}")
        raise HTTPException(status_code=500, detail="Could not update simulator configuration.")

@app.post("/api/v1/logs/clear")
async def clear_logs(current_user = Depends(require_role(["Admin"]))):
    """Wipes all simulated logs and resets telemetry statistics."""
    try:
        cleared = await Database.clear_database()
        if cleared:
            return {"status": "success", "message": "Database logs collection wiped."}
        else:
            raise HTTPException(status_code=500, detail="Database clear operation failed.")
    except Exception as e:
        logger.error(f"Failed to clear logs: {e}")
        raise HTTPException(status_code=500, detail="Internal error clearing database collection.")
