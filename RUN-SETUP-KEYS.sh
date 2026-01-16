#!/bin/bash
# Quick setup API keys

echo ""
echo "========================================"
echo "  AI BROWSER AGENT"
echo "  API KEYS SETUP"
echo "========================================"
echo ""

if [ -f "venv/bin/python" ]; then
    venv/bin/python setup_api_keys.py
else
    python3 setup_api_keys.py
fi

echo ""
