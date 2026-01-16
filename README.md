# 🤖 AI Browser Agent Platform v1.0

Multi-LLM AI Platform dla Browser Automation & Social Media

## 📋 Spis Treści

- [Szybki Start](#szybki-start)
- [Funkcjonalności](#funkcjonalności)
- [Instalacja](#instalacja)
- [Konfiguracja](#konfiguracja)
- [Endpointy API](#endpointy-api)
- [Chrome Extension](#chrome-extension)
- [Monitorowanie](#monitorowanie)
- [Struktura Projektu](#struktura-projektu)

---

## 🚀 Szybki Start - ONE CLICK INSTALL! 🎯

### 🪟 Windows - Jeden Klik
```cmd
INSTALL-ONE-CLICK.bat
```
Dwuklik na pliku → automatyczna instalacja → gotowe! 🚀

### 🍎 macOS / Linux - Jeden Klik
```bash
bash INSTALL-ONE-CLICK.sh
```

### 🎨 GUI Installer - Wszystkie systemy
```bash
python INSTALL-GUI.py
```
Graficzny interfejs z progress barem i logami!

### 🐳 Docker (dla zaawansowanych)
```bash
docker-compose up --build
# API dostępne na: http://localhost:8000
```

### 📦 Ręczna instalacja (opcjonalnie)
```bash
# Linux/Mac
bash install.sh

# Windows
install.bat

# Aktywuj venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate      # Windows

# Uruchom serwer
uvicorn app.main:app --reload --port 8000
```

---

## ✨ Funkcjonalności

| Funkcjonalność | Status | Opis |
|---|---|---|
| **Multi-LLM Router** | ✅ | 6 modelów AI (DeepSeek, GPT-4, Claude, Gemini, Kimi, Perplexity) |
| **Browser Automation** | ✅ | Playwright + Selenium |
| **Memory System** | ✅ | ChromaDB dla kontekstu rozmów |
| **Health Check** | ✅ | Rozszerzony monitoring providerów |
| **GitHub Integration** | ✅ | Auto-komentarze, issues, PRs |
| **Perplexity Sonar API** | ✅ | Deep Research + online search |
| **Chrome Extension** | ✅ | Integration z przeglądarką |
| **Voice Control** | 🔄 | W planach |
| **Scheduler** | 🔄 | W planach |

---

## 💻 Instalacja

### Wymagania
- Python 3.10+
- Node.js 16+ (dla extension)
- Docker & Docker Compose (opcjonalnie)

### Krok 1: Klonuj/Pobierz
```bash
git clone https://github.com/yourname/ai-browser-agent.git
cd ai-browser-agent
```

### Krok 2: Automatyczna Instalacja
```bash
# Linux/Mac
bash install.sh

# Windows (PowerShell)
.\install.bat  # lub
python install.py
```

### Krok 3: Konfiguracja .env
```bash
cp .env.example .env
# Edytuj .env i uzupełnij API keys
```

### Krok 4: Chrome Extension
```bash
# 1. Otwórz Chrome: chrome://extensions/
# 2. Włącz "Developer mode" (prawy górny róg)
# 3. Kliknij "Load unpacked"
# 4. Wybierz folder: perplexity-agent/
```

---

## 🔧 Konfiguracja

### .env Zmienne

```env
# Perplexity (wymagane dla Sonar API)
PERPLEXITY_API_KEY=pplx-...

# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Google
GOOGLE_API_KEY=...

# Moonshot (Kimi)
MOONSHOT_API_KEY=sk-...

# DeepSeek
DEEPSEEK_API_KEY=sk-...

# GitHub
GITHUB_TOKEN=ghp_...

# Ustawienia
ENVIRONMENT=development
PORT=8000
LOG_LEVEL=INFO
```

### Docker Environment
```yaml
# Automatycznie czyta z .env
docker-compose up
```

---

## 📡 Endpointy API

### Health & Status
```bash
# Health check ze statusem providerów
GET /health
→ {"status": "healthy", "providers": {...}}

# Kubernetes liveness probe
GET /healthz

# Readiness probe
GET /ready
```

### Modele & Providery
```bash
# Dostępne modele
GET /api/models
→ [{"id": "gpt", "name": "GPT-4", "available": true}, ...]

# Dostępni providery
GET /api/providers
```

### Agent Execution
```bash
# Wykonaj zadanie (wybrany provider)
POST /api/agent/{provider}/execute
Body: {"task": "Napisz Hello World"}
→ {"provider": "deepseek", "result": "...", "timestamp": "..."}

# Auto-wybór providera
POST /api/agent/auto/execute
Body: {"task": "..."}
```

### Browser Automation
```bash
# Nawiguj na stronę
POST /api/browser/navigate
Body: {"url": "https://github.com"}

# Kliknij element
POST /api/browser/click
Body: {"selector": "button.submit"}
```

### Memory & History
```bash
# Przeszukaj pamięć
GET /api/memory/search?query=test

# Historia ostatnich interakcji
GET /api/memory/history?limit=10
```

### Interactive Docs
```
http://localhost:8000/docs           # Swagger UI
http://localhost:8000/redoc          # ReDoc
```

---

## 🧩 Chrome Extension

### Funkcjonalności

1. **Quick Ask Perplexity** 🔍
   - Pytaj cokolwiek z dowolnej strony
   - Odpowiedź w popup'ie
   - Copy do schowka

2. **Auto-Comment** 💬
   - Generuj komentarze na GitHub
   - Postawy na Twitter/X
   - Drafty maili

3. **Deep Research** 🔬
   - Sonar API dla online search
   - Cytowania ze źródeł
   - Bieżące informacje

### Instalacja Extension

```javascript
// background.js obsługuje:
- Perplexity API calls
- Content generation
- Auto-fill strony

// content.js dodaje:
- Context menu
- Floating toolbar
- Page automation
```

### Użycie
```
1. Zaznacz tekst na stronie
2. Right-click → "Perplexity Query"
3. Lub kliknij ikone w toolbar
4. Ustaw API key w settings
```

---

## 📊 Monitorowanie

### Real-time Monitoring
```bash
# Start monitora (sprawdza co 60s)
python monitor.py

# Custom interwał
python monitor.py 30  # co 30 sekund

# Custom URL
python monitor.py 60 http://your-api:8000
```

### Metrics
```
✅ System online/offline
📈 Uptime percentage
🔌 Provider availability
⏱️  Response times
```

### Logs
```bash
# Sprawdzaj logi
docker-compose logs -f ai-agent

# Lub lokalnie
tail -f logs/app.log
```

---

## 🏗️ Struktura Projektu

```
ai-browser-agent/
├── app/                          # Kod aplikacji
│   ├── __init__.py
│   ├── main.py                   # FastAPI app
│   ├── llm_router.py            # Multi-LLM router
│   ├── browser_automation.py    # Playwright/Selenium
│   ├── memory_manager.py        # ChromaDB
│   └── perplexity_api.py        # Sonar API wrapper
│
├── perplexity-agent/            # Chrome Extension
│   ├── manifest.json
│   ├── background.js            # Service worker
│   ├── content.js               # Page interaction
│   ├── popup.html               # UI
│   └── popup.js
│
├── web/                         # Frontend
│   ├── index.html
│   ├── dashboard.js
│   └── styles.css
│
├── logs/                        # Logi aplikacji
├── memory/                      # ChromaDB storage
├── reports/                     # Raporty z agenta
│
├── docker-compose.yml           # Docker setup
├── requirements.txt             # Python deps
├── install.sh                   # Instalacja
├── test.sh                      # Testy
├── monitor.py                   # Monitoring
├── .env.example                 # Template zmiennych
├── .gitignore
└── README.md                    # To!
```

---

## 🧪 Testowanie

### Unit Tests
```bash
pytest app/tests/ -v
```

### Integration Tests
```bash
# Start serwera
uvicorn app.main:app --reload &

# Uruchom testy
bash test.sh
```

### Manualne Testy
```bash
# Health check
curl http://localhost:8000/health

# Lista modeli
curl http://localhost:8000/api/models

# Test agenta
curl -X POST "http://localhost:8000/api/agent/deepseek/execute" \
  -H "Content-Type: application/json" \
  -d '{"task":"Cześć!"}'
```

---

## 🚀 Deployment

### Docker
```bash
# Build
docker build -t ai-browser-agent .

# Run
docker run -p 8000:8000 --env-file .env ai-browser-agent

# Compose
docker-compose up -d
```

### Kubernetes
```bash
# Health check endpoints automatyczne
GET /health     # liveness
GET /ready      # readiness

# Deploy
kubectl apply -f k8s/deployment.yaml
```

### Cloud Platforms
- **AWS ECS**: `docker-compose.yml` → ECR
- **Google Cloud Run**: `gcloud run deploy`
- **Azure Container**: `az container create`
- **Heroku**: `git push heroku main`

---

## 📚 API Examples

### Python Client
```python
import httpx
import asyncio

async def main():
    async with httpx.AsyncClient() as client:
        # Query DeepSeek
        response = await client.post(
            "http://localhost:8000/api/agent/deepseek/execute",
            json={"task": "Wyjaśnij machine learning"}
        )
        print(response.json())

asyncio.run(main())
```

### JavaScript/Node.js
```javascript
// Fetch API
const response = await fetch('http://localhost:8000/api/models');
const models = await response.json();
console.log(models);

// WebSocket (live updates)
const ws = new WebSocket('ws://localhost:8000/ws');
ws.onmessage = (event) => {
  console.log('Update:', event.data);
};
```

### cURL
```bash
# Health check
curl -X GET http://localhost:8000/health

# Execute agent
curl -X POST http://localhost:8000/api/agent/gpt/execute \
  -H "Content-Type: application/json" \
  -d '{"task":"List 5 Python tips"}'
```

---

## 🔒 Security

- API keys w `.env` (nie commituj!)
- Chrome extension permissions: `host_permissions`
- CORS middleware dla frontend
- Timeout na API calls (60s)
- Input validation z Pydantic

---

## 🐛 Troubleshooting

### "API key not configured"
```bash
# Sprawdzaj .env
cat .env | grep PERPLEXITY_API_KEY

# Docker: sprawdzaj logs
docker-compose logs ai-agent
```

### "Port 8000 already in use"
```bash
# Zmień port
uvicorn app.main:app --port 8001

# Lub zabij proces
lsof -ti:8000 | xargs kill -9
```

### Extension nie ładuje
```bash
# 1. chrome://extensions/ → refresh
# 2. Sprawdzaj Developer Tools (F12)
# 3. Ustaw API key w popup
# 4. Restart Chrome
```

### Playwright install fails
```bash
# Reinstall browsers
playwright install chromium
playwright install firefox
```

---

## 📋 Roadmap

### v1.1 (Feb 2025)
- [ ] Voice control (Whisper)
- [ ] Task scheduler
- [ ] Better memory (vectors)

### v1.2 (Mar 2025)
- [ ] Twitter/X automation
- [ ] Email integration
- [ ] Slack notifications

### v2.0 (Q2 2025)
- [ ] Multi-agent coordination
- [ ] GPU optimization
- [ ] Commercial LLM models

---

## 🤝 Contributing

1. Fork projekt
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📄 License

MIT License - patrz [LICENSE](LICENSE)

---

## 👨‍💻 Author

AI Browser Agent Team © 2025

---

## 🔗 Linki

- **API Docs**: http://localhost:8000/docs
- **GitHub**: https://github.com/yourname/ai-browser-agent
- **Issues**: https://github.com/yourname/ai-browser-agent/issues
- **Discussions**: https://github.com/yourname/ai-browser-agent/discussions

---

## 📞 Support

- 📧 Email: support@aiagent.local
- 💬 Discord: [dołącz do serwera]
- 🐦 Twitter: [@aiagent]

---

**Made with ❤️ by AI Browser Agent Team**
