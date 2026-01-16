@echo off
REM start-atlas.bat - Uruchom AI Browser Agent + ATLAS (Windows)

echo.
echo 🤖 Starting AI Browser Agent + ATLAS System
echo ==============================================

REM Sprawdzaj venv
if not exist venv (
    echo ❌ Virtual environment nie istnieje. Uruchom: install.bat
    pause
    exit /b 1
)

REM Sprawdzaj .env
if not exist .env (
    echo ⚠️  Brak pliku .env - kopiuję z .env.example
    copy .env.example .env
    echo ❗ Uzupełnij klucze API w .env przed uruchomieniem!
    pause
    exit /b 1
)

REM Aktywuj venv
echo 📦 Aktywowanie virtual environment...
call venv\Scripts\activate.bat

REM Uruchom serwer
echo.
echo 🚀 Uruchamianie serwera...
echo    API: http://localhost:8000
echo    Docs: http://localhost:8000/docs
echo    ATLAS: http://localhost:8000/api/atlas/agents
echo.
echo Press Ctrl+C to stop
echo.

uvicorn app.main:app --reload --port 8000
