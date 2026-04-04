#!/usr/bin/env bash
set -euo pipefail

echo "=================================================="
echo "  THEFT GUARD AI - Theft Detection System"
echo "  Starting up... Please wait."
echo "=================================================="
echo

# ── Prerequisite checks ────────────────────────────────────────────────────────

command -v python3 >/dev/null 2>&1 || {
    echo "[ERROR] python3 not found."
    echo "        Install Python 3.9+ from https://www.python.org/downloads/"
    exit 1
}

command -v node >/dev/null 2>&1 || {
    echo "[ERROR] node not found."
    echo "        Install Node.js LTS from https://nodejs.org/"
    exit 1
}

command -v curl >/dev/null 2>&1 || {
    echo "[ERROR] curl not found. Install curl via your package manager."
    exit 1
}

# ── First-time setup ───────────────────────────────────────────────────────────

if [ ! -f "settings.json" ] && [ -f "settings.example.json" ]; then
    echo "[SETUP] Creating settings.json from settings.example.json..."
    cp settings.example.json settings.json
    echo "        Configure your cameras in settings.json before proceeding."
fi

if [ ! -f "dashboard/.env.local" ] && [ -f "dashboard/.env.example" ]; then
    echo "[SETUP] Creating dashboard/.env.local from .env.example..."
    cp dashboard/.env.example dashboard/.env.local
fi

if [ ! -d "dashboard/node_modules" ]; then
    echo "[SETUP] Installing frontend dependencies (first run only)..."
    (cd dashboard && npm install) || {
        echo "[ERROR] npm install failed. Check Node.js version (requires >=18.17.0)."
        exit 1
    }
fi

# ── Start backend ──────────────────────────────────────────────────────────────

echo
echo "[1/2] Starting Backend (FastAPI on port 8000)..."
python3 backend.py &
BACKEND_PID=$!

echo "      Waiting for backend to be ready..."
tries=0
until curl -s http://127.0.0.1:8000/health >/dev/null 2>&1; do
    sleep 2
    tries=$((tries + 1))
    if [ "$tries" -ge 30 ]; then
        echo
        echo "[ERROR] Backend did not respond within 60 seconds."
        echo "        Check the terminal output above for error details."
        kill "$BACKEND_PID" 2>/dev/null || true
        exit 1
    fi
done
echo "      [OK] Backend is ready."

# ── Start frontend ─────────────────────────────────────────────────────────────

echo
echo "[2/2] Starting Dashboard (Next.js on port 3000)..."
(cd dashboard && npm run dev) &
FRONTEND_PID=$!

echo "      Waiting for frontend to be ready..."
tries=0
until curl -s http://localhost:3000 >/dev/null 2>&1; do
    sleep 2
    tries=$((tries + 1))
    if [ "$tries" -ge 30 ]; then
        echo
        echo "[ERROR] Frontend did not respond within 60 seconds."
        echo "        Check the terminal output above for error details."
        kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
        exit 1
    fi
done
echo "      [OK] Frontend is ready."

# ── Open browser ───────────────────────────────────────────────────────────────

echo
echo "[3/3] Opening browser..."
if command -v xdg-open >/dev/null 2>&1; then
    xdg-open http://localhost:3000
elif command -v open >/dev/null 2>&1; then
    open http://localhost:3000
fi

echo
echo "=================================================="
echo "  SYSTEM ACTIVE!"
echo "  Backend  : http://127.0.0.1:8000"
echo "  Dashboard: http://localhost:3000"
echo "  To stop  : Press Ctrl+C"
echo "=================================================="

# Keep script alive; forward Ctrl+C to child processes
trap 'kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null; exit 0' INT TERM
wait
