@echo off
title Theft Guard AI Launcher
color 0A

echo ==================================================
echo   THEFT GUARD AI - Theft Detection System
echo   Starting up... Please wait.
echo ==================================================
echo.

:: ── Prerequisite checks ───────────────────────────────────────────────────────

where py >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found.
    echo         Install Python 3.9+ from https://www.python.org/downloads/
    echo         Ensure "Add Python to PATH" is checked during installation.
    pause
    exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found.
    echo         Install Node.js LTS from https://nodejs.org/
    pause
    exit /b 1
)

where curl >nul 2>&1
if errorlevel 1 (
    echo [ERROR] curl not found. curl is required for startup health checks.
    echo         curl is built into Windows 10 1803+ and Windows 11.
    pause
    exit /b 1
)

:: ── First-time setup ──────────────────────────────────────────────────────────

if not exist "settings.json" (
    if exist "settings.example.json" (
        echo [SETUP] Creating settings.json from settings.example.json...
        copy /y settings.example.json settings.json >nul
        echo        Configure your cameras in settings.json before proceeding.
    )
)

if not exist "dashboard\.env.local" (
    if exist "dashboard\.env.example" (
        echo [SETUP] Creating dashboard\.env.local from .env.example...
        copy /y dashboard\.env.example dashboard\.env.local >nul
    )
)

if not exist "dashboard\node_modules" (
    echo [SETUP] Installing frontend dependencies (first run only)...
    cd dashboard
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed. Check Node.js version ^(requires ^>=18.17.0^).
        pause
        exit /b 1
    )
    cd ..
)

:: ── Start backend ─────────────────────────────────────────────────────────────

echo.
echo [1/2] Starting Backend (FastAPI on port 8000)...
start "Theft Guard Backend" cmd /k "py backend.py"

echo       Waiting for backend to be ready...
set /a tries=0
:wait_backend
timeout /t 2 /nobreak >nul
curl -s http://127.0.0.1:8000/health >nul 2>&1
if not errorlevel 1 goto backend_ready
set /a tries+=1
if %tries% lss 30 goto wait_backend
echo.
echo [ERROR] Backend did not respond within 60 seconds.
echo         Check the "Theft Guard Backend" window for error details.
pause
exit /b 1
:backend_ready
echo       [OK] Backend is ready.

:: ── Start frontend ────────────────────────────────────────────────────────────

echo.
echo [2/2] Starting Dashboard (Next.js on port 3000)...
cd dashboard
start "Theft Guard Dashboard" cmd /k "npm run dev"
cd ..

echo       Waiting for frontend to be ready...
set /a tries=0
:wait_frontend
timeout /t 2 /nobreak >nul
curl -s http://localhost:3000 >nul 2>&1
if not errorlevel 1 goto frontend_ready
set /a tries+=1
if %tries% lss 30 goto wait_frontend
echo.
echo [ERROR] Frontend did not respond within 60 seconds.
echo         Check the "Theft Guard Dashboard" window for error details.
pause
exit /b 1
:frontend_ready
echo       [OK] Frontend is ready.

:: ── Open browser ─────────────────────────────────────────────────────────────

echo.
echo [3/3] Opening browser...
start http://localhost:3000

echo.
echo ==================================================
echo   SYSTEM ACTIVE!
echo   Backend  : http://127.0.0.1:8000
echo   Dashboard: http://localhost:3000
echo   To stop  : Close the two black command windows.
echo ==================================================
pause
