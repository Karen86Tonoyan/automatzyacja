#!/bin/bash
# start-atlas.sh - Uruchom AI Browser Agent + ATLAS

echo "🤖 Starting AI Browser Agent + ATLAS System"
echo "=============================================="

# Sprawdzaj czy venv istnieje
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment nie istnieje. Uruchom: bash install.sh"
    exit 1
fi

# Aktywuj venv
echo "📦 Aktywowanie virtual environment..."
source venv/bin/activate 2>/dev/null || . venv/Scripts/activate 2>/dev/null

# Sprawdzaj .env
if [ ! -f ".env" ]; then
    echo "⚠️  Brak pliku .env - kopiuję z .env.example"
    cp .env.example .env
    echo "❗ Uzupełnij klucze API w .env przed uruchomieniem!"
    exit 1
fi

# Uruchom serwer
echo ""
echo "🚀 Uruchamianie serwera..."
echo "   API: http://localhost:8000"
echo "   Docs: http://localhost:8000/docs"
echo "   ATLAS: http://localhost:8000/api/atlas/agents"
echo ""
echo "Press Ctrl+C to stop"
echo ""

uvicorn app.main:app --reload --port 8000
