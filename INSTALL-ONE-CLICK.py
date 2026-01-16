#!/usr/bin/env python3
"""
AI Browser Agent - Universal One-Click Installer
Działa na Windows, macOS i Linux
"""
import os
import sys
import subprocess
import platform
from pathlib import Path

# Colors for terminal
class Color:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_step(step, total, message):
    """Print installation step"""
    print(f"\n{Color.BLUE}[{step}/{total}]{Color.END} {message}...")

def print_success(message):
    """Print success message"""
    print(f"{Color.GREEN}✓{Color.END} {message}")

def print_error(message):
    """Print error message"""
    print(f"{Color.RED}✗{Color.END} {message}")

def print_warning(message):
    """Print warning message"""
    print(f"{Color.YELLOW}⚠{Color.END} {message}")

def run_command(command, check=True, capture=False):
    """Run shell command"""
    try:
        if capture:
            result = subprocess.run(
                command,
                shell=True,
                check=check,
                capture_output=True,
                text=True
            )
            return result.stdout.strip()
        else:
            subprocess.run(command, shell=True, check=check)
            return True
    except subprocess.CalledProcessError:
        return False

def check_python():
    """Check Python version"""
    print_step(1, 7, "Sprawdzanie Python")
    version = sys.version_info
    if version.major >= 3 and version.minor >= 10:
        print_success(f"Python {version.major}.{version.minor}.{version.micro}")
        return True
    else:
        print_error(f"Python {version.major}.{version.minor} - wymagane 3.10+")
        return False

def create_venv():
    """Create virtual environment"""
    print_step(2, 7, "Tworzenie virtual environment")
    if Path("venv").exists():
        print_warning("venv już istnieje")
        return True
    
    if run_command(f"{sys.executable} -m venv venv"):
        print_success("venv utworzony")
        return True
    else:
        print_error("Błąd tworzenia venv")
        return False

def get_venv_python():
    """Get venv Python path"""
    system = platform.system()
    if system == "Windows":
        return Path("venv/Scripts/python.exe")
    else:
        return Path("venv/bin/python")

def install_dependencies():
    """Install Python packages"""
    print_step(3, 7, "Instalacja pakietów (może potrwać 2-3 min)")
    
    python = get_venv_python()
    
    # Upgrade pip
    print("  → Aktualizacja pip...")
    run_command(f"{python} -m pip install --upgrade pip --quiet", check=False)
    
    # Install requirements
    print("  → Instalacja requirements.txt...")
    if run_command(f"{python} -m pip install -r requirements.txt --quiet"):
        print_success("Pakiety zainstalowane")
        return True
    else:
        print_error("Błąd instalacji pakietów")
        return False

def install_playwright():
    """Install Playwright browsers"""
    print_step(4, 7, "Instalacja Playwright browsers")
    
    python = get_venv_python()
    
    if run_command(f"{python} -m playwright install chromium"):
        print_success("Playwright gotowy")
        return True
    else:
        print_warning("Playwright może wymagać dodatkowych uprawnień")
        return True  # Non-critical

def setup_env():
    """Setup .env file"""
    print_step(5, 7, "Konfiguracja .env")
    
    if Path(".env").exists():
        print_warning(".env już istnieje")
        return True
    
    if Path(".env.example").exists():
        import shutil
        shutil.copy(".env.example", ".env")
        print_success(".env utworzony")
        print()
        print(f"{Color.BOLD}WAŻNE: UZUPEŁNIJ KLUCZE API{Color.END}")
        print("\nEdytuj plik: .env")
        print("Dodaj swoje API keys:")
        print("  - PERPLEXITY_API_KEY")
        print("  - OPENAI_API_KEY")
        print("  - DEEPSEEK_API_KEY")
        return True
    else:
        print_error(".env.example nie znaleziony")
        return False

def test_app():
    """Test if app can be imported"""
    print_step(6, 7, "Testowanie aplikacji")
    
    python = get_venv_python()
    result = run_command(
        f'{python} -c "from app.main import app; print(\\"OK\\")"',
        check=False,
        capture=True
    )
    
    if result == "OK":
        print_success("FastAPI app działa")
        return True
    else:
        print_warning("Aplikacja wymaga uzupełnienia .env")
        return True  # Non-critical

def print_summary():
    """Print installation summary"""
    print()
    print("=" * 50)
    print(f" {Color.BOLD}INSTALACJA ZAKOŃCZONA!{Color.END}")
    print("=" * 50)
    print()
    print("Co teraz:")
    print()
    print("1. Edytuj .env (dodaj API keys)")
    
    if platform.system() == "Windows":
        print("   notepad .env")
        print()
        print("2. Uruchom serwer:")
        print("   start-atlas.bat")
    else:
        print("   nano .env")
        print()
        print("2. Uruchom serwer:")
        print("   bash start-atlas.sh")
    
    print()
    print("3. Otwórz przeglądarkę:")
    print("   http://localhost:8000/docs")
    print()
    print("4. Zainstaluj Chrome Extension:")
    print("   chrome://extensions/")
    print("   Load unpacked: perplexity-agent/")
    print()
    print("Dokumentacja: README.md")
    print("Quick Start: QUICKSTART.md")
    print()
    print("=" * 50)

def main():
    """Main installation flow"""
    print()
    print("=" * 50)
    print(" AI BROWSER AGENT + ATLAS SYSTEM")
    print(" ONE CLICK INSTALLER (Universal)")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not Path("requirements.txt").exists():
        print_error("Uruchom skrypt z głównego folderu projektu!")
        sys.exit(1)
    
    # Installation steps
    steps = [
        check_python,
        create_venv,
        install_dependencies,
        install_playwright,
        setup_env,
        test_app,
    ]
    
    for step in steps:
        if not step():
            print()
            print_error("Instalacja przerwana!")
            sys.exit(1)
    
    # Summary
    print_step(7, 7, "Finalizacja")
    print_success("Wszystko gotowe!")
    
    print_summary()
    
    # Ask to start
    print()
    try:
        response = input("Uruchomić serwer teraz? (t/n): ").strip().lower()
        if response in ['t', 'y', 'yes', 'tak']:
            print()
            print("Uruchamianie serwera...")
            print()
            
            python = get_venv_python()
            os.system(f"{python} -m uvicorn app.main:app --reload --port 8000")
    except KeyboardInterrupt:
        print()
        print("Gotowe! Uruchom później odpowiednim skryptem.")
        print()

if __name__ == "__main__":
    main()
