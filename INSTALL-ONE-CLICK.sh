#!/bin/bash
# ========================================
# AI BROWSER AGENT - ONE CLICK INSTALLER
# ========================================

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo "===================================="
echo " AI BROWSER AGENT + ATLAS SYSTEM"
echo " ONE CLICK INSTALLER"
echo "===================================="
echo ""

# 1. Check Python
echo "[1/7] Sprawdzanie Python..."
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} Python 3.10+ nie jest zainstalowany!"
    echo ""
    echo "Zainstaluj:"
    echo "  macOS: brew install python3"
    echo "  Ubuntu: sudo apt install python3 python3-pip python3-venv"
    exit 1
fi
echo -e "${GREEN}[OK]${NC} Python: $(python3 --version)"
echo ""

# 2. Create venv
echo "[2/7] Tworzenie virtual environment..."
if [ -d "venv" ]; then
    echo -e "${YELLOW}[SKIP]${NC} venv już istnieje"
else
    python3 -m venv venv
    echo -e "${GREEN}[OK]${NC} venv utworzony"
fi
echo ""

# 3. Activate venv
echo "[3/7] Aktywacja venv..."
source venv/bin/activate
echo -e "${GREEN}[OK]${NC} venv aktywny"
echo ""

# 4. Upgrade pip
echo "[4/7] Aktualizacja pip..."
pip install --upgrade pip --quiet
echo -e "${GREEN}[OK]${NC} pip zaktualizowany"
echo ""

# 5. Install dependencies
echo "[5/7] Instalacja pakietów (może potrwać 2-3 min)..."
pip install -r requirements.txt --quiet
echo -e "${GREEN}[OK]${NC} Pakiety zainstalowane"
echo ""

# 6. Install Playwright
echo "[6/7] Instalacja Playwright browsers..."
playwright install chromium
echo -e "${GREEN}[OK]${NC} Playwright gotowy"
echo ""

# 7. Configure .env
echo "[7/7] Konfiguracja .env..."
if [ -f ".env" ]; then
    echo -e "${YELLOW}[SKIP]${NC} .env już istnieje"
else
    cp .env.example .env
    echo -e "${GREEN}[OK]${NC} .env utworzony"
    echo ""
    echo "===================================="
    echo " WAŻNE: UZUPEŁNIJ KLUCZE API"
    echo "===================================="
    echo ""
    echo "Edytuj plik: .env"
    echo "Dodaj swoje API keys:"
    echo "  - PERPLEXITY_API_KEY"
    echo "  - OPENAI_API_KEY"
    echo "  - DEEPSEEK_API_KEY"
    echo "  (inne opcjonalne)"
    echo ""
fi

# Test
echo ""
echo "[TEST] Sprawdzanie aplikacji..."
python -c "from app.main import app; print(' ✅ FastAPI app działa')" 2>/dev/null || \
    echo -e "${YELLOW}[WARNING]${NC} Aplikacja wymaga uzupełnienia .env"

# Summary
echo ""
echo "===================================="
echo " INSTALACJA ZAKOŃCZONA!"
echo "===================================="
echo ""
echo "Co teraz:"
echo ""
echo "1. Edytuj .env (dodaj API keys)"
echo "   nano .env"
echo ""
echo "2. Uruchom serwer:"
echo "   bash start-atlas.sh"
echo ""
echo "3. Otwórz przeglądarkę:"
echo "   http://localhost:8000/docs"
echo ""
echo "4. Zainstaluj Chrome Extension:"
echo "   chrome://extensions/"
echo "   Load unpacked: perplexity-agent/"
echo ""
echo "Dokumentacja: README.md"
echo "Quick Start: QUICKSTART.md"
echo ""
echo "===================================="

# Ask to start
echo ""
read -p "Uruchomić serwer teraz? (t/n): " START
if [[ "$START" =~ ^[Tt]$ ]]; then
    echo ""
    echo "Uruchamianie serwera..."
    echo ""
    bash start-atlas.sh
else
    echo ""
    echo "Gotowe! Uruchom później: bash start-atlas.sh"
    echo ""
fi
