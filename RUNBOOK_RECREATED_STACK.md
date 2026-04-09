# Recreated Stack Runbook

## 1) Backend (Django Ninja Extra)

From `backend/`:

1. `python -m venv .venv`
2. Activate virtualenv
3. `pip install -r requirements.txt -c ../constraints.txt`
4. (CUDA hosts only) `pip install -r requirements-cuda.txt`
5. `python manage.py migrate`
6. `python manage.py runserver 127.0.0.1:8001`

Notes:
- Runs independently from legacy `backend.py`.
- API docs: `http://127.0.0.1:8001/docs`
- Auth endpoints:
  - `POST /auth/signup`
  - `POST /auth/login`
  - `POST /auth/logout`
  - `GET /auth/me`

## 2) Frontend (Next.js recreated UI)

From `frontend/theftdetectorui/`:

1. Install deps: `npm install`
2. Create env:
   - `NEXT_PUBLIC_API_URL=http://127.0.0.1:8001`
3. Start: `npm run dev`
4. Open `http://localhost:3000`

## 3) Parallel Runtime (No Interference)

- Legacy backend/UI still run as before:
  - `python backend.py`
  - `cd dashboard && npm run dev`
- Recreated backend/UI run separately:
  - `cd backend && python manage.py runserver 127.0.0.1:8001`
  - `cd frontend/theftdetectorui && npm run dev`

## 4) Validation Checklist

- Signup -> Login -> `/auth/me` returns authenticated user
- Dashboard home loads stats from `/stats`
- Live page connects to `/ws`
- History and Faces pages retrieve lists
- Settings save persists to `settings.json`

## 5) Rollback

No rollback action needed because legacy stack is unchanged.
Stop recreated backend/frontend processes and continue with legacy runtime.
