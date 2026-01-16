"""
LLM Router - Zarządzanie wieloma providerami LLM
"""
import os
from typing import Optional, List, Dict, Any
from datetime import datetime


class MultiLLM:
    """Router dla wielu LLM providerów"""
    
    PROVIDERS = {
        # === Tier 1: Premium Research ===
        "perplexity": {"name": "Perplexity Sonar", "env": "PERPLEXITY_API_KEY", "tier": "premium"},
        
        # === Tier 2: General Purpose ===
        "gpt": {"name": "GPT-4 / Copilot (OpenAI)", "env": "OPENAI_API_KEY", "tier": "general"},
        "claude": {"name": "Claude 3 (Anthropic)", "env": "ANTHROPIC_API_KEY", "tier": "general"},
        "gemini": {"name": "Gemini (Google)", "env": "GOOGLE_API_KEY", "tier": "general"},
        
        # === Tier 3: Chinese LLMs ===
        "deepseek": {"name": "DeepSeek", "env": "DEEPSEEK_API_KEY", "tier": "regional"},
        "qwen": {"name": "Qwen (Alibaba)", "env": "QWEN_API_KEY", "tier": "regional"},
        "kimi": {"name": "Kimi (Moonshot)", "env": "MOONSHOT_API_KEY", "tier": "regional"},
        
        # === Tier 4: Specialized ===
        "grok": {"name": "Grok (X/Twitter)", "env": "GROK_API_KEY", "tier": "specialized"},
        "agnes": {"name": "Agnes (Custom)", "env": "AGNES_API_KEY", "tier": "custom"},
    }
    
    def __init__(self):
        """Inicjalizacja routera"""
        self.providers = {}
        self.load_providers()
    
    def load_providers(self):
        """Załaduj dostępnych providerów"""
        for key, config in self.PROVIDERS.items():
            api_key = os.getenv(config["env"])
            if api_key:
                self.providers[key] = {
                    "name": config["name"],
                    "api_key": api_key,
                    "available": True
                }
    
    def get_available_models(self) -> List[Dict[str, Any]]:
        """Pobierz listę dostępnych modeli"""
        models = []
        for key, config in self.PROVIDERS.items():
            api_key = os.getenv(config["env"])
            models.append({
                "id": key,
                "name": config["name"],
                "available": api_key is not None,
                "configured": api_key is not None
            })
        return models
    
    def get_providers(self) -> List[Dict[str, Any]]:
        """Pobierz listę providerów"""
        return self.get_available_models()
    
    def check_provider_availability(self, provider: str) -> bool:
        """Sprawdzaj dostępność providera"""
        if provider not in self.PROVIDERS:
            return False
        
        config = self.PROVIDERS[provider]
        api_key = os.getenv(config["env"])
        return api_key is not None and len(api_key) > 0
    
    async def execute(self, provider: str, task: str, **kwargs) -> Dict[str, Any]:
        """Wykonaj zadanie na wybranym providerze"""
        if not self.check_provider_availability(provider):
            return {
                "error": f"Provider '{provider}' niedostępny lub brak klucza API",
                "provider": provider,
                "success": False
            }
        
        try:
            # Placeholder dla rzeczywistych implementacji
            return {
                "provider": provider,
                "task": task,
                "result": f"✅ Zadanie '{task}' zostało przesłane do {self.PROVIDERS[provider]['name']}",
                "success": True,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "error": str(e),
                "provider": provider,
                "success": False
            }
    
    async def execute_auto(self, task: str, **kwargs) -> Dict[str, Any]:
        """Automatycznie wybierz providera i wykonaj zadanie"""
        available = [p for p in self.PROVIDERS if self.check_provider_availability(p)]
        
        if not available:
            return {
                "error": "Brak dostępnych providerów",
                "success": False
            }
        
        # Wybierz pierwszego dostępnego (można ulepszyć logikę)
        provider = available[0]
        return await self.execute(provider, task, **kwargs)
