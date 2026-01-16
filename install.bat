@echo off
REM install.bat - Instalacja na Windows

echo.
echo 🤖 AI Browser Agent + Perplexity - Instalacja Windows
echo ======================================================

REM 1. Sprawdzenie Python
echo.
echo 📋 Sprawdzanie wymagań...

python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python 3 nie jest zainstalowany
    exit /b 1
)

npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm nie jest zainstalowany
    exit /b 1
)

echo ✅ Python: OK
echo ✅ npm: OK

REM 2. .env
echo.
echo 🔑 Konfiguracja .env...

if not exist .env (
    copy .env.example .env
    echo ✅ Utworzono .env - uzupełnij klucze API
) else (
    echo ✅ .env już istnieje
)

REM 3. Virtual Environment
echo.
echo 📦 Tworzenie virtual environment...

if not exist venv (
    python -m venv venv
    echo ✅ venv Created
)

REM 4. Aktywuj venv i instaluj
echo.
echo 📦 Instalacja zależności...

call venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt

REM 5. Playwright
echo.
echo 🎭 Instalacja Playwright...

playwright install chromium

REM 6. Koniec
echo.
echo ✅ Instalacja zakończona!
echo.
echo 🚀 Aby uruchomić:
echo   - venv\Scripts\activate
echo   - uvicorn app.main:app --reload --port 8000
echo.
echo 📖 Dokumentacja: README.md
pause
