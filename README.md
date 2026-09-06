# AI Browser Agent Platform

> **Experimental collection of Python and browser-automation prototypes**

`automatzyacja` is a multi-project workspace. Its root FastAPI application
combines a multi-provider LLM router, browser automation, local memory and a
Perplexity client. The same repository also includes a Chrome extension
prototype, an ATLAS documentation/workflow folder and a standalone Node.js
long-polling demo.

## Layout

```text
app/                    FastAPI application and service modules
chrome-ai-agent/        Chrome extension plus Node backend
perplexity-agent/       separate extension prototype
atlas/                  templates and workflow documentation
comet-engine-demo/      Node.js long-polling example
INSTALL-ONE-CLICK.*     installation helpers for different platforms
```

`app/main.py` exposes health endpoints and routes for configured providers,
models and browser-oriented functions. Its startup creates the LLM router,
browser automation, memory manager and Perplexity client.

## Requirements

- Python for the root application and Node.js for the extension/demo projects;
- a supported browser for extension experiments;
- credentials only for external providers that are deliberately enabled.

## Root setup

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
python -m pip install -r requirements.txt
uvicorn app.main:app --reload
```

The declared application health endpoint is available at `/health` after a
successful start. The Chrome backend and Comet demo have their own
`package.json` files and must be installed and run independently.

## Configuration

`.env.example` documents provider-key placeholders, server port, headless
browser settings and a local ChromaDB path. Copy it to an untracked `.env`;
add only the keys required for a chosen provider. Never commit API keys or
browser session data.

## Operational cautions

Browser automation can read or act on web pages, and provider requests can
send prompt content to third parties. Use accounts and pages you control,
review outgoing actions, and verify each provider's terms before use. The
project is experimental; endpoints and helper scripts are not a production
deployment guarantee.

## Licence

No repository-level licence file is present.
