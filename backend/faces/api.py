from pathlib import Path
from uuid import uuid4

from ninja import File, Form
from ninja.files import UploadedFile
from ninja_extra import api_controller, http_delete, http_get, http_post

from django.conf import settings
from faces.models import FaceEntry


FACES_DIR = settings.REPO_ROOT / "faces_registry"
FACES_DIR.mkdir(parents=True, exist_ok=True)


@api_controller("/faces", tags=["faces"])
class FacesController:
    @http_get("")
    def list_faces(self):
        rows = FaceEntry.objects.all().order_by("-created_at")
        return [{"id": r.id, "name": r.name, "type": r.type} for r in rows]

    @http_post("/register")
    def register_face(
        self,
        request,
        file: UploadedFile = File(...),
        name: str = Form(...),
        type: str = Form("blacklist"),
    ):
        suffix = Path(file.name or "face.jpg").suffix or ".jpg"
        filename = f"{uuid4().hex}{suffix}"
        destination = FACES_DIR / filename
        with destination.open("wb") as f:
            f.write(file.read())
        face_id = uuid4().hex
        FaceEntry.objects.update_or_create(
            id=face_id,
            defaults={"name": name, "type": type, "image_path": str(destination)},
        )
        return {"status": "success", "message": "Face image stored.", "name": name, "type": type}

    @http_delete("/{face_id}")
    def delete_face(self, face_id: str):
        FaceEntry.objects.filter(id=face_id).delete()
        return {"status": "success", "message": f"Face {face_id} removed."}
