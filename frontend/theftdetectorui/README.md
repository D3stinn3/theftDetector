# Recreated Frontend (`frontend/theftdetectorui`)

This UI targets the recreated Django backend in `../backend`.

## Setup

Install dependencies:

```bash
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

If backend runs on another port (for example `8001`), update this value and restart `npm run dev`.

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Backend Pairing (Important)

For live camera stream pages (`/live`, dashboard feeds), the backend should run with Uvicorn ASGI:

```bash
..\venv\Scripts\python -m uvicorn theftdetectorbackend.asgi:application --host 127.0.0.1 --port 8000 --reload
```

Running backend with `manage.py runserver` is okay for some HTTP endpoints, but not the recommended mode for WebSocket `/ws` stream validation.
