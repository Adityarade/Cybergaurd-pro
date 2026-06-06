import logging
from typing import List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger("cyberguard-ws")
router = APIRouter(prefix="/api/v1/threats", tags=["threats-ws"])

class ConnectionManager:
    """Manages active WebSocket connections for real-time threat stream."""
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """Accepts a connection and registers the socket client."""
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"New client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """Deregisters a disconnected socket client."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"Client disconnected. Remaining clients: {len(self.active_connections)}")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Sends a JSON package to a single target client."""
        await websocket.send_json(message)

    async def broadcast(self, message: dict):
        """Broadcasts a JSON package to all connected clients."""
        logger.debug(f"Broadcasting message: {message}")
        # Make a copy of the list to prevent modification during iteration
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"Error broadcasting to connection, removing: {e}")
                self.disconnect(connection)

# Global connection manager singleton
manager = ConnectionManager()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket route accepting active telemetry stream subscriptions."""
    await manager.connect(websocket)
    try:
        while True:
            # We keep the connection open and listen for any messages from client (pings/heartbeats)
            data = await websocket.receive_text()
            # Echo or process if needed, currently clients just subscribe to logs
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")
        manager.disconnect(websocket)
