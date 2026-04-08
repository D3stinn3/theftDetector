from __future__ import annotations

import json
import os
import shutil
import threading
import traceback
from datetime import datetime
from pathlib import Path
from typing import Any
from uuid import uuid4

from django.conf import settings

from core.legacy import load_runtime_settings, save_runtime_settings
from training.dataset_utils import inspect_yolo_dataset
from training.models import TrainingArtifact, TrainingDataset, TrainingJob, TrainingLog

try:
    from ultralytics import YOLO as _YOLO  # type: ignore
except Exception:  # pragma: no cover
    _YOLO = None

YOLO: Any = _YOLO


TRAINING_WORKSPACE_DIR = Path(settings.BASE_DIR) / "media" / "training_workspace"
TRAINING_ARTIFACTS_DIR = Path(settings.BASE_DIR) / "media" / "training_artifacts"
MODELS_DIR = settings.REPO_ROOT / "models"


def _ts() -> str:
    return datetime.now().isoformat()


def append_training_log(job_id: str, level: str, message: str) -> None:
    TrainingLog.objects.create(
        id=uuid4().hex,
        job_id=job_id,
        ts=_ts(),
        level=level,
        message=message,
    )


def _resolve_training_weight_paths(job_id: str, save_dir: str | None) -> tuple[str | None, str | None]:
    candidates: list[Path] = []
    if save_dir:
        candidates.append(Path(save_dir) / "weights")
    candidates.append(TRAINING_WORKSPACE_DIR / job_id / "weights")
    best_path: str | None = None
    last_path: str | None = None
    for c in candidates:
        best = c / "best.pt"
        last = c / "last.pt"
        if best_path is None and best.is_file():
            best_path = str(best.resolve())
        if last_path is None and last.is_file():
            last_path = str(last.resolve())
        if best_path and last_path:
            break
    return best_path, last_path


class TrainingWorker:
    def __init__(self):
        self.thread: threading.Thread | None = None
        self.stop_event = threading.Event()
        self.wake_event = threading.Event()
        self._lock = threading.Lock()

    def start(self) -> None:
        with self._lock:
            if self.thread and self.thread.is_alive():
                return
            self.stop_event.clear()
            self.thread = threading.Thread(target=self.run, daemon=True, name="training-worker")
            self.thread.start()

    def stop(self) -> None:
        self.stop_event.set()
        self.wake_event.set()

    def notify(self) -> None:
        self.wake_event.set()

    def run(self) -> None:
        while not self.stop_event.is_set():
            job = TrainingJob.objects.filter(status="queued").order_by("created_at").first()
            if not job:
                self.wake_event.wait(timeout=2.0)
                self.wake_event.clear()
                continue

            updated = TrainingJob.objects.filter(id=job.id, status="queued").update(
                status="running",
                progress=0.05,
                phase="Preparing dataset",
                started_at=_ts(),
                error=None,
            )
            if updated != 1:
                continue
            self._execute_job(job.id)

    def _should_cancel(self, job_id: str) -> bool:
        row = TrainingJob.objects.filter(id=job_id).values("cancel_requested").first()
        return bool(row and row.get("cancel_requested"))

    def _execute_job(self, job_id: str) -> None:
        row = TrainingJob.objects.filter(id=job_id).first()
        if not row:
            return
        params = row.params or {}
        append_training_log(job_id, "INFO", "Training job started.")

        dataset = TrainingDataset.objects.filter(id=row.dataset_id).first()
        dataset_path = (dataset.local_path if dataset else None) or ""
        if not dataset_path or not Path(dataset_path).is_dir():
            TrainingJob.objects.filter(id=job_id).update(
                status="failed",
                progress=1.0,
                phase="Failed",
                finished_at=_ts(),
                error="Dataset path is missing or invalid.",
                cancel_requested=False,
            )
            append_training_log(job_id, "ERROR", "Dataset path is missing or invalid.")
            return

        try:
            if YOLO is None:
                raise RuntimeError("Ultralytics is not installed.")

            inspection = inspect_yolo_dataset(dataset_path)
            if inspection.detected_format != "yolo" or not inspection.yaml_path:
                raise RuntimeError(inspection.message or "Dataset is not ready for YOLO training.")

            epochs = int(params.get("epochs", 30))
            imgsz = int(params.get("imgsz", 640))
            batch = int(params.get("batch", 8))
            patience = int(params.get("patience", 10))
            device = row.device or "cpu"
            resume_checkpoint = str(params.get("resumeCheckpointPath", "")).strip() or None

            model_source = resume_checkpoint if resume_checkpoint else (row.base_model or "yolov8n.pt")
            append_training_log(job_id, "INFO", f"Loading model {model_source}.")
            model = YOLO(model_source)

            def on_fit_epoch_end(trainer):
                current_epoch = int(getattr(trainer, "epoch", 0)) + 1
                progress = min(0.95, 0.25 + current_epoch / max(epochs, 1) * 0.7)
                TrainingJob.objects.filter(id=job_id).update(progress=progress, phase=f"Validating epoch {current_epoch}/{epochs}")
                if self._should_cancel(job_id):
                    setattr(trainer, "stop", True)

            def on_train_batch_end(trainer):
                if self._should_cancel(job_id):
                    setattr(trainer, "stop", True)

            model.add_callback("on_fit_epoch_end", on_fit_epoch_end)
            model.add_callback("on_train_batch_end", on_train_batch_end)

            TrainingJob.objects.filter(id=job_id).update(progress=0.25, phase="Training")
            train_kwargs = {
                "data": inspection.yaml_path,
                "epochs": epochs,
                "imgsz": imgsz,
                "batch": batch,
                "device": device,
                "patience": patience,
                "workers": 0,
                "project": str(TRAINING_WORKSPACE_DIR),
                "name": job_id,
                "exist_ok": True,
                "val": True,
            }
            if resume_checkpoint:
                train_kwargs["resume"] = True

            results = model.train(**train_kwargs)
            save_dir = str(getattr(results, "save_dir", "") or "").strip() or None
            best_path, last_path = _resolve_training_weight_paths(job_id, save_dir)

            if last_path and Path(last_path).is_file():
                TrainingArtifact.objects.create(
                    id=uuid4().hex,
                    job_id=job_id,
                    kind="resume_checkpoint",
                    path=last_path,
                    created_at=_ts(),
                    promoted=False,
                    metrics={"epochs": epochs, "imgsz": imgsz, "batch": batch},
                )

            if self._should_cancel(job_id):
                TrainingJob.objects.filter(id=job_id).update(
                    status="cancelled",
                    phase="Cancelled",
                    finished_at=_ts(),
                    error="Stopped by user request.",
                    cancel_requested=False,
                )
                append_training_log(job_id, "WARN", "Training stopped after checkpoint save.")
                return

            if not best_path or not Path(best_path).is_file():
                raise RuntimeError("Training finished but best.pt was not found.")

            TRAINING_ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
            promoted_path = TRAINING_ARTIFACTS_DIR / f"{job_id}_best.pt"
            shutil.copy2(best_path, promoted_path)
            metrics = {"epochs": epochs, "imgsz": imgsz, "batch": batch}
            TrainingArtifact.objects.create(
                id=uuid4().hex,
                job_id=job_id,
                kind="best_weights",
                path=str(promoted_path.resolve()),
                created_at=_ts(),
                promoted=False,
                metrics=metrics,
            )
            TrainingJob.objects.filter(id=job_id).update(
                status="completed",
                progress=1.0,
                phase="Completed",
                finished_at=_ts(),
                metrics=metrics,
                error=None,
                cancel_requested=False,
            )
            append_training_log(job_id, "INFO", f"Training completed. Artifact saved to {promoted_path}.")
        except Exception as exc:
            TrainingJob.objects.filter(id=job_id).update(
                status="failed",
                progress=1.0,
                phase="Failed",
                finished_at=_ts(),
                error=str(exc),
                cancel_requested=False,
            )
            append_training_log(job_id, "ERROR", str(exc))
            append_training_log(job_id, "ERROR", traceback.format_exc())


training_worker = TrainingWorker()


def reconcile_stale_training_jobs() -> None:
    stale = TrainingJob.objects.filter(status__in=["running", "stopping"])
    for job in stale:
        TrainingJob.objects.filter(id=job.id).update(
            status="orphaned",
            phase="Interrupted",
            finished_at=_ts(),
            error="Backend restarted while this job was active. Start a new job or resume from a checkpoint if available.",
            cancel_requested=False,
        )
        append_training_log(job.id, "WARN", "Job marked orphaned after backend restart.")


def promote_artifact_to_active_model(artifact_id: str, model_family: str | None = None) -> tuple[bool, str]:
    artifact = TrainingArtifact.objects.filter(id=artifact_id).first()
    if not artifact:
        return False, "Artifact not found."
    src = artifact.path or ""
    if not src or not Path(src).is_file():
        return False, "Artifact file is missing on disk."

    job = TrainingJob.objects.filter(id=artifact.job_id).first()
    family = (model_family or "").strip().lower()
    if family not in ("yolov8", "yolov26"):
        bm = (job.base_model if job else "").lower()
        family = "yolov26" if ("yolo26" in bm or "yolov26" in bm) else "yolov8"

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    dest = MODELS_DIR / f"active_object_{family}.pt"
    shutil.copy2(src, dest)

    runtime_settings = load_runtime_settings()
    if family == "yolov26":
        runtime_settings["activeObjectWeightsYolov26"] = str(dest.resolve())
    else:
        runtime_settings["activeObjectWeightsYolov8"] = str(dest.resolve())
    save_runtime_settings(runtime_settings)

    TrainingArtifact.objects.update(promoted=False)
    TrainingArtifact.objects.filter(id=artifact_id).update(promoted=True)
    return True, f"Artifact promoted. Object detector for {family} now uses {dest.resolve()}."
