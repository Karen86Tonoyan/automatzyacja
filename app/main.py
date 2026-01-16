"""
AI Browser Agent - Główna aplikacja FastAPI
"""
from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime
import os
import json
from pathlib import Path

# Import modułów aplikacji
from app.llm_router import MultiLLM
from app.browser_automation import BrowserAutomation
from app.memory_manager import MemoryManager
from app.perplexity_api import get_perplexity_client, close_perplexity_client

# Inicjalizacja menedżerów
multi_llm = None
browser_auto = None
memory_manager = None
perplexity_client = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Zarządzanie cyklem życia aplikacji"""
    global multi_llm, browser_auto, memory_manager, perplexity_client
    
    print("🚀 Inicjalizacja aplikacji...")
    
    # Inicjalizacja komponentów
    try:
        multi_llm = MultiLLM()
        browser_auto = BrowserAutomation()
        memory_manager = MemoryManager()
        perplexity_client = await get_perplexity_client()
        print("✅ Wszystkie komponenty zainicjalizowane")
    except Exception as e:
        print(f"❌ Błąd inicjalizacji: {e}")
        raise
    
    yield
    
    # Cleanup
    print("🧹 Zamykanie aplikacji...")
    if browser_auto:
        await browser_auto.cleanup()
    if perplexity_client:
        await close_perplexity_client()
    print("✅ Aplikacja zamknięta")


# Inicjalizacja aplikacji
app = FastAPI(
    title="AI Browser Agent API",
    description="Multi-LLM Platform dla Browser Automation & Social Media",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montowanie frontend'u
try:
    app.mount("/static", StaticFiles(directory="web"), name="static")
except Exception as e:
    print(f"⚠️ Nie można zamonować plików statycznych: {e}")


# ============================================================================
# HEALTH CHECK ENDPOINTS
# ============================================================================

@app.get("/health")
async def health_check():
    """Rozszerzony health check z weryfikacją providerów"""
    status = {
        "status": "healthy",
        "service": "ai-browser-agent",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "providers": {}
    }
    
    if multi_llm is None:
        return JSONResponse(
            content={**status, "status": "initializing"},
            status_code=503
        )
    
    # Sprawdź dostępność providerów
    for provider in ["kimi", "gpt", "claude", "gemini", "deepseek", "perplexity"]:
        try:
            api_key = os.getenv(f"{provider.upper()}_API_KEY")
            available = api_key is not None and len(api_key) > 0
            status["providers"][provider] = {
                "available": available,
                "has_api_key": available,
                "configured": available
            }
        except Exception as e:
            status["providers"][provider] = {
                "available": False,
                "has_api_key": False,
                "error": str(e)
            }
    
    # Sprawdzenie komponentów
    status["components"] = {
        "browser_automation": browser_auto is not None,
        "memory_system": memory_manager is not None,
        "llm_router": multi_llm is not None
    }
    
    return JSONResponse(content=status)


@app.get("/healthz")
async def kubernetes_health():
    """Liveness probe dla Kubernetes"""
    try:
        if multi_llm is None:
            return JSONResponse({"status": "initializing"}, status_code=503)
        return JSONResponse({"status": "healthy"})
    except Exception as e:
        return JSONResponse(
            {"status": "unhealthy", "error": str(e)},
            status_code=503
        )


@app.get("/ready")
async def readiness_check():
    """Readiness probe dla Kubernetes"""
    try:
        # Sprawdzenie czy wszystkie komponenty są gotowe
        if not all([multi_llm, browser_auto, memory_manager]):
            return JSONResponse({"status": "not_ready"}, status_code=503)
        
        return JSONResponse({"status": "ready"})
    except Exception as e:
        return JSONResponse(
            {"status": "not_ready", "error": str(e)},
            status_code=503
        )


# ============================================================================
# MODEL ENDPOINTS
# ============================================================================

@app.get("/api/models")
async def get_models():
    """Pobierz listę dostępnych modeli"""
    try:
        if multi_llm is None:
            raise HTTPException(status_code=503, detail="LLM Router nie zainicjalizowany")
        
        models = multi_llm.get_available_models()
        return {
            "models": models,
            "count": len(models),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/providers")
async def get_providers():
    """Pobierz listę dostępnych providerów"""
    try:
        if multi_llm is None:
            raise HTTPException(status_code=503, detail="LLM Router nie zainicjalizowany")
        
        providers = multi_llm.get_providers()
        return {
            "providers": providers,
            "count": len(providers),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# AGENT EXECUTION ENDPOINTS
# ============================================================================

@app.post("/api/agent/{provider}/execute")
async def execute_agent(provider: str, request_data: dict):
    """Wykonaj zadanie za pomocą wybranego providera"""
    try:
        if multi_llm is None:
            raise HTTPException(status_code=503, detail="LLM Router nie zainicjalizowany")
        
        task = request_data.get("task")
        if not task:
            raise HTTPException(status_code=400, detail="Brak zadania (task)")
        
        # Specjalne obsługiwanie Perplexity
        if provider == "perplexity" and perplexity_client:
            try:
                api_response = await perplexity_client.query(task)
                result = api_response.get("choices", [{}])[0].get("message", {}).get("content", "")
                
                if memory_manager:
                    await memory_manager.store_interaction(
                        provider=provider,
                        task=task,
                        result={"content": result, "model": "sonar"}
                    )
                
                return {
                    "provider": provider,
                    "task": task,
                    "result": result,
                    "timestamp": datetime.now().isoformat()
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Perplexity error: {str(e)}")
        
        # Standardowe providery
        result = await multi_llm.execute(provider, task)
        
        # Zapisz do pamięci
        if memory_manager:
            await memory_manager.store_interaction(
                provider=provider,
                task=task,
                result=result
            )
        
        return {
            "provider": provider,
            "task": task,
            "result": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/agent/auto/execute")
async def execute_agent_auto(request_data: dict):
    """Wykonaj zadanie - wybór providera automatycznie"""
    try:
        if multi_llm is None:
            raise HTTPException(status_code=503, detail="LLM Router nie zainicjalizowany")
        
        task = request_data.get("task")
        if not task:
            raise HTTPException(status_code=400, detail="Brak zadania (task)")
        
        # Automatycznie wybierz najlepszego providera
        result = await multi_llm.execute_auto(task)
        
        return {
            "task": task,
            "result": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# PERPLEXITY SPECIFIC ENDPOINTS
# ============================================================================

@app.post("/api/perplexity/search")
async def perplexity_search(request_data: dict):
    """Wyszukaj online (Perplexity Deep Research)"""
    try:
        if perplexity_client is None:
            raise HTTPException(status_code=503, detail="Perplexity nie zainicjalizowany")
        
        query = request_data.get("query")
        if not query:
            raise HTTPException(status_code=400, detail="Brak query")
        
        result = await perplexity_client.search(query, focus="internet")
        
        return {
            "query": query,
            "result": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/perplexity/summarize")
async def perplexity_summarize(request_data: dict):
    """Podsumuj tekst"""
    try:
        if perplexity_client is None:
            raise HTTPException(status_code=503, detail="Perplexity nie zainicjalizowany")
        
        text = request_data.get("text")
        if not text:
            raise HTTPException(status_code=400, detail="Brak tekstu")
        
        max_length = request_data.get("max_length", 300)
        summary = await perplexity_client.summarize(text, max_length)
        
        return {
            "original_length": len(text),
            "summary": summary,
            "summary_length": len(summary),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/perplexity/generate-comment")
async def perplexity_generate_comment(request_data: dict):
    """Generuj komentarz GitHub/Social"""
    try:
        if perplexity_client is None:
            raise HTTPException(status_code=503, detail="Perplexity nie zainicjalizowany")
        
        context = request_data.get("context")
        comment_type = request_data.get("type", "github")
        
        if not context:
            raise HTTPException(status_code=400, detail="Brak context")
        
        comment = await perplexity_client.generate_comment(context, comment_type)
        
        return {
            "type": comment_type,
            "context": context,
            "comment": comment,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/perplexity/code-review")
async def perplexity_code_review(request_data: dict):
    """Przegląd kodu AI"""
    try:
        if perplexity_client is None:
            raise HTTPException(status_code=503, detail="Perplexity nie zainicjalizowany")
        
        code = request_data.get("code")
        if not code:
            raise HTTPException(status_code=400, detail="Brak kodu")
        
        review = await perplexity_client.code_review(code)
        
        return {
            "code_length": len(code),
            "review": review,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/perplexity/translate")
async def perplexity_translate(request_data: dict):
    """Przetłumacz tekst"""
    try:
        if perplexity_client is None:
            raise HTTPException(status_code=503, detail="Perplexity nie zainicjalizowany")
        
        text = request_data.get("text")
        target_language = request_data.get("target_language", "pl")
        
        if not text:
            raise HTTPException(status_code=400, detail="Brak tekstu")
        
        translation = await perplexity_client.translate(text, target_language)
        
        return {
            "source_text": text,
            "target_language": target_language,
            "translation": translation,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# BROWSER AUTOMATION ENDPOINTS
# ============================================================================

@app.post("/api/browser/navigate")
async def browser_navigate(request_data: dict):
    """Nawiguj na zadaną stronę"""
    try:
        if browser_auto is None:
            raise HTTPException(status_code=503, detail="Browser Automation nie zainicjalizowany")
        
        url = request_data.get("url")
        if not url:
            raise HTTPException(status_code=400, detail="Brak URL")
        
        result = await browser_auto.navigate(url)
        return {"url": url, "success": result, "timestamp": datetime.now().isoformat()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/browser/click")
async def browser_click(request_data: dict):
    """Kliknij na element"""
    try:
        if browser_auto is None:
            raise HTTPException(status_code=503, detail="Browser Automation nie zainicjalizowany")
        
        selector = request_data.get("selector")
        if not selector:
            raise HTTPException(status_code=400, detail="Brak selectora")
        
        result = await browser_auto.click(selector)
        return {"selector": selector, "success": result, "timestamp": datetime.now().isoformat()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# MEMORY ENDPOINTS
# ============================================================================

@app.get("/api/memory/search")
async def memory_search(query: str):
    """Przeszukaj pamięć"""
    try:
        if memory_manager is None:
            raise HTTPException(status_code=503, detail="Memory Manager nie zainicjalizowany")
        
        results = await memory_manager.search(query)
        return {
            "query": query,
            "results": results,
            "count": len(results),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/memory/history")
async def memory_history(limit: int = 10):
    """Pobierz historię interakcji"""
    try:
        if memory_manager is None:
            raise HTTPException(status_code=503, detail="Memory Manager nie zainicjalizowany")
        
        history = await memory_manager.get_history(limit)
        return {
            "history": history,
            "count": len(history),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ATLAS AI SYSTEM ENDPOINTS
# ============================================================================

@app.get("/api/atlas/agents")
async def get_atlas_agents():
    """Lista dostępnych agentów ATLAS"""
    agents = {
        "conversation": {
            "name": "Agent Rozmów",
            "description": "Prowadzi rozmowy, kwalifikuje klientów",
            "file": "atlas/agents/conversation.md"
        },
        "research": {
            "name": "Agent Researchu",
            "description": "Analizuje firmy i konkurencję",
            "file": "atlas/agents/research.md"
        },
        "github": {
            "name": "Agent GitHub",
            "description": "Code review, issues, dokumentacja",
            "file": "atlas/agents/github.md"
        },
        "wordpress": {
            "name": "Agent WordPress",
            "description": "Automatyzacja treści i SEO",
            "file": "atlas/agents/wordpress.md"
        }
    }
    return {"agents": agents, "count": len(agents)}


@app.post("/api/atlas/qualify-lead")
async def atlas_qualify_lead(request_data: dict):
    """Kwalifikuj leada według ATLAS"""
    try:
        message = request_data.get("message", "")
        sender = request_data.get("sender", "unknown")
        
        if not message:
            raise HTTPException(status_code=400, detail="Brak wiadomości")
        
        # Używamy Perplexity do analizy
        if perplexity_client:
            prompt = f"""Jako agent ATLAS, przeanalizuj tę wiadomość i oceń lead:

Nadawca: {sender}
Wiadomość: {message}

Zbierz:
1. Co robi firma/osoba
2. Jaki problem
3. Czy jest budżet (domyśl się)
4. Czy to poważny lead

Oceń w skali 1-10 i napisz czy warto rozmawiać."""

            result = await perplexity_client.query(prompt)
            analysis = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            
            return {
                "sender": sender,
                "analysis": analysis,
                "timestamp": datetime.now().isoformat()
            }
        else:
            raise HTTPException(status_code=503, detail="Perplexity nie dostępny")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/atlas/generate-response")
async def atlas_generate_response(request_data: dict):
    """Wygeneruj odpowiedź w stylu ATLAS"""
    try:
        message = request_data.get("message", "")
        context = request_data.get("context", "")
        tone = request_data.get("tone", "professional")
        
        if not message:
            raise HTTPException(status_code=400, detail="Brak wiadomości")
        
        if perplexity_client:
            prompt = f"""Jako ATLAS Agent Rozmów, wygeneruj odpowiedź:

Kontekst: {context}
Ton: {tone}
Wiadomość klienta: {message}

Zasady:
- Profesjonalnie
- Krótko
- Zbierz info (budżet, termin, potrzeby)
- Nie obiecuj nic bez zgody szefa
- Jeśli lead słaby - grzecznie zamknij"""

            result = await perplexity_client.query(prompt)
            response = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            
            return {
                "response": response,
                "tone": tone,
                "timestamp": datetime.now().isoformat()
            }
        else:
            raise HTTPException(status_code=503, detail="Perplexity nie dostępny")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ROOT ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """Zwróć dashboard"""
    try:
        dashboard_path = Path("web/index.html")
        if dashboard_path.exists():
            return FileResponse(dashboard_path)
        else:
            return {
                "message": "Welcome to AI Browser Agent API + ATLAS",
                "version": "1.0.0",
                "docs": "/docs",
                "health": "/health",
                "atlas": "/api/atlas/agents"
            }
    except Exception as e:
        return {
            "message": "Welcome to AI Browser Agent API + ATLAS",
            "version": "1.0.0",
            "docs": "/docs",
            "error": str(e)
        }


@app.get("/api")
async def api_root():
    """Root API endpoint"""
    return {
        "message": "AI Browser Agent API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "models": "/api/models",
            "providers": "/api/providers",
            "agent": "/api/agent/{provider}/execute",
            "browser": "/api/browser/*",
            "memory": "/api/memory/*"
        }
    }


# ============================================================================
# WEBSOCKET ENDPOINTS
# ============================================================================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket dla aktualizacji na żywo"""
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            # Echo server dla testowania
            await websocket.send_json({
                "message": data,
                "timestamp": datetime.now().isoformat()
            })
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await websocket.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
