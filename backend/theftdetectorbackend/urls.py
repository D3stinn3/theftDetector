from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, re_path
from django.views.generic import RedirectView
from django.views.static import serve
from django.conf import settings
from theftdetectorbackend.api import api


def ws_upgrade_hint(_request):
    return JsonResponse(
        {
            "status": "error",
            "message": "This endpoint requires a WebSocket upgrade. Connect with ws://.../ws instead of HTTP GET.",
        },
        status=426,
    )


urlpatterns = [
    path("admin/", admin.site.urls),
    path("", api.urls),
    re_path(r"^api/v1/(?P<path>.*)$", RedirectView.as_view(url="/%(path)s", permanent=False)),
    path("api", RedirectView.as_view(url="/docs", permanent=False)),
    path("ws", ws_upgrade_hint),
    path("ws/", ws_upgrade_hint),
    path("alerts/<path:path>", serve, {"document_root": settings.REPO_ROOT / "alerts"}),
]
