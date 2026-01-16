@echo off
echo ========================================
echo ATLAS - AI Agent Pro
echo Plug and Play Installation
echo ========================================
echo.

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found!
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js found
node --version
echo.

:: Install backend dependencies
echo [1/5] Installing backend dependencies...
cd backend
call npm install --silent
if %errorlevel% neq 0 (
    echo [ERROR] Backend installation failed
    pause
    exit /b 1
)
echo [OK] Backend dependencies installed
echo.

:: Create .env if not exists
if not exist .env (
    echo [2/5] Creating .env configuration...
    copy .env.example .env >nul
    echo [OK] .env created - EDIT THIS FILE WITH YOUR API KEYS
) else (
    echo [2/5] .env already exists, skipping
)
echo.

:: Start backend
echo [3/5] Starting backend server...
start "ATLAS Backend" cmd /k "npm start"
timeout /t 3 >nul
echo [OK] Backend started on http://localhost:3000
echo.

:: Go back to root
cd ..

:: Create placeholder icons if missing
echo [4/5] Checking extension icons...
if not exist icons\icon16.png (
    mkdir icons 2>nul
    echo [INFO] Icon files missing - extension will load without icons
    echo [INFO] Add PNG icons: icon16.png, icon48.png, icon128.png to /icons/ folder
)
echo.

:: Instructions
echo [5/5] ATLAS Extension Ready!
echo.
echo ========================================
echo NEXT STEPS:
echo ========================================
echo.
echo 1. CONFIGURE BACKEND:
echo    - Edit: backend\.env
echo    - Add your OpenAI API key
echo    - Save file
echo.
echo 2. LOAD EXTENSION IN CHROME:
echo    - Open Chrome
echo    - Go to: chrome://extensions/
echo    - Enable "Developer mode" (top right)
echo    - Click "Load unpacked"
echo    - Select folder: %CD%
echo.
echo 3. (OPTIONAL) CONFIGURE OAUTH:
echo    - Go to: https://console.cloud.google.com
echo    - Create OAuth2 credentials
echo    - Edit: manifest.json
echo    - Replace YOUR_GOOGLE_CLIENT_ID
echo.
echo 4. USE ATLAS:
echo    - Click extension icon
echo    - Login with Google (if configured)
echo    - Open side panel for full features
echo.
echo ========================================
echo Backend running at: http://localhost:3000
echo ========================================
echo.

pause
