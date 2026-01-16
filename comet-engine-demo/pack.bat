@echo off
REM ZIP packer dla Comet Engine Demo

TITLE Comet Engine Demo - Packer

echo.
echo ========================================
echo   COMET ENGINE DEMO - ZIP PACKER
echo ========================================
echo.

REM Sprawdz czy 7-Zip jest zainstalowany
where 7z >nul 2>&1
if errorlevel 1 (
    echo Metoda 1: PowerShell (wbudowany)
    echo.
    
    powershell -Command "
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $source = 'comet-engine-demo'
    $destination = 'comet-engine-demo.zip'
    if (Test-Path $destination) {
        Remove-Item $destination
    }
    [System.IO.Compression.ZipFile]::CreateFromDirectory((Resolve-Path $source), (Resolve-Path $destination))
    Write-Host 'Gotowe: comet-engine-demo.zip' -ForegroundColor Green
    "
) else (
    echo Metoda 2: 7-Zip
    echo.
    
    7z a -r comet-engine-demo.zip comet-engine-demo
    echo.
    echo Gotowe: comet-engine-demo.zip
)

echo.
echo ========================================
echo   ZAWARTOSC ZIP:
echo ========================================
echo.
echo comet-engine-demo/
echo  ├─ server/
echo  │   ├─ server.js
echo  │   └─ package.json
echo  ├─ client/
echo  │   └─ index.html
echo  ├─ README.md
echo  └─ .gitignore
echo.
echo Rozmiar: (~10 KB)
echo.

pause
