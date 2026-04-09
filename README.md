# TheftGuard AI

TheftGuard AI is a real-time retail anti-theft surveillance system. It processes live video feeds from multiple RTSP/IP cameras through a YOLOv8 AI pipeline and streams annotated frames to a Next.js dashboard over WebSocket. Security events trigger instant alerts via the dashboard, Email, and Telegram.

---

## System Capabilities

### 1. Theft Detection

- **Object Detection:** YOLOv8 models identify persons and retail objects. Uses a specialized `shoplifting.pt` model when present; falls back to `yolov8n.pt`.
- **Behavior Analysis:** Tracks hand-to-pocket gestures to detect concealment attempts.
- **Pose Estimation:** YOLOv8n-pose skeleton analysis detects suspicious postures such as crouching in aisles or reaching into restricted areas.
- **Region of Interest (ROI):** Alerts only fire when a person is inside a user-defined polygon zone.

### 2. Face Registry

- **Blacklist:** Instantly identifies known offenders and triggers high-priority alerts.
- **Whitelist:** Recognize VIPs or authorized personnel to suppress false alerts.
- Register faces via the dashboard by uploading a photo and assigning a name and type.

### 3. Live Surveillance Dashboard

Built with Next.js 14, the dashboard provides a centralized control room experience:

- **Live feeds:** Multi-camera WebSocket stream with bounding-box and skeleton overlays.
- **Stat cards:** Today's alerts, 7-day total, trend vs. yesterday, and active stream count.
- **Weekly chart:** Bar chart of daily alert volume over the past 7 days.
- **Heatmap overlay:** Accumulated motion density rendered per-frame (toggle in Settings).

### 4. Alert History & Evidence

- Every detection is saved to a local SQLite database with timestamp, message, and screenshot path.
- JPEG snapshots of the event are automatically saved to the `alerts/` directory.
- Browse past alerts and view snapshots from the History page.

### 5. Remote Notifications

- **Telegram:** Sends an instant message to a configured Chat ID via Bot API.
- **Email:** Dispatches an alert with screenshot attachment via SMTP (Gmail-compatible).
- Both can be tested from the Settings page without triggering a real detection event.

### 6. Model Training Pipeline

- Upload YOLO-format datasets directly from the dashboard.
- Queue and monitor training jobs with live log streaming.
- Promote trained artifacts to the active detection model without restarting the server.

### 7. Hot-Swap Detection Models

Switch between detection models at runtime from the Settings page. Changes take effect on the next detection cycle — no server restart required.

---

## Technical Architecture

| Layer | Technology |
| --- | --- |
| Backend | Python, FastAPI, Uvicorn |
| Detection | Ultralytics YOLOv8, OpenCV |
| Face Recognition | `face_recognition` (dlib) |
| Database | SQLite |
| Frontend | Next.js 14, React, Tailwind CSS, Recharts, Lucide React |
| Communication | WebSocket (live frames), SMTP (email), HTTPS (Telegram API) |

---

## Project Structure

```text
theftDetector/
├── backend.py                  # FastAPI server — detection, WebSocket, API, alerts
├── training_dataset_utils.py   # YOLO dataset normalization helpers
├── requirements.txt            # Python dependencies
├── settings.json               # Runtime config (auto-created from example)
├── settings.example.json       # Config template — commit this, not settings.json
├── alerts/                     # Saved alert screenshots (auto-created at startup)
├── theft_detection.db          # SQLite — alerts, faces, training jobs/artifacts
└── dashboard/                  # Next.js 14 frontend
    ├── app/                    # App Router pages
    ├── components/             # Shared UI components
    ├── lib/                    # API client, types, config
    ├── .env.example            # Frontend env template
    └── .env.local              # Your local overrides (not committed)
```

---

## Installation

### Prerequisites

| Requirement | Version | Notes |
| --- | --- | --- |
| Python | 3.10+ | Ensure `python` is on your PATH |
| Node.js | 18+ | [nodejs.org](https://nodejs.org/) |
| NVIDIA GPU + CUDA | Optional | CPU inference is supported but slower |

> **Windows — `face_recognition` requires `dlib`**, which needs Visual Studio C++ Build Tools.
> Download from [visualstudio.microsoft.com/visual-cpp-build-tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) and install before running `pip install`.
> If `face_recognition` is unavailable, the backend starts with face recognition disabled — all other features work normally.

---

### 1. Clone the repository

```bash
git clone https://github.com/D3stinn3/theftDetector.git
cd theftDetector
```

### 2. Set up a virtual environment (recommended)

```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate
```

### 3. Install Python dependencies (default: CPU-safe)

```bash
pip install -r requirements.txt -c constraints.txt
```

> If your project does not yet include a `requirements.txt`, install your packages as usual and still pass
> `-c constraints.txt` so environment resolution keeps `setuptools` below `81` (avoids known
> `face_recognition_models`/`pkg_resources` deprecation noise).

### 3b. Optional: CUDA-enabled PyTorch (GPU servers)

For NVIDIA/CUDA hosts, install the CUDA wheel set after base dependencies:

```bash
pip install -r requirements-cuda.txt
```

This keeps first-time developer setup stable on any machine, while production GPU hosts can opt into CUDA builds explicitly.

### 4. Configure camera sources

`settings.json` is not committed (it contains credentials). On first run it is auto-created from `settings.example.json`. To set it up manually:

```bash
# Windows
copy settings.example.json settings.json

# macOS / Linux
cp settings.example.json settings.json
```

Edit `settings.json` and set your camera sources:

```json
{
  "cameraSources": [
    { "name": "Entrance", "source": "rtsp://user:pass@192.168.1.10:554/stream" },
    { "name": "Aisle 3",  "source": "0" }
  ]
}
```

Use an RTSP URL for IP cameras or a numeric string (`"0"`, `"1"`) for USB webcams. If no sources are configured or all fail, the system falls back to webcam index `0` and runs in camera-less mode if that is also unavailable.

### 5. Configure the frontend environment

```bash
# Windows
copy dashboard\.env.example dashboard\.env.local

# macOS / Linux
cp dashboard/.env.example dashboard/.env.local
```

Edit `dashboard/.env.local` if the backend runs on a different host or port:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### 6. Install frontend dependencies

```bash
cd dashboard
npm install
cd ..
```

### 7. (Optional) Specialized detection model

Place a `shoplifting.pt` weights file in the project root. The backend will use it automatically. Without it, the system falls back to standard `yolov8n.pt` with behaviour-based detection logic.

---

## Running

### Backend

```bash
python backend.py
```

Expected startup output:

```text
2026-04-06 10:00:00 [INFO]    Database initialized.
2026-04-06 10:00:00 [INFO]    Loaded 0 face(s) from database.
2026-04-06 10:00:00 [WARNING] Failed to open camera: rtsp://...  ← unreachable sources
2026-04-06 10:00:00 [INFO]    Camera added: Camera 1 (0) ID: <uuid>
2026-04-06 10:00:00 [INFO]    Starting video loop...
INFO:     Application startup complete.
2026-04-06 10:00:00 [INFO]    Loading models for: yolov8
2026-04-06 10:00:00 [WARNING] Primary model 'shoplifting.pt' not found, using fallback 'yolov8n.pt'
2026-04-06 10:00:00 [INFO]    Models ready.
```

### Frontend

In a separate terminal:

```bash
cd dashboard
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Dashboard Pages

| Route | Description |
| --- | --- |
| `/` | Live surveillance — stat cards, 7-day alert chart, camera feeds |
| `/live` | Full-screen WebSocket camera feed |
| `/cameras` | Add, remove, and monitor camera sources in real time |
| `/history` | Alert log with saved event screenshots |
| `/playback` | Recorded video playback with detection replay |
| `/faces` | Face registry — register blacklist / whitelist individuals |
| `/roi` | Region of Interest polygon editor |
| `/train` | Model training — upload datasets, run jobs, promote artifacts |
| `/settings` | Email, Telegram, heatmap, and detection model configuration |

---

## API Reference

Base URL: `http://localhost:8000`

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/stats` | Alert counts and 7-day trend data |
| `GET` | `/settings` | Read current settings |
| `POST` | `/settings` | Save settings |
| `POST` | `/settings/test` | Send test email / Telegram message |
| `GET` | `/roi` | Read ROI polygon points |
| `POST` | `/roi` | Update ROI polygon points |
| `GET` | `/alerts` | Paginated alert history |
| `GET` | `/cameras` | List active camera sources |
| `POST` | `/cameras` | Add a camera source |
| `DELETE` | `/cameras/{id}` | Remove a camera source |
| `GET` | `/faces` | List registered faces |
| `POST` | `/faces/register` | Register a new face (multipart) |
| `DELETE` | `/faces/{id}` | Remove a face |
| `GET` | `/training/datasets` | List uploaded datasets |
| `POST` | `/training/datasets` | Upload a new YOLO dataset |
| `GET` | `/training/jobs` | List training jobs |
| `POST` | `/training/jobs` | Start a new training job |
| `GET` | `/training/jobs/{id}/logs` | Stream training job logs |
| `POST` | `/training/artifacts/{id}/promote` | Promote artifact to active model |
| `WebSocket` | `/ws` | Real-time multi-camera frame stream + alert payload |

Static alert screenshots are served at `/alerts/<filename>`.

---

## Detection Models

| Model key | Pose model | Object model | Notes |
| --- | --- | --- | --- |
| `yolov8` | `yolov8n-pose.pt` | `shoplifting.pt` → `yolov8n.pt` | Default; uses specialized model if present |
| `yolov26` | `yolov8n-pose.pt` | `yolo26n.pt` → `yolov8n.pt` | Experimental |

Place custom `.pt` weight files in the project root. The active model can be switched at runtime from the Settings page.

---

## Logging

All backend output uses Python's `logging` module with timestamps and severity levels. OpenCV/FFMPEG internal C++ warnings are suppressed.

```text
YYYY-MM-DD HH:MM:SS [LEVEL]   message
```

| Level | Used for |
| --- | --- |
| `INFO` | Normal operation — startup, camera connected, models ready, client events |
| `WARNING` | Non-fatal issues — camera unreachable, missing model file, missing config |
| `ERROR` | Recoverable failures — loop errors, alert dispatch failures |
| `CRITICAL` | Unrecoverable failures — model load failure on startup |

---

## Contributing

1. Fork this repository.
2. Create a feature branch: `git checkout -b feature/your-feature`.
3. Commit your changes: `git commit -m 'Add your feature'`.
4. Push to the branch: `git push origin feature/your-feature`.
5. Open a Pull Request.

## License

Distributed under the MIT License. See `LICENSE` for more information.
