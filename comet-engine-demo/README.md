# 🚀 Comet Engine Demo

Minimalny przykład **silnika long-polling** (Comet) w Node.js.

## Co to jest?

**Long-polling** to technika real-time push data:
1. Klient wysyła żądanie do serwera: "Czekaj na nową wiadomość"
2. Serwer trzyma połączenie **otwarte**
3. Gdy pojawi się nowa wiadomość, serwer ją wysyła
4. Klient otrzymuje odpowiedź i natychmiast wysyła nowe żądanie

## Struktura

```
comet-engine-demo/
├── server/
│   ├── server.js       # Node.js serwer (HTTP)
│   └── package.json    # zależności
└── client/
    └── index.html      # frontend (HTML + JS)
```

## Szybki Start

### Server

```bash
cd server
npm install
npm start
```

Serwer uruchomi się na **http://localhost:8080**

### Client

Otwórz w przeglądarce:
```
file:///path/to/client/index.html
```

Lub postaw static server:
```bash
# Python 3
cd client
python -m http.server 9000
# Otwórz http://localhost:9000
```

## API Endpoints

| Metoda | Endpoint | Opis |
|--------|----------|------|
| **GET** | `/comet?lastId=0` | Long-polling (czeka na wiadomości) |
| **POST** | `/publish` | Opublikuj nową wiadomość |
| **GET** | `/health` | Health check |

### GET /comet?lastId=0

Klient wysyła, serwer czeka na nowe wiadomości:

```javascript
const res = await fetch('http://localhost:8080/comet?lastId=0');
const payload = await res.json();
// { type: "messages", data: [{ id: 1, text: "...", ts: ... }] }
```

### POST /publish

Opublikuj wiadomość:

```javascript
const res = await fetch('http://localhost:8080/publish', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: "Hello!" })
});
const result = await res.json();
// { ok: true, message: { id: 1, text: "Hello!", ts: ... } }
```

## Jak działa?

### Serwer

1. **Kolejka klientów** (`Set<clients>`)
   - Każdy czekający klient jest przechowywany w `Set`
2. **Timeout** (25 sekund)
   - Jeśli brak wiadomości, serwer wysyła "keepalive"
   - Klient ponawia żądanie
3. **Push wiadomości**
   - Gdy pojawi się nowa wiadomość, serwer:
     - Zapisuje ją do bazy
     - Wysyła do **wszystkich czekających klientów**
     - Czyszcza `Set clients`

### Klient

1. **Inicjalizuj loop** (`cometLoop()`)
2. **Wysłanie żądania** `/comet?lastId=X`
3. **Czekanie na odpowiedź** (do 25 sekund)
4. **Odbierz dane** i wyświetl w UI
5. **Ponów** → wróć do kroku 2

## Cechy

✅ **Zero dependencies** (czysty Node.js HTTP)  
✅ **CORS enabled** (dostęp z przeglądarki)  
✅ **Timeout safety** (25 sekund)  
✅ **Memory efficient** (trzyma max 1000 wiadomości)  
✅ **Responsive UI** (HTML5 + vanilla JS)  

## Porównanie technik

| Technika | Latency | Overhead | Browser |
|----------|---------|----------|---------|
| **Long-polling** | Wysoki | Średni | Wszyscy ✅ |
| **WebSocket** | Niski | Niski | Nowoczesne ✅ |
| **Server-Sent Events** | Niski | Niski | Większość ✅ |

Long-polling: najlepsza kompatybilność, ale może być wolniejsze w high-frequency scenariuszach.

## Personalizacja

### Zmiana portu
Edytuj `server/server.js`:
```javascript
const PORT = 8080; // zmień na np. 3000
```

### Timeout
```javascript
const timer = setTimeout(() => {
  // zmień 25000 na inne (w ms)
}, 25000);
```

### Max wiadomości
```javascript
if (messages.length > 1000) {
  messages = messages.slice(-500);
}
```

## Deployment

### Localhost
```bash
npm start
```

### Production (np. Heroku, Railway)
1. Dodaj `PORT` env var
2. Update `server.js` aby czytał PORT z env:
```javascript
const PORT = process.env.PORT || 8080;
```

## Troubleshooting

**❌ CORS error?**
- Serwer ma `Access-Control-Allow-Origin: *`
- Sprawdź URL w kliencie

**❌ Port już zajęty?**
- Zmień `const PORT = 8080` na inny

**❌ Brak npm?**
- Zainstaluj Node.js z https://nodejs.org

## Rozszerzenia

- Dodaj autentykację (token w URL)
- Persystencja (baza danych zamiast array)
- Pokoje/kanały (różne `/comet` dla różnych grup)
- Compression (gzip dla payloads)

## Licencja

MIT - Używaj swobodnie! 🎉
