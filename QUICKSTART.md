# 🚀 QUICK START - AI Browser Agent

## ⚡ 5 Minut do Uruchomienia

### 1️⃣ Instalacja (1 min)

```bash
# Linux/Mac
bash install.sh

# Windows
install.bat
```

### 2️⃣ Konfiguracja (1 min)

```bash
# Edytuj .env i wklej API keys
cp .env.example .env

# Otwórz w edytorze i uzupełnij:
# - PERPLEXITY_API_KEY=pplx-...
# - OPENAI_API_KEY=sk-...
# - itp.
```

### 3️⃣ Uruchomienie (1 min)

```bash
# Linux/Mac
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Windows
venv\Scripts\activate
uvicorn app.main:app --reload --port 8000

# Docker
docker-compose up --build
```

### 4️⃣ Chrome Extension (1 min)

```
1. chrome://extensions/
2. Developer mode (ON) → prawy górny róg
3. Load unpacked → wybierz: perplexity-agent/
```

### 5️⃣ Test (1 min)

```bash
# Otwórz w przeglądarce
http://localhost:8000/health
http://localhost:8000/docs

# Lub test via CLI
bash test.sh
```

---

## 🔗 Ważne Linki

| Nazwa | URL |
|---|---|
| **API Docs** | http://localhost:8000/docs |
| **Health Check** | http://localhost:8000/health |
| **Models** | http://localhost:8000/api/models |

---

## 🧪 Testowanie

```bash
# Test 1: Health Check
curl http://localhost:8000/health | jq

# Test 2: Modele
curl http://localhost:8000/api/models

# Test 3: DeepSeek Query
curl -X POST http://localhost:8000/api/agent/deepseek/execute \
  -H "Content-Type: application/json" \
  -d '{"task":"Cześć!"}'

# Test 4: Perplexity (jeśli API key)
curl -X POST http://localhost:8000/api/perplexity/search \
  -H "Content-Type: application/json" \
  -d '{"query":"Python best practices"}'
```

---

## 🆘 Troubleshooting

### ❌ "Port 8000 already in use"
```bash
uvicorn app.main:app --port 8001
```

### ❌ "Module not found"
```bash
pip install -r requirements.txt
```

### ❌ "API key not configured"
1. Sprawdzaj .env: `cat .env | grep PERPLEXITY`
2. Restart serwera

### ❌ Extension nie ładuje
1. chrome://extensions/ → Refresh
2. F12 → Console (sprawdzaj errory)
3. Restart Chrome

---

## 📱 Extension Usage

**Na każdej stronie:**
1. Right-click na tekst → "Perplexity Query"
2. Lub kliknij ikonę extension'u
3. Wpisz pytanie
4. Kliknij "Wyślij"
5. Odpowiedź w popup

---

## 📊 Monitoring

```bash
# Real-time monitoring (co 60 sekund)
python monitor.py

# Custom interwał (co 30 sekund)
python monitor.py 30
```

---

## 🐳 Docker Commands

```bash
# Build & Run
docker-compose up --build

# Logs
docker-compose logs -f ai-agent

# Stop
docker-compose down

# Rebuild
docker-compose up --build --force-recreate
```

---

## ✅ Checklist Deployment

- [ ] Python 3.10+
- [ ] npm zainstalowany
- [ ] .env uzupełniony
- [ ] `bash install.sh` wykonany
- [ ] Serwer uruchomiony (`http://localhost:8000/health`)
- [ ] Extension załadowany
- [ ] Test.sh przeszedł
- [ ] Monitoring aktywny

---

## 🎯 Next Steps

1. **Eksploruj API**: http://localhost:8000/docs
2. **Testuj Extension**: Otwórz dowolną stronę, spróbuj query
3. **Monitoruj System**: `python monitor.py`
4. **Czytaj README.md**: Pełna dokumentacja

---

## 💡 Przydatne Tips

### Debugging
```bash
# Verbose logs
uvicorn app.main:app --log-level debug

# Check API calls
curl -v http://localhost:8000/health

# Monitor extension
chrome://extensions/ → Details → Errors
```

### Performance
```bash
# Production mode (bez reload)
uvicorn app.main:app --workers 4

# Optimize imports
python -O app/main.py
```

---

## 🎉 Gotowe!

Gratulacje! Twój AI Browser Agent jest online.

**Co dalej?**
- 📖 Czytaj [README.md](README.md)
- 🔍 Eksploruj [API Docs](http://localhost:8000/docs)
- 💬 Testuj Extension na dowolnej stronie
- 📊 Monitoruj `python monitor.py`

---

Made with ❤️ by AI Browser Agent Team
