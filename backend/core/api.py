from __future__ import annotations

from datetime import datetime, timedelta

from ninja_extra import api_controller, http_get, http_post

from alerts.models import Alert
from core.legacy import load_runtime_settings, save_runtime_settings
from core.schemas import MessageResponse


@api_controller("/health", tags=["core"])
class HealthController:
    @http_get("")
    def health(self):
        return {"status": "ok", "service": "django-ninja-extra"}


@api_controller("/settings", tags=["core"])
class SettingsController:
    @http_get("")
    def get_settings(self):
        return load_runtime_settings()

    @http_post("", response=MessageResponse)
    def save_settings(self, payload: dict):
        save_runtime_settings(payload)
        return MessageResponse(message="Settings saved.")

    @http_post("/test", response=MessageResponse)
    def test_settings(self, payload: dict):
        email_ok = bool(payload.get("emailEnabled"))
        telegram_ok = bool(payload.get("telegramEnabled"))
        if not email_ok and not telegram_ok:
            return MessageResponse(status="warning", message="No channels enabled for test notification.")
        return MessageResponse(message="Test notification request accepted.")


@api_controller("/roi", tags=["core"])
class RoiController:
    @http_get("")
    def get_roi(self):
        settings_data = load_runtime_settings()
        points = settings_data.get("roiPoints", [])
        return {"points": points, "roiPoints": points}

    @http_post("", response=MessageResponse)
    def set_roi(self, payload: dict):
        settings_data = load_runtime_settings()
        settings_data["roiPoints"] = payload.get("roiPoints", payload.get("points", []))
        save_runtime_settings(settings_data)
        return MessageResponse(message="ROI points updated.")


@api_controller("/stats", tags=["core"])
class StatsController:
    @http_get("")
    def get_stats(self):
        timestamps = list(Alert.objects.values_list("timestamp", flat=True))
        today = datetime.utcnow().date()
        buckets = [(today - timedelta(days=i)) for i in range(6, -1, -1)]
        counts = {d.isoformat(): 0 for d in buckets}
        for raw_ts in timestamps:
            if not raw_ts:
                continue
            day_key = str(raw_ts)[:10]
            if day_key in counts:
                counts[day_key] += 1
        return {"weekly_data": [counts[d.isoformat()] for d in buckets]}
