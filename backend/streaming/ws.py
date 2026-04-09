from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime

from cameras.runtime import camera_runtime

logger = logging.getLogger(__name__)


async def websocket_heartbeat_app(scope, receive, send):
    """
    Minimal ASGI websocket endpoint compatible with current UI payload shape.
    Sends empty camera frames heartbeat while Django APIs are migrated.
    """
    if scope["type"] != "websocket":
        return

    await send({"type": "websocket.accept"})
    camera_runtime.ensure_loaded()
    heartbeat_count = 0
    try:
        while True:
            try:
                event = await asyncio.wait_for(receive(), timeout=0.01)
                if event["type"] == "websocket.disconnect":
                    break
            except asyncio.TimeoutError:
                pass
            frames = camera_runtime.get_ws_frames()
            diagnostics = camera_runtime.get_runtime_diagnostics()
            errors = [
                {"id": c.get("id"), "name": c.get("name"), "lastError": c.get("lastError")}
                for c in diagnostics.get("cameras", [])
                if c.get("lastError")
            ]
            heartbeat_count += 1
            if heartbeat_count == 1 or heartbeat_count % 10 == 0:
                logger.info(
                    "ws heartbeat: frames=%s cameras=%s errors=%s",
                    len(frames),
                    diagnostics.get("count", 0),
                    len(errors),
                )
            payload = {
                "type": "multi_frame",
                "cameras": frames,
                "streamStats": {
                    "frameCount": len(frames),
                    "cameraCount": diagnostics.get("count", 0),
                    "cameraErrors": errors,
                },
                "alert": {
                    "id": f"heartbeat-{int(datetime.utcnow().timestamp())}",
                    "message": "Django recreation backend connected.",
                    "timestamp": datetime.utcnow().isoformat(),
                },
            }
            await send({"type": "websocket.send", "text": json.dumps(payload)})
            await asyncio.sleep(1.0)
    except Exception:
        await send({"type": "websocket.close"})
