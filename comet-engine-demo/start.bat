@echo off
REM Start helper for Comet Engine Demo

set ROOT_DIR=%~dp0
set SERVER_DIR=%ROOT_DIR%server

echo.
echo ========================================
echo   COMET ENGINE DEMO - START
echo ========================================
echo.

REM Check node
where node >nul 2>nul
if errorlevel 1 (
  echo ❌ Brak node. Zainstaluj Node.js 18+ z https://nodejs.org/
  exit /b 1
)

cd /d "%SERVER_DIR%"

REM Install deps (idempotent)
echo 📦 Instalacja zaleznosci (npm install)...
npm install --silent

REM Run server
echo 🚀 Uruchamiam serwer na http://localhost:8080
node server.js
