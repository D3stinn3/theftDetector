import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "theftdetectorbackend.settings")

from django.core.asgi import get_asgi_application
from streaming.ws import websocket_heartbeat_app

django_asgi = get_asgi_application()


async def application(scope, receive, send):
    path = (scope.get("path") or "").rstrip("/") or "/"
    if scope["type"] == "websocket" and path == "/ws":
        await websocket_heartbeat_app(scope, receive, send)
        return
    await django_asgi(scope, receive, send)
