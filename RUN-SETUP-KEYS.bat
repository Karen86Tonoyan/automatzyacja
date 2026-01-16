@echo off
REM Quick setup API keys
TITLE Setup API Keys

echo.
echo ========================================
echo   AI BROWSER AGENT
echo   API KEYS SETUP
echo ========================================
echo.

if exist venv\Scripts\python.exe (
    venv\Scripts\python.exe setup_api_keys.py
) else (
    python setup_api_keys.py
)

echo.
pause
