import http from "http";
import url from "url";

const PORT = 8080;

// prosta kolejka "subskrybentów" Comet
const clients = new Set();

// przykładowy stan – lista komunikatów
let messages = [];
let idCounter = 1;

function sendJson(res, data, status = 200) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const { pathname, query } = url.parse(req.url, true);

  // preflight CORS
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    return res.end();
  }

  // endpoint long-polling: /comet?lastId=...
  if (pathname === "/comet" && req.method === "GET") {
    const lastId = Number(query.lastId || 0);

    // sprawdź czy są już nowe wiadomości
    const newMessages = messages.filter(m => m.id > lastId);
    if (newMessages.length > 0) {
      return sendJson(res, { type: "messages", data: newMessages });
    }

    // brak nowych – trzymamy połączenie
    const client = { res, lastId };
    clients.add(client);

    // timeout bezpieczeństwa, np. 25 sekund
    const timer = setTimeout(() => {
      clients.delete(client);
      sendJson(res, { type: "keepalive", data: [] });
    }, 25000);

    // jeśli klient przerwał połączenie
    req.on("close", () => {
      clearTimeout(timer);
      clients.delete(client);
    });

    return;
  }

  // endpoint publikowania wiadomości: POST /publish {text}
  if (pathname === "/publish" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", () => {
      try {
        const payload = JSON.parse(body || "{}");
        const text = String(payload.text || "").trim();
        if (!text) {
          return sendJson(res, { error: "text required" }, 400);
        }

        const msg = { id: idCounter++, text, ts: Date.now() };
        messages.push(msg);

        // odetnij stare, żeby nie rosło bez końca
        if (messages.length > 1000) {
          messages = messages.slice(-500);
        }

        // push do wszystkich oczekujących klientów
        for (const client of clients) {
          sendJson(client.res, { type: "messages", data: [msg] });
        }
        clients.clear();

        return sendJson(res, { ok: true, message: msg });
      } catch (e) {
        return sendJson(res, { error: "bad json" }, 400);
      }
    });
    return;
  }

  // prosty healthcheck
  if (pathname === "/health") {
    return sendJson(res, { ok: true });
  }

  // 404
  sendJson(res, { error: "not found" }, 404);
});

server.listen(PORT, () => {
  console.log(`🚀 Comet engine demo listening on http://localhost:${PORT}`);
  console.log(`📡 Endpoints:`);
  console.log(`   GET  /comet?lastId=0      - Long-polling`);
  console.log(`   POST /publish             - Publikuj wiadomość`);
  console.log(`   GET  /health              - Health check`);
});
