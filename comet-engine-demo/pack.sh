#!/bin/bash
# ZIP packer dla Comet Engine Demo

echo ""
echo "========================================"
echo "  COMET ENGINE DEMO - ZIP PACKER"
echo "========================================"
echo ""

# Sprawdz czy zip jest dostepny
if ! command -v zip &> /dev/null; then
    echo "❌ Brak polecenia 'zip'"
    echo "Zainstaluj: apt install zip (Linux) lub brew install zip (macOS)"
    exit 1
fi

# Pakuj
zip -r comet-engine-demo.zip comet-engine-demo/

echo ""
echo "========================================"
echo "  ✅ GOTOWE: comet-engine-demo.zip"
echo "========================================"
echo ""
echo "Zawartosc ZIP:"
echo ""
echo "comet-engine-demo/"
echo " ├─ server/"
echo " │   ├─ server.js"
echo " │   └─ package.json"
echo " ├─ client/"
echo " │   └─ index.html"
echo " ├─ README.md"
echo " └─ .gitignore"
echo ""
echo "Rozmiar: $(du -sh comet-engine-demo.zip | cut -f1)"
echo ""
