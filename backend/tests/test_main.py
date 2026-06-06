import sys
import os
import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

# Ensure the parent app folder is in path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.model import ThreatClassifier
from app.main import app
from app.database import Database
from app.core.dependencies import get_current_user, User

client = TestClient(app)

# Helper to configure authentication override for test client
def set_auth_override(username="test_admin", role="Admin"):
    app.dependency_overrides[get_current_user] = lambda: User(username=username, role=role)

def clear_auth_override():
    app.dependency_overrides.clear()


def test_classifier_normal_request():
    """Verifies that normal requests are classified correctly by model."""
    classifier = ThreatClassifier()
    classification, confidence, reason = classifier.classify(
        ip="192.168.1.50",
        method="GET",
        path="/api/v1/dashboard",
        payload="?page=1"
    )
    assert classification == "Normal"
    assert confidence >= 0.90
    assert "normal" in reason.lower()


def test_classifier_sql_injection():
    """Verifies detection of SQL injection keywords in payload."""
    classifier = ThreatClassifier()
    classification, confidence, reason = classifier.classify(
        ip="198.51.100.12",
        method="GET",
        path="/api/v1/search",
        payload="' UNION SELECT username, password FROM users --"
    )
    assert classification == "SQL Injection"
    assert confidence > 0.70
    assert "SQL injection" in reason


def test_classifier_payload_brute_force():
    """Verifies detection of brute force signatures inside requests."""
    classifier = ThreatClassifier()
    classification, confidence, reason = classifier.classify(
        ip="198.51.100.12",
        method="POST",
        path="/login",
        payload='{"username": "admin", "password": "password123"}'
    )
    assert classification == "Brute Force"
    assert confidence >= 0.70
    assert "credential" in reason.lower()


def test_classifier_ddos_rate_limit():
    """Verifies rate-based DDoS detection using simulated past request context."""
    classifier = ThreatClassifier()
    recent_requests = []
    now = datetime.utcnow()
    # Generate 15 requests in the last 2 seconds from the same IP
    for i in range(15):
        recent_requests.append({
            "ip": "198.51.100.80",
            "method": "GET",
            "path": f"/index.html?r={i}",
            "payload": "",
            "timestamp": (now - timedelta(seconds=1)).isoformat()
        })
    
    classification, confidence, reason = classifier.classify(
        ip="198.51.100.80",
        method="GET",
        path="/index.html",
        payload="",
        recent_requests=recent_requests
    )
    assert classification == "DDoS Attempt"
    assert confidence >= 0.80
    assert "high frequency" in reason.lower()


def test_root_endpoint():
    """Verifies root status endpoint operates correctly."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "CyberGuard Threat Monitoring API"
    assert "status" in data
    assert "simulator_active" in data


@pytest.mark.asyncio
async def test_manual_classify_endpoint_unauthorized():
    """Verifies manual classify fails if user is not authenticated."""
    clear_auth_override()
    payload = {
        "ip": "198.51.100.12",
        "method": "POST",
        "path": "/api/v1/search",
        "payload": "1' OR '1'='1"
    }
    response = client.post("/api/v1/threats/classify", json=payload)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_manual_classify_endpoint_forbidden_for_viewer():
    """Verifies manual classify fails with 403 for Viewer role."""
    set_auth_override(role="Viewer")
    payload = {
        "ip": "198.51.100.12",
        "method": "POST",
        "path": "/api/v1/search",
        "payload": "1' OR '1'='1"
    }
    response = client.post("/api/v1/threats/classify", json=payload)
    assert response.status_code == 403
    clear_auth_override()


@pytest.mark.asyncio
async def test_manual_classify_endpoint_success_for_admin(monkeypatch):
    """Mocks database and tests classification success with Admin credentials override."""
    async def mock_add_log(log_data):
        return "mock_object_id_12345"
        
    async def mock_get_recent_logs_by_ip(ip, limit=20):
        return []

    monkeypatch.setattr(Database, "add_log", mock_add_log)
    monkeypatch.setattr(Database, "get_recent_logs_by_ip", mock_get_recent_logs_by_ip)

    set_auth_override(role="Admin")
    
    payload = {
        "ip": "198.51.100.12",
        "method": "POST",
        "path": "/api/v1/search",
        "payload": "1' OR '1'='1"
    }
    response = client.post("/api/v1/threats/classify", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["data"]["classification"] == "SQL Injection"
    assert data["data"]["_id"] == "mock_object_id_12345"
    
    clear_auth_override()


@pytest.mark.asyncio
async def test_auth_signup_login():
    """Tests the full user signup and JSON login authentication cycle."""
    # Clean/mock user check inside Database
    test_user_record = None
    
    async def mock_get_user(username):
        if username == "new_analyst":
            return test_user_record
        return None
        
    async def mock_create_user(user_data):
        nonlocal test_user_record
        test_user_record = user_data
        return True

    # Use monkeypatch via global Database refs if needed, but since it's a test client we can mock directly on Database class
    import app.database as db
    db._in_memory_users.clear() # clear memory store to clean state
    
    # 1. Signup
    signup_payload = {
        "username": "new_analyst",
        "password": "strongpassword",
        "role": "Viewer"
    }
    response = client.post("/api/v1/auth/signup", json=signup_payload)
    assert response.status_code == 201
    
    # 2. Login
    login_payload = {
        "username": "new_analyst",
        "password": "strongpassword"
    }
    response = client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "new_analyst"
    assert data["role"] == "Viewer"
    assert "access_token" in data
