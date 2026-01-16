"""
Chrome Extension - Backend Connection & Auth
Łączy wtyczkę z głównym serwerem (nie hardcoded API keys)
"""
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional, Dict, Any
import secrets
import json
from datetime import datetime
from app.auth import SessionLocal, User
import os

router = APIRouter(prefix="/api/extension", tags=["Chrome Extension"])

# In-memory session tokens (in production: Redis)
EXTENSION_SESSIONS: Dict[str, Dict[str, Any]] = {}


class ExtensionLogin(BaseModel):
    """Login dla Chrome extension"""
    username: str
    password: str
    device_id: Optional[str] = None


class ExtensionSession(BaseModel):
    """Sesja extension"""
    username: str
    token: str
    api_keys: Dict[str, Optional[str]]
    available_providers: list


async def verify_extension_token(x_extension_token: str = Header(...)):
    """Weryfikuj token extension"""
    if x_extension_token not in EXTENSION_SESSIONS:
        raise HTTPException(status_code=401, detail="Invalid extension token")
    
    session = EXTENSION_SESSIONS[x_extension_token]
    if session.get("expired"):
        raise HTTPException(status_code=401, detail="Token expired")
    
    return session


@router.post("/login")
async def extension_login(login: ExtensionLogin) -> ExtensionSession:
    """
    Logowanie Chrome Extension
    
    Użytkownik loguje się na konto → wytyczka otrzymuje token sesji
    Token przesyłany w każdym requestcie zamiast API keys
    """
    db = SessionLocal()
    
    try:
        # Szukaj użytkownika
        user = db.query(User).filter(User.username == login.username).first()
        
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="User not found")
        
        # Weryfikuj hasło
        # TODO: od app.auth import verify_password
        # if not verify_password(login.password, user.hashed_password):
        #     raise HTTPException(status_code=401, detail="Wrong password")
        
        # Utwórz session token
        token = secrets.token_urlsafe(32)
        
        # Zbierz API keys użytkownika (nie wysyłamy ich jawnie!)
        api_keys = {
            "perplexity": bool(user.perplexity_key),
            "openai": bool(user.openai_key),
            "claude": bool(user.anthropic_key),
            "gemini": bool(user.google_key),
            "deepseek": bool(user.deepseek_key),
            "qwen": bool(user.qwen_key),
            "kimi": bool(user.moonshot_key),
            "grok": bool(user.grok_key),
            "agnes": bool(user.agnes_key),
        }
        
        available_providers = [k for k, v in api_keys.items() if v]
        
        # Zapisz sesję
        EXTENSION_SESSIONS[token] = {
            "username": user.username,
            "user_email": user.email,
            "api_keys": api_keys,
            "available_providers": available_providers,
            "device_id": login.device_id,
            "created_at": datetime.utcnow(),
            "expired": False
        }
        
        # Update last_login
        user.last_login = datetime.utcnow()
        db.commit()
        
        return ExtensionSession(
            username=user.username,
            token=token,
            api_keys=api_keys,
            available_providers=available_providers
        )
    
    finally:
        db.close()


@router.post("/logout")
async def extension_logout(session: Dict = Depends(verify_extension_token)):
    """Wyloguj extension"""
    # Oznacz token jako wygaśnięty
    for token, sess in EXTENSION_SESSIONS.items():
        if sess == session:
            sess["expired"] = True
            break
    
    return {"status": "logged_out"}


@router.get("/status")
async def extension_status(session: Dict = Depends(verify_extension_token)):
    """Status sesji extension"""
    return {
        "username": session["username"],
        "providers": session["available_providers"],
        "created_at": session["created_at"],
        "device_id": session["device_id"]
    }


@router.post("/execute")
async def extension_execute(
    query: Dict[str, Any],
    session: Dict = Depends(verify_extension_token)
):
    """
    Wykonaj komendę przez extension
    
    Extension wysyła query + token
    Backend łączy token z API keys użytkownika
    Wywołuje LLM bez ujawniania keys extension'owi
    """
    from app.llm_router import MultiLLM
    from app.main import multi_llm
    
    try:
        username = session["username"]
        db = SessionLocal()
        user = db.query(User).filter(User.username == username).first()
        
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        provider = query.get("provider", "auto")
        task = query.get("task")
        context = query.get("context", {})
        
        if not task:
            raise HTTPException(status_code=400, detail="Missing task")
        
        # TODO: Uruchom zadanie z API keys użytkownika
        # Zamiast globalnych kluczy, użyj user.api_keys
        
        result = {
            "status": "success",
            "provider": provider,
            "task": task,
            "username": username,
            "result": "Processing...",
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Śledź użycie API
        # TODO: Track usage
        
        return result
    
    finally:
        db.close()


@router.get("/providers")
async def extension_providers(session: Dict = Depends(verify_extension_token)):
    """Dostępni providery dla tego użytkownika"""
    return {
        "available": session["available_providers"],
        "total": len(session["api_keys"])
    }
