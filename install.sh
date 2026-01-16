#!/bin/bash
# install.sh - Skrypt instalacji AI Browser Agent + Perplexity

set -e

echo "🤖 AI Browser Agent + Perplexity - Instalacja"
echo "=============================================="

# 1. Sprawdzenie wymagań
echo ""
echo "📋 Sprawdzanie wymagań..."

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 nie jest zainstalowany"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm nie jest zainstalowany"
    exit 1
fi

echo "✅ Python: $(python3 --version)"
echo "✅ npm: $(npm --version)"

# 2. Konfiguracja .env
echo ""
echo "🔑 Konfiguracja zmiennych środowiskowych..."

if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Utworzono plik .env - UZUPEŁNIJ KLUCZE API!"
    echo "   Edytuj: .env"
else
    echo "✅ Plik .env już istnieje"
fi

# 3. Instalacja zależności Python
echo ""
echo "📦 Instalacja zależności Python..."
python3 -m venv venv
source venv/bin/activate 2>/dev/null || . venv/Scripts/activate 2>/dev/null
pip install --upgrade pip
pip install -r requirements.txt

# 4. Instalacja Playwright
echo ""
echo "🎭 Instalacja Playwright..."
playwright install chromium

# 5. Instalacja Perplexity Extension
echo ""
echo "🔍 Przygotowanie Perplexity Extension..."
cd perplexity-agent
echo "✅ Chrome extension gotowa do załadowania"
echo "   1. Otwórz: chrome://extensions/"
echo "   2. Włącz: Developer mode"
echo "   3. Load unpacked → $(pwd)"
cd ..

# 6. Testowanie
echo ""
echo "🧪 Testowanie konfiguracji..."

python3 -c "
from app.llm_router import MultiLLM
from app.memory_manager import MemoryManager
print('✅ MultiLLM działa')
print('✅ MemoryManager działa')
" || echo "⚠️  Błąd przy testowaniu modułów"

# 7. Instrukcje uruchomienia
echo ""
echo "✅ Instalacja zakończona!"
echo ""
echo "🚀 Aby uruchomić aplikację:"
echo ""
echo "1. LOKALNIE:"
echo "   source venv/bin/activate  (Linux/Mac)"
echo "   venv\\Scripts\\activate     (Windows)"
echo "   uvicorn app.main:app --reload --port 8000"
echo ""
echo "2. DOCKER:"
echo "   docker-compose up --build"
echo ""
echo "3. Chrome Extension:"
echo "   - chrome://extensions/"
echo "   - Developer mode"
echo "   - Load unpacked: $(pwd)/perplexity-agent"
echo ""
echo "4. TESTY:"
echo "   bash test.sh"
echo ""
echo "📖 Dokumentacja: README.md"
