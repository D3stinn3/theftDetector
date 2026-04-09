from __future__ import annotations

import base64
import os
import threading
import uuid
from dataclasses import dataclass
from time import time
from typing import Any

from core.legacy import load_runtime_settings

try:
    import cv2  # type: ignore
except Exception:  # pragma: no cover
    cv2: Any = None


@dataclass
class ProbeResult:
    ok: bool
    message: str


class CameraRuntime:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._cameras: dict[str, dict[str, Any]] = {}
        self._bootstrapped = False

    def _open_capture(self, source: str):
        if cv2 is None:
            return None
        raw = (source or "").strip()
        try:
            src: str | int = int(raw)
            is_index = True
        except Exception:
            src = raw
            is_index = False

        if is_index and os.name == "nt":
            return cv2.VideoCapture(src, cv2.CAP_DSHOW)
        if isinstance(src, str) and src.lower().startswith(("rtsp://", "rtsps://")):
            return cv2.VideoCapture(src, cv2.CAP_FFMPEG)
        return cv2.VideoCapture(src)

    def probe_source(self, source: str) -> ProbeResult:
        if cv2 is None:
            return ProbeResult(False, "OpenCV is unavailable on this runtime.")
        cap = self._open_capture(source)
        if cap is None or not cap.isOpened():
            return ProbeResult(False, "Camera source could not be opened.")
        ok, frame = cap.read()
        try:
            cap.release()
        except Exception:
            pass
        if not ok or frame is None:
            return ProbeResult(False, "Camera opened but no frame was received.")
        return ProbeResult(True, "Camera source is reachable.")

    def _add_camera_unlocked(self, name: str, source: str) -> tuple[bool, str]:
        if cv2 is None:
            return False, "OpenCV is unavailable on this runtime."
        cap = self._open_capture(source)
        if cap is None or not cap.isOpened():
            try:
                if cap is not None:
                    cap.release()
            except Exception:
                pass
            return False, "Could not open camera source."
        cam_id = uuid.uuid4().hex
        self._cameras[cam_id] = {
            "id": cam_id,
            "name": name,
            "source": source,
            "cap": cap,
            "status": "active",
            "lastError": None,
            "lastFrameTs": time(),
        }
        return True, ""

    def replace_all(self, sources: list[dict[str, str]], fallback_webcam: bool = True) -> dict[str, int]:
        with self._lock:
            for cam in list(self._cameras.values()):
                try:
                    cam["cap"].release()
                except Exception:
                    pass
            self._cameras = {}
            added = 0
            for item in sources:
                name = (item.get("name") or "Camera").strip() or "Camera"
                src = (item.get("source") or "").strip()
                if not src:
                    continue
                ok, _ = self._add_camera_unlocked(name, src)
                if ok:
                    added += 1
            if fallback_webcam and added == 0:
                ok, _ = self._add_camera_unlocked("Camera 1", "0")
                if ok:
                    added += 1
            return {"count": added}

    def ensure_loaded(self) -> None:
        if self._bootstrapped:
            return
        settings_data = load_runtime_settings()
        sources = settings_data.get("cameraSources", []) if isinstance(settings_data, dict) else []
        parsed = [{"name": str(c.get("name", "Camera")), "source": str(c.get("source", ""))} for c in sources if isinstance(c, dict)]
        self.replace_all(parsed, fallback_webcam=True)
        self._bootstrapped = True

    def list_cameras(self) -> list[dict[str, Any]]:
        self.ensure_loaded()
        with self._lock:
            rows: list[dict[str, Any]] = []
            for cam in self._cameras.values():
                cap = cam.get("cap")
                is_open = bool(cap and cap.isOpened())
                rows.append(
                    {
                        "id": cam["id"],
                        "name": cam["name"],
                        "source": cam["source"],
                        "status": "active" if is_open else "error",
                        "lastError": cam.get("lastError"),
                        "lastFrameTs": cam.get("lastFrameTs"),
                    }
                )
            return rows

    def get_ws_frames(self) -> list[dict[str, str]]:
        self.ensure_loaded()
        if cv2 is None:
            return []
        out: list[dict[str, str]] = []
        with self._lock:
            for cam_id, cam in self._cameras.items():
                cap = cam.get("cap")
                if not cap or not cap.isOpened():
                    cam["status"] = "error"
                    cam["lastError"] = "Camera is not opened."
                    continue
                ok, frame = cap.read()
                if not ok or frame is None:
                    cam["status"] = "error"
                    cam["lastError"] = "Failed to read frame."
                    continue
                ok2, encoded = cv2.imencode(".jpg", frame)
                if not ok2:
                    continue
                cam["status"] = "active"
                cam["lastError"] = None
                cam["lastFrameTs"] = time()
                out.append(
                    {
                        "camera_id": cam_id,
                        "name": str(cam.get("name", cam_id)),
                        "data": base64.b64encode(encoded.tobytes()).decode("ascii"),
                    }
                )
        return out

    def get_runtime_diagnostics(self) -> dict[str, object]:
        self.ensure_loaded()
        with self._lock:
            cameras = []
            for cam in self._cameras.values():
                cap = cam.get("cap")
                cameras.append(
                    {
                        "id": cam.get("id"),
                        "name": cam.get("name"),
                        "source": cam.get("source"),
                        "isOpened": bool(cap and cap.isOpened()),
                        "status": cam.get("status"),
                        "lastError": cam.get("lastError"),
                        "lastFrameTs": cam.get("lastFrameTs"),
                    }
                )
            return {"count": len(cameras), "cameras": cameras}


camera_runtime = CameraRuntime()

