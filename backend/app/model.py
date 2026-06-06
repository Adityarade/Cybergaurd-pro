import re
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple

class ThreatClassifier:
    """
    A lightweight, high-performance rule-based and statistical threat classification engine.
    Analyzes HTTP request metadata and payload signatures to detect anomalies
    without requiring heavy machine learning libraries, keeping the deployment light and fast.
    """

    # SQL Injection signatures (compiled regexes for performance)
    SQLI_PATTERNS = [
        re.compile(r"(?i)\b(union\s+all\s+select|union\s+select)\b"),
        re.compile(r"(?i)\b(select\s+.*\s+from)\b"),
        re.compile(r"(?i)\b(drop\s+table|alter\s+table|delete\s+from|insert\s+into|update\s+.*\s+set)\b"),
        re.compile(r"(?i)('\s*or\s*'\d+'\s*=\s*'\d+)"),
        re.compile(r"(?i)('\s*or\s*\d+\s*=\s*\d+)"),
        re.compile(r"(?i)(\bwaitfor\s+delay\b|\bpg_sleep\b|\bbenchmark\b)"),
        re.compile(r"(?i)(--|#|/\*|\*/|\bhex\b|\bchar\b|\bconvert\b)"),
    ]

    # Sensitive authentication paths
    AUTH_PATHS = ["/login", "/signin", "/admin/login", "/api/v1/auth", "/api/auth/token"]

    def __init__(self):
        pass

    def classify(
        self,
        ip: str,
        method: str,
        path: str,
        payload: str,
        recent_requests: Optional[List[Dict]] = None
    ) -> Tuple[str, float, str]:
        """
        Classifies an incoming request log into: Normal, SQL Injection, DDoS Attempt, or Brute Force.

        Args:
            ip: Source IP address of the request.
            method: HTTP Method (GET, POST, etc.).
            path: Target URL path.
            payload: Request query params or body string.
            recent_requests: Optional list of recent request logs from the same IP
                             to evaluate rate-based anomalies (DDoS/Brute Force).

        Returns:
            A tuple of (classification, confidence_score, reason_string)
        """
        # Default classification
        classification = "Normal"
        confidence = 0.95
        reason = "Request matches normal operating parameters."

        payload_str = str(payload or "")
        path_str = str(path or "")

        # 1. SQL Injection Detection (highest priority signature)
        sqli_matches = 0
        for pattern in self.SQLI_PATTERNS:
            if pattern.search(payload_str) or pattern.search(path_str):
                sqli_matches += 1

        if sqli_matches > 0:
            classification = "SQL Injection"
            # Scale confidence based on the number of matching SQL injection signatures
            confidence = min(0.70 + (sqli_matches * 0.10), 0.99)
            reason = f"Detected {sqli_matches} SQL injection patterns/keywords in request content."
            return classification, confidence, reason

        # 2. Rate-based analysis (requires recent requests history)
        if recent_requests:
            now = datetime.utcnow()
            # Filter logs from the last 10 seconds
            ten_secs_ago = now - timedelta(seconds=10)
            
            # Helper to parse logs with flexible timestamp keys (supports str and datetime)
            def parse_time(log_time):
                if isinstance(log_time, datetime):
                    return log_time
                try:
                    return datetime.fromisoformat(str(log_time).replace("Z", "+00:00")).replace(tzinfo=None)
                except ValueError:
                    return now

            recent_in_10s = [
                r for r in recent_requests 
                if parse_time(r.get("timestamp")) >= ten_secs_ago
            ]

            # DDoS Detection
            # If the IP address has generated a flood of requests in a very short window (e.g. > 10 requests in 10s)
            if len(recent_in_10s) >= 10:
                classification = "DDoS Attempt"
                # Scale confidence by request density
                confidence = min(0.80 + (len(recent_in_10s) * 0.01), 0.99)
                reason = f"High frequency traffic detected: IP generated {len(recent_in_10s)} requests in the last 10 seconds."
                return classification, confidence, reason

            # Brute Force Detection
            # If requesting an auth endpoint repeatedly (e.g. > 4 login attempts in 10s)
            auth_requests_in_10s = [
                r for r in recent_in_10s
                if any(auth_p in r.get("path", "") for auth_p in self.AUTH_PATHS)
                and r.get("method") == "POST"
            ]

            if len(auth_requests_in_10s) >= 4:
                classification = "Brute Force"
                confidence = min(0.85 + (len(auth_requests_in_10s) * 0.02), 0.99)
                reason = f"Suspicious authentication rate: {len(auth_requests_in_10s)} login requests detected in 10 seconds."
                return classification, confidence, reason

        # 3. Payload-based Brute Force indicators (fallback if history is unavailable but content is highly suspicious)
        if any(auth_p in path_str for auth_p in self.AUTH_PATHS) and method == "POST":
            # Look for common automated scanner or brute force tool strings in payloads
            suspicious_creds = ["admin", "root", "administrator", "password123", "123456", "test", "guest"]
            matched_sus = [s for s in suspicious_creds if s in payload_str.lower()]
            if len(matched_sus) >= 2:
                classification = "Brute Force"
                confidence = 0.75
                reason = "Authentication request contains multiple default/weak credential strings."
                return classification, confidence, reason

        # 4. Check for payload size anomalies (DDoS proxy fallback)
        if len(payload_str) > 15000:
            classification = "DDoS Attempt"
            confidence = 0.80
            reason = f"Anomalous payload size of {len(payload_str)} bytes detected (potential buffer overflow or resource depletion attack)."
            return classification, confidence, reason

        return classification, confidence, reason
