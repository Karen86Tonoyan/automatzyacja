#!/bin/bash
# test.sh - Testowanie AI Browser Agent

echo "🧪 Testowanie AI Browser Agent + Perplexity"
echo "============================================"

# Czekaj na start serwera
echo ""
echo "⏳ Czekam na start serwera..."
sleep 2

API_URL="http://localhost:8000"

# 1. Health check
echo ""
echo "1️⃣  Health check..."
HEALTH=$(curl -s "$API_URL/health")
if echo "$HEALTH" | grep -q "healthy"; then
    echo "✅ System online"
else
    echo "❌ System offline"
    exit 1
fi

# 2. Lista modeli
echo ""
echo "2️⃣  Lista dostępnych modeli..."
curl -s "$API_URL/api/models" | grep -o '"name":"[^"]*"' | head -3

# 3. Lista providerów
echo ""
echo "3️⃣  Providerzy..."
curl -s "$API_URL/api/providers"

# 4. Test API
echo ""
echo "4️⃣  Test agenta..."
curl -s -X POST "$API_URL/api/agent/deepseek/execute" \
    -H "Content-Type: application/json" \
    -d '{"task":"test"}'

echo ""
echo "✅ Testy zakończone"
