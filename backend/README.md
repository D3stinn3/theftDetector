# Recreated Backend (Django Ninja Extra)

This backend lives in `backend/` and powers the recreated UI in `frontend/theftdetectorui`.

## Prerequisites

- Python 3.10+
- Virtual environment at repository root (`.venv`/`venv`)

## Install

From repository root:

```bash
.\venv\Scripts\python -m pip install -r requirements.txt -c ..\constraints.txt
```

CUDA hosts only:

```bash
.\venv\Scripts\python -m pip install -r requirements-cuda.txt
```

## Run (Recommended for Live Stream)

Use Uvicorn (ASGI) for WebSocket `/ws` support:

```bash
# from backend/
..\venv\Scripts\python -m uvicorn theftdetectorbackend.asgi:application --host 127.0.0.1 --port 8000 --reload
```

## Run (HTTP-only dev checks)

`manage.py runserver` is fine for API/migrations checks, but not ideal for live-stream WebSocket troubleshooting.

```bash
python manage.py runserver 127.0.0.1:8000
```

## Common Commands

```bash
python manage.py migrate
python manage.py check
python manage.py createsuperuser
```

## Health Checklist

- `GET /stats` returns `200`
- `GET /auth/me` returns expected auth payload
- Uvicorn logs show `WebSocket /ws [accepted]` when opening `/live`
