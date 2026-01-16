#!/bin/bash
# Start helper for Comet Engine Demo
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_DIR="$ROOT_DIR/server"

echo ""
echo "========================================"
echo "  COMET ENGINE DEMO - START"
echo "========================================"
echo ""

# Check Node
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Brak node. Zainstaluj Node.js 18+ (https://nodejs.org/)" >&2
  exit 1
fi

cd "$SERVER_DIR"

# Install deps (idempotent)
echo "📦 Instalacja zależności (npm install)..."
npm install --silent

echo "🚀 Uruchamiam serwer na http://localhost:8080"
node server.js
