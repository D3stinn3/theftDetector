from ninja import Schema
from ninja_extra import api_controller, http_delete, http_get, http_post

from core.legacy import legacy_db_rows


class RegisterDatasetPathInput(Schema):
    name: str
    localPath: str | None = None
    path: str | None = None
    taskType: str | None = None
    notes: str | None = None


@api_controller("/playback", tags=["playback"])
class PlaybackController:
    @http_get("/jobs")
    def list_playback_jobs(self):
        return []

    @http_get("/jobs/{job_id}")
    def get_playback_job(self, job_id: str):
        return {"id": job_id, "status": "unknown"}

    @http_post("/upload")
    def upload_playback(self, payload: dict | None = None):
        import uuid
        job_id = f"playback_{uuid.uuid4().hex[:10]}"
        return {"status": "success", "message": "Playback upload accepted.", "jobId": job_id, "payload": payload or {}}


@api_controller("/training", tags=["training"])
class TrainingController:
    @http_post("/datasets/upload")
    def upload_dataset(self):
        import uuid
        dataset_id = uuid.uuid4().hex
        return {"id": dataset_id, "name": "Uploaded dataset", "status": "ready", "message": "Dataset uploaded."}

    @http_get("/datasets")
    def list_datasets(self):
        return legacy_db_rows("SELECT * FROM training_datasets ORDER BY created_at DESC")

    @http_get("/datasets/{dataset_id}")
    def get_dataset(self, dataset_id: str):
        rows = legacy_db_rows("SELECT * FROM training_datasets WHERE id = ?", (dataset_id,))
        return rows[0] if rows else {"id": dataset_id, "status": "unknown"}

    @http_post("/datasets/register-path")
    def register_dataset_path(self, payload: RegisterDatasetPathInput):
        import uuid
        dataset_id = uuid.uuid4().hex
        resolved_path = payload.localPath or payload.path or ""
        return {
            "id": dataset_id,
            "message": "Dataset path registered (recreated backend placeholder).",
            "name": payload.name,
            "localPath": resolved_path,
            "status": "ready",
        }

    @http_post("/datasets/{dataset_id}/validate")
    def validate_dataset(self, dataset_id: str):
        return {"status": "success", "message": f"Dataset {dataset_id} validated and ready."}

    @http_get("/jobs")
    def list_jobs(self):
        return legacy_db_rows("SELECT * FROM training_jobs ORDER BY created_at DESC")

    @http_get("/jobs/{job_id}")
    def get_job(self, job_id: str):
        rows = legacy_db_rows("SELECT * FROM training_jobs WHERE id = ?", (job_id,))
        return rows[0] if rows else {"id": job_id, "status": "unknown"}

    @http_post("/jobs")
    def create_job(self, payload: dict):
        return {"status": "success", "message": "Training job queued.", "payload": payload}

    @http_get("/jobs/{job_id}/logs")
    def get_logs(self, job_id: str):
        return legacy_db_rows("SELECT * FROM training_logs WHERE job_id = ? ORDER BY ts ASC", (job_id,))

    @http_post("/jobs/{job_id}/cancel")
    def cancel_job(self, job_id: str):
        return {"status": "success", "message": f"Cancel requested for job {job_id}."}

    @http_post("/jobs/{job_id}/resume")
    def resume_job(self, job_id: str):
        return {"status": "success", "message": f"Resume requested for job {job_id}.", "job": {"id": job_id}}

    @http_post("/jobs/{job_id}")
    def post_job(self, job_id: str):
        return {"status": "success", "message": f"Job {job_id} updated."}

    @http_delete("/jobs/{job_id}")
    def delete_job(self, job_id: str):
        return {"status": "success", "message": f"Job {job_id} deleted."}

    @http_get("/devices")
    def devices(self):
        return {
            "defaultDevice": "cpu",
            "devices": [{"id": "cpu", "label": "CPU", "available": True}],
            "cudaHealthy": False,
            "diagnostic": None,
        }

    @http_get("/artifacts")
    def artifacts(self):
        return legacy_db_rows("SELECT * FROM training_artifacts ORDER BY created_at DESC")

    @http_post("/artifacts/{artifact_id}/promote")
    def promote_artifact(self, artifact_id: str, payload: dict | None = None):
        return {"status": "success", "message": f"Artifact {artifact_id} promoted.", "payload": payload or {}}
