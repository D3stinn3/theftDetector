from ninja_extra import api_controller, http_get

from alerts.models import Alert


@api_controller("/history", tags=["alerts"])
class HistoryController:
    @http_get("")
    def get_history(self):
        rows = Alert.objects.all().order_by("-timestamp")[:100]
        return [
            {
                "id": row.id,
                "message": row.message,
                "timestamp": row.timestamp,
                "image_path": row.image_path,
            }
            for row in rows
        ]
