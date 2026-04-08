from pathlib import Path
from uuid import uuid4
from datetime import datetime
import shutil

from django.conf import settings
from ninja import File, Form, Schema
from ninja.files import UploadedFile
from ninja_extra import api_controller, http_delete, http_get, http_post
from django.http import JsonResponse

from training.models import TrainingArtifact, TrainingDataset, TrainingJob, TrainingLog
from training.dataset_utils import inspect_yolo_dataset, normalize_uploaded_yolo_dataset
from training.worker import append_training_log, promote_artifact_to_active_model, training_worker

try:
    import torch  # type: ignore
except Exception:  # pragma: no cover - torch may be unavailable in some environments
    torch = None


class RegisterDatasetPathInput(Schema):
    name: str
    localPath: str | None = None
    path: str | None = None
    taskType: str | None = None
    notes: str | None = None


def _admin_only(request):
    if not request.user.is_authenticated:
        return JsonResponse({"status": "error", "message": "Authentication required."}, status=401)
    if not request.user.is_staff:
        return JsonResponse({"status": "error", "message": "Admin access required."}, status=403)
    return None


def get_training_device_capabilities() -> dict:
    devices = [{"id": "cpu", "label": "CPU", "available": True}]
    cuda_healthy = False
    diagnostic = None

    try:
        if torch is None:
            raise RuntimeError("PyTorch is not installed in this backend environment.")

        cuda_available = bool(torch.cuda.is_available())
        device_count = int(torch.cuda.device_count())
        if cuda_available and device_count > 0:
            device_name = torch.cuda.get_device_name(0)
            devices.append(
                {
                    "id": "cuda:0",
                    "label": f"CUDA / GPU ({device_name})",
                    "available": True,
                    "reason": None,
                }
            )
            cuda_healthy = True
        else:
            diagnostic = (
                f"CUDA unavailable. torch.cuda.is_available()={cuda_available}, "
                f"torch.cuda.device_count()={device_count}"
            )
            devices.append(
                {
                    "id": "cuda:0",
                    "label": "CUDA / GPU",
                    "available": False,
                    "reason": diagnostic,
                }
            )
    except Exception as exc:
        diagnostic = f"CUDA initialization failed: {exc}"
        devices.append(
            {
                "id": "cuda:0",
                "label": "CUDA / GPU",
                "available": False,
                "reason": diagnostic,
            }
        )

    default_device = "cuda:0" if cuda_healthy else "cpu"
    return {
        "defaultDevice": default_device,
        "devices": devices,
        "cudaHealthy": cuda_healthy,
        "diagnostic": diagnostic,
    }


def normalize_training_device(requested_device: str | None) -> str:
    value = str(requested_device or "cpu").strip().lower()
    if value in {"cpu"}:
        return "cpu"
    if value in {"cuda", "cuda:0", "0"}:
        return "cuda:0"
    raise ValueError(f"Unsupported training device '{requested_device}'. Use CPU or a valid CUDA device.")


def require_usable_training_device(requested_device: str | None) -> str:
    normalized = normalize_training_device(requested_device)
    if normalized == "cpu":
        return normalized

    capabilities = get_training_device_capabilities()
    if not capabilities.get("cudaHealthy"):
        raise ValueError(
            "CUDA was requested, but the backend runtime cannot initialize GPU training. "
            "Use CPU or fix the CUDA environment."
        )
    return normalized


def _ensure_local_path_for_uploaded_dataset(row: TrainingDataset) -> str | None:
    """Backfill extracted workspace for older upload records missing local_path."""
    if row.local_path and Path(row.local_path).is_dir():
        return row.local_path
    if row.source_type != "upload" or not row.archive_path:
        return None

    archive = Path(row.archive_path)
    if not archive.is_file():
        return None

    workspace_dir = Path(settings.BASE_DIR) / "media" / "training_workspace"
    workspace_dir.mkdir(parents=True, exist_ok=True)
    extract_dir = workspace_dir / f"dataset_{row.id}"
    extract_dir.mkdir(parents=True, exist_ok=True)

    try:
        shutil.unpack_archive(str(archive), str(extract_dir))
    except Exception:
        return None

    row.local_path = str(extract_dir)
    row.save(update_fields=["local_path"])
    return row.local_path


@api_controller("/playback", tags=["playback"])
class PlaybackController:
    @http_get("/jobs")
    def list_playback_jobs(self):
        return []

    @http_get("/jobs/{job_id}")
    def get_playback_job(self, job_id: str):
        return {"id": job_id, "status": "unknown"}

    @http_post("/upload")
    def upload_playback(self, request, payload: dict | None = None):
        guard = _admin_only(request)
        if guard:
            return guard
        import uuid
        job_id = f"playback_{uuid.uuid4().hex[:10]}"
        return {"status": "success", "message": "Playback upload accepted.", "jobId": job_id, "payload": payload or {}}


@api_controller("/training", tags=["training"])
class TrainingController:
    @http_post("/datasets/upload")
    def upload_dataset(
        self,
        request,
        file: UploadedFile = File(...),
        name: str = Form(""),
        taskType: str = Form("detect"),
        notes: str = Form(""),
    ):
        guard = _admin_only(request)
        if guard:
            return guard
        dataset_id = uuid4().hex
        uploads_dir = Path(settings.BASE_DIR) / "media" / "training_datasets"
        workspace_dir = Path(settings.BASE_DIR) / "media" / "training_workspace"
        uploads_dir.mkdir(parents=True, exist_ok=True)
        workspace_dir.mkdir(parents=True, exist_ok=True)
        safe_filename = Path(file.name or f"{dataset_id}.zip").name
        archive_path = uploads_dir / f"{dataset_id}_{safe_filename}"
        extract_dir = workspace_dir / f"dataset_{dataset_id}"
        with archive_path.open("wb") as f:
            f.write(file.read())

        extract_dir.mkdir(parents=True, exist_ok=True)
        extracted = False
        try:
            shutil.unpack_archive(str(archive_path), str(extract_dir))
            extracted = True
        except Exception:
            extracted = False

        detected_format = "unknown"
        sample_count = 0
        class_count = 0
        status = "unsupported"
        local_path: str | None = None
        if extracted:
            normalize_uploaded_yolo_dataset(str(extract_dir))
            inspection = inspect_yolo_dataset(str(extract_dir))
            detected_format = inspection.detected_format
            sample_count = inspection.sample_count
            class_count = inspection.class_count
            status = "ready" if detected_format == "yolo" else "uploaded"
            local_path = str(extract_dir)

        dataset_name = (name or "").strip() or Path(safe_filename).stem or "Dataset"
        dataset = TrainingDataset.objects.create(
            id=dataset_id,
            name=dataset_name,
            source_type="upload",
            local_path=local_path,
            archive_path=str(archive_path),
            detected_format=detected_format,
            status=status,
            sample_count=sample_count,
            class_count=class_count,
            created_at=datetime.now().isoformat(),
            task_type=(taskType or "detect"),
            notes=notes or "",
        )
        return {
            "id": dataset.id,
            "name": dataset.name,
            "status": dataset.status,
            "detectedFormat": dataset.detected_format,
            "sampleCount": dataset.sample_count,
            "classCount": dataset.class_count,
            "message": "Dataset uploaded.",
        }

    @http_get("/datasets")
    def list_datasets(self):
        rows = TrainingDataset.objects.all().order_by("-created_at")
        return [_dataset_to_dict(r) for r in rows]

    @http_get("/datasets/{dataset_id}")
    def get_dataset(self, dataset_id: str):
        row = TrainingDataset.objects.filter(id=dataset_id).first()
        return _dataset_to_dict(row) if row else {"id": dataset_id, "status": "unknown"}

    @http_post("/datasets/register-path")
    def register_dataset_path(self, request, payload: RegisterDatasetPathInput):
        guard = _admin_only(request)
        if guard:
            return guard
        dataset_id = uuid4().hex
        resolved_path = (payload.localPath or payload.path or "").strip()
        if not resolved_path or not Path(resolved_path).is_dir():
            return JsonResponse({"status": "error", "message": "Dataset path does not exist or is not a directory."}, status=400)

        inspection = inspect_yolo_dataset(resolved_path)
        detected_format = inspection.detected_format
        sample_count = inspection.sample_count
        class_count = inspection.class_count
        status = "ready" if detected_format == "yolo" else ("needs_preprocessing" if detected_format == "generic_media" else "unsupported")
        TrainingDataset.objects.update_or_create(
            id=dataset_id,
            defaults={
                "name": payload.name,
                "local_path": resolved_path,
                "source_type": "local_path",
                "archive_path": None,
                "detected_format": detected_format,
                "status": status,
                "sample_count": sample_count,
                "class_count": class_count,
                "created_at": datetime.now().isoformat(),
                "task_type": payload.taskType,
                "notes": payload.notes,
            },
        )
        return {
            "id": dataset_id,
            "message": "Dataset path registered.",
            "name": payload.name,
            "localPath": resolved_path,
            "status": status,
            "detectedFormat": detected_format,
            "sampleCount": sample_count,
            "classCount": class_count,
        }

    @http_post("/datasets/{dataset_id}/validate")
    def validate_dataset(self, request, dataset_id: str):
        guard = _admin_only(request)
        if guard:
            return guard
        row = TrainingDataset.objects.filter(id=dataset_id).first()
        if not row:
            return JsonResponse({"status": "error", "message": "Dataset not found."}, status=404)
        local_path = _ensure_local_path_for_uploaded_dataset(row)
        if not local_path:
            local_path = row.local_path
        if not local_path or not Path(local_path).is_dir():
            return JsonResponse({"status": "error", "message": "Dataset is not available on disk."}, status=400)

        if row.source_type == "upload":
            normalize_uploaded_yolo_dataset(local_path)
        inspection = inspect_yolo_dataset(local_path)
        detected_format = inspection.detected_format
        sample_count = inspection.sample_count
        class_count = inspection.class_count
        status = "ready" if detected_format == "yolo" else ("needs_preprocessing" if detected_format == "generic_media" else "unsupported")

        row.detected_format = detected_format
        row.sample_count = sample_count
        row.class_count = class_count
        row.status = status
        row.save(update_fields=["detected_format", "sample_count", "class_count", "status"])
        detail = inspection.message or f"Validation complete. Status: {status}."
        return {"status": "success", "message": detail}

    @http_get("/jobs")
    def list_jobs(self):
        rows = TrainingJob.objects.all().order_by("-created_at")
        return [_job_to_dict(r) for r in rows]

    @http_get("/jobs/{job_id}")
    def get_job(self, job_id: str):
        row = TrainingJob.objects.filter(id=job_id).first()
        return _job_to_dict(row) if row else {"id": job_id, "status": "unknown"}

    @http_post("/jobs")
    def create_job(self, request, payload: dict):
        guard = _admin_only(request)
        if guard:
            return guard
        dataset_id = str(payload.get("datasetId", ""))
        dataset = TrainingDataset.objects.filter(id=dataset_id).first()
        if not dataset:
            return JsonResponse({"status": "error", "message": "Dataset not found."}, status=404)
        if dataset.local_path and Path(dataset.local_path).is_dir():
            inspection = inspect_yolo_dataset(dataset.local_path)
            if inspection.detected_format != "yolo":
                return JsonResponse({"status": "error", "message": inspection.message or f"Dataset is not ready for training: {dataset.status}"}, status=400)
        if dataset.status not in ("ready", "validated"):
            return JsonResponse({"status": "error", "message": f"Dataset is not ready for training: {dataset.status}"}, status=400)
        try:
            resolved_device = require_usable_training_device(str(payload.get("device", "cpu")))
        except ValueError as exc:
            return JsonResponse({"status": "error", "message": str(exc)}, status=400)
        job_id = uuid4().hex
        TrainingJob.objects.create(
            id=job_id,
            dataset_id=dataset.id,
            dataset_name=dataset.name,
            base_model=str(payload.get("baseModel", "")),
            task_type=str(payload.get("taskType", "detect")),
            status="queued",
            progress=0.0,
            phase="Queued",
            device=resolved_device,
            created_at=datetime.now().isoformat(),
            params=payload,
            cancel_requested=False,
        )
        append_training_log(job_id, "INFO", "Job queued from dashboard.")
        training_worker.notify()
        return {"status": "success", "message": "Training job queued.", "id": job_id}

    @http_get("/jobs/{job_id}/logs")
    def get_logs(self, job_id: str):
        rows = TrainingLog.objects.filter(job_id=job_id).order_by("-ts")[:100]
        return [_log_to_dict(r) for r in rows]

    @http_post("/jobs/{job_id}/cancel")
    def cancel_job(self, request, job_id: str):
        guard = _admin_only(request)
        if guard:
            return guard
        row = TrainingJob.objects.filter(id=job_id).first()
        if not row:
            return JsonResponse({"status": "error", "message": "Training job not found."}, status=404)
        if row.status in ("completed", "failed", "cancelled"):
            return {"status": "success", "message": f"Job already {row.status}."}
        if row.status == "queued":
            row.status = "cancelled"
            row.phase = "Cancelled"
            row.finished_at = datetime.now().isoformat()
            row.error = "Cancelled from dashboard."
            row.cancel_requested = False
            row.save(update_fields=["status", "phase", "finished_at", "error", "cancel_requested"])
            append_training_log(job_id, "WARN", "Queued job cancelled from dashboard.")
            return {"status": "success", "message": "Queued job cancelled."}
        row.status = "stopping"
        row.phase = "Stop requested"
        row.cancel_requested = True
        row.error = "Stop requested from dashboard."
        row.save(update_fields=["status", "phase", "cancel_requested", "error"])
        append_training_log(job_id, "WARN", "Stop requested from dashboard. Training will halt after the current safe checkpoint.")
        return {"status": "success", "message": "Stop requested. Training will stop after the current safe checkpoint."}

    @http_post("/jobs/{job_id}/resume")
    def resume_job(self, request, job_id: str):
        guard = _admin_only(request)
        if guard:
            return guard
        row = TrainingJob.objects.filter(id=job_id).first()
        if not row:
            return JsonResponse({"status": "error", "message": "Training job not found."}, status=404)
        checkpoint = TrainingArtifact.objects.filter(job_id=job_id, kind="resume_checkpoint").order_by("-created_at").first()
        if not checkpoint or not checkpoint.path or not Path(checkpoint.path).is_file():
            return JsonResponse({"status": "error", "message": "No resume checkpoint is available for this job."}, status=400)

        params = dict(row.params or {})
        params["resumeCheckpointPath"] = checkpoint.path
        new_job_id = uuid4().hex
        new_job = TrainingJob.objects.create(
            id=new_job_id,
            dataset_id=row.dataset_id,
            dataset_name=row.dataset_name,
            base_model=checkpoint.path,
            task_type=row.task_type,
            status="queued",
            progress=0.0,
            phase="Queued to resume",
            device=row.device or "cpu",
            created_at=datetime.now().isoformat(),
            params=params,
            cancel_requested=False,
        )
        append_training_log(new_job_id, "INFO", f"Resume job queued from checkpoint {checkpoint.path}.")
        training_worker.notify()
        return {"status": "success", "message": "Resume job queued from latest checkpoint.", "job": _job_to_dict(new_job)}

    @http_post("/jobs/{job_id}")
    def post_job(self, request, job_id: str):
        guard = _admin_only(request)
        if guard:
            return guard
        return {"status": "success", "message": f"Job {job_id} updated."}

    @http_delete("/jobs/{job_id}")
    def delete_job(self, request, job_id: str):
        guard = _admin_only(request)
        if guard:
            return guard
        row = TrainingJob.objects.filter(id=job_id).first()
        if not row:
            return JsonResponse({"status": "error", "message": "Training job not found."}, status=404)
        if row.status in ("running", "stopping"):
            return JsonResponse(
                {"status": "error", "message": "Cannot delete a job that is running or stopping. Cancel it first, then delete the record."},
                status=409,
            )
        paths = list(TrainingArtifact.objects.filter(job_id=job_id).values_list("path", flat=True))
        TrainingLog.objects.filter(job_id=job_id).delete()
        TrainingArtifact.objects.filter(job_id=job_id).delete()
        TrainingJob.objects.filter(id=job_id).delete()
        for p in paths:
            try:
                pp = Path(p)
                if pp.is_file():
                    pp.unlink()
            except Exception:
                pass
        return {"status": "success", "message": "Job deleted."}

    @http_get("/devices")
    def devices(self):
        return get_training_device_capabilities()

    @http_get("/artifacts")
    def artifacts(self):
        rows = TrainingArtifact.objects.all().order_by("-created_at")
        return [_artifact_to_dict(r) for r in rows]

    @http_post("/artifacts/{artifact_id}/promote")
    def promote_artifact(self, request, artifact_id: str, payload: dict | None = None):
        guard = _admin_only(request)
        if guard:
            return guard
        model_family = (payload or {}).get("modelFamily")
        ok, message = promote_artifact_to_active_model(artifact_id, str(model_family) if model_family else None)
        if not ok:
            status = 404 if "not found" in message.lower() else 400
            return JsonResponse({"status": "error", "message": message}, status=status)
        return {"status": "success", "message": message}


def _dataset_to_dict(row: TrainingDataset | None) -> dict:
    if row is None:
        return {}
    return {
        "id": row.id,
        "name": row.name,
        "sourceType": row.source_type,
        "localPath": row.local_path,
        "archivePath": row.archive_path,
        "detectedFormat": row.detected_format,
        "status": row.status,
        "sampleCount": row.sample_count,
        "classCount": row.class_count,
        "createdAt": row.created_at,
        "notes": row.notes,
        "taskType": row.task_type,
    }


def _job_to_dict(row: TrainingJob | None) -> dict:
    if row is None:
        return {}
    return {
        "id": row.id,
        "datasetId": row.dataset_id,
        "datasetName": row.dataset_name,
        "baseModel": row.base_model,
        "taskType": row.task_type,
        "status": row.status,
        "progress": row.progress,
        "phase": row.phase,
        "device": row.device,
        "createdAt": row.created_at,
        "startedAt": row.started_at,
        "finishedAt": row.finished_at,
        "cancelRequested": row.cancel_requested,
        "params": row.params,
        "metrics": row.metrics,
        "error": row.error,
    }


def _log_to_dict(row: TrainingLog) -> dict:
    return {"id": row.id, "jobId": row.job_id, "ts": row.ts, "level": row.level, "message": row.message}


def _artifact_to_dict(row: TrainingArtifact) -> dict:
    return {
        "id": row.id,
        "jobId": row.job_id,
        "kind": row.kind,
        "path": row.path,
        "createdAt": row.created_at,
        "promoted": row.promoted,
        "metrics": row.metrics,
    }
