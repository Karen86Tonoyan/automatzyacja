@echo off
REM ========================================
REM AI BROWSER AGENT - ONE CLICK INSTALLER
REM ========================================
TITLE AI Browser Agent - Instalator
COLOR 0A

echo.
echo  ====================================
echo   AI BROWSER AGENT + ATLAS SYSTEM
echo   ONE CLICK INSTALLER
echo  ====================================
echo.

REM Sprawdz czy Python jest zainstalowany
echo [1/7] Sprawdzanie Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo  [ERROR] Python 3.10+ nie jest zainstalowany!
    echo.
    echo  Pobierz: https://www.python.org/downloads/
    echo  Zaznacz: "Add Python to PATH"
    echo.
    pause
    exit /b 1
)
echo  [OK] Python zainstalowany
echo.

REM Utworz virtual environment
echo [2/7] Tworzenie virtual environment...
if exist venv (
    echo  [SKIP] venv juz istnieje
) else (
    python -m venv venv
    echo  [OK] venv utworzony
)
echo.

REM Aktywuj venv
echo [3/7] Aktywacja venv...
call venv\Scripts\activate.bat
echo  [OK] venv aktywny
echo.

REM Upgrade pip
echo [4/7] Aktualizacja pip...
python -m pip install --upgrade pip --quiet
echo  [OK] pip zaktualizowany
echo.

REM Instaluj dependencies
echo [5/7] Instalacja pakietow (moze potrwac 2-3 min)...
pip install -r requirements.txt --quiet
if errorlevel 1 (
    echo  [ERROR] Blad instalacji pakietow!
    pause
    exit /b 1
)
echo  [OK] Pakiety zainstalowane
echo.

REM Instaluj Playwright
echo [6/7] Instalacja Playwright browsers...
playwright install chromium --quiet
if errorlevel 1 (
    echo  [WARNING] Playwright moze wymagac dodatkowych uprawnien
)
echo  [OK] Playwright gotowy
echo.

REM Konfiguracja .env
echo [7/7] Konfiguracja .env...
if exist .env (
    echo  [SKIP] .env juz istnieje
) else (
    copy .env.example .env >nul
    echo  [OK] .env utworzony
)

REM Interaktywna konfiguracja API keys
echo.
set /p SETUP_KEYS="Skonfigurowac API keys teraz? (t/n): "
if /i "%SETUP_KEYS%"=="t" (
    echo.
    echo Uruchamianie interaktywnego konfiguratora...
    python setup_api_keys.py
    echo.
) else (
    echo.
    echo  ====================================
    echo   WAZNE: UZUPELNIJ KLUCZE API
    echo  ====================================
    echo.
    echo  Edytuj plik: .env
    echo  Lub uruchom: python setup_api_keys.py
    echo.
    echo  Dodaj swoje API keys:
    echo   - PERPLEXITY_API_KEY
    echo   - OPENAI_API_KEY
    echo   - DEEPSEEK_API_KEY
    echo   (inne opcjonalne)
    echo.
)

REM Test importu
echo.
echo [TEST] Sprawdzanie aplikacji...
python -c "from app.main import app; print(' [OK] FastAPI app dziala')" 2>nul
if errorlevel 1 (
    echo  [WARNING] Aplikacja wymaga uzupelnienia .env
) else (
    echo  [OK] Aplikacja gotowa
)

REM Podsumowanie
echo.
echo  ====================================
echo   INSTALACJA ZAKONCZONA!
echo  ====================================
echo.
echo  Co teraz:
echo.
echo  1. Edytuj .env (dodaj API keys)
echo     notepad .env
echo.
echo  2. Uruchom serwer:
echo     start-atlas.bat
echo.
echo  3. Otworz przegladarke:
echo     http://localhost:8000/docs
echo.
echo  4. Zainstaluj Chrome Extension:
echo     chrome://extensions/
echo     Load unpacked: perplexity-agent\
echo.
echo  Dokumentacja: README.md
echo  Quick Start: QUICKSTART.md
echo.
echo  ====================================

REM Pytaj czy uruchomic teraz
echo.
set /p START="Uruchomic serwer teraz? (t/n): "
if /i "%START%"=="t" (
    echo.
    echo Uruchamianie serwera...
    echo.
    start-atlas.bat
) else (
    echo.
    echo Gotowe! Uruchom pozniej: start-atlas.bat
    echo.
)

pause
