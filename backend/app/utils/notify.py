import os
import logging
import httpx
from datetime import datetime

logger = logging.getLogger("cyberguard-notify")

# Load webhook URL from environment configuration
WEBHOOK_URL = os.getenv("SOAR_WEBHOOK_URL", "")

async def send_slack_discord_webhook(classification: str, ip: str, timestamp: str) -> bool:
    """
    Asynchronously fires a SOAR notification to Slack or Discord webhook.
    Formulates rich markdown notification summarizing classification details.
    """
    if not WEBHOOK_URL:
        # Default behavior: log payload detail to warning console when webhook URL is not provided
        logger.info(
            f"[SOAR Alert Simulation] 🚨 Critical Threat Level Triggered | "
            f"Vector: {classification} | IP: {ip} | Time: {timestamp}"
        )
        return True

    # Construct clean markdown alert layout
    alert_text = (
        f"🚨 **Critical Threat Level Triggered**\n"
        f"**Attack Vector:** `{classification}`\n"
        f"**Source IP:** `{ip}`\n"
        f"**Timestamp:** `{timestamp}`\n"
        f"**Action Taken:** Logged & Quarantined via CyberGuard Pro AI"
    )

    # Determine if it's Slack or Discord webhook format
    payload = {}
    if "hooks.slack.com" in WEBHOOK_URL:
        payload = {"text": alert_text}
    else:
        # Default Discord/Custom webhook json schema
        payload = {"content": alert_text}

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(WEBHOOK_URL, json=payload)
            if response.status_code in [200, 201, 204]:
                logger.info(f"SOAR notification successfully sent to {WEBHOOK_URL}")
                return True
            else:
                logger.error(f"Failed to post webhook. Status: {response.status_code}, Body: {response.text}")
                return False
    except Exception as e:
        logger.error(f"Network error invoking SOAR Webhook: {e}")
        return False
