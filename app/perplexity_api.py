"""
Perplexity API Wrapper - Integracja z Sonar API
"""
import os
import asyncio
import httpx
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class PerplexityModel(str, Enum):
    """Dostępne modele Perplexity"""
    SONAR_HUGE = "llama-3.1-sonar-huge-128k-online"
    SONAR_LARGE = "llama-3.1-sonar-large-128k-online"
    SONAR_SMALL = "llama-3.1-sonar-small-128k-online"
    SONAR_PRO = "llama-3.1-sonar-128k-online"


class PerplexityAPI:
    """Wrapper dla Perplexity Sonar API"""

    def __init__(self, api_key: Optional[str] = None):
        """
        Inicjalizacja
        Args:
            api_key: Klucz API (domyślnie z PERPLEXITY_API_KEY)
        """
        self.api_key = api_key or os.getenv("PERPLEXITY_API_KEY")
        self.base_url = "https://api.perplexity.ai"
        self.model = PerplexityModel.SONAR_HUGE
        self.timeout = 60

        if not self.api_key:
            raise ValueError("❌ PERPLEXITY_API_KEY not set")

        self.client = httpx.AsyncClient(
            timeout=self.timeout,
            headers={"Authorization": f"Bearer {self.api_key}"}
        )

    async def query(
        self,
        prompt: str,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        system: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Wyślij zapytanie do Perplexity API

        Args:
            prompt: Pytanie/zapytanie
            model: Model (domyślnie SONAR_HUGE)
            temperature: Temperatura (0-2)
            max_tokens: Max tokeny w odpowiedzi
            system: System prompt

        Returns:
            Słownik z odpowiedzią API
        """
        try:
            model = model or self.model

            payload = {
                "model": model,
                "messages": [
                    {
                        "role": "system",
                        "content": system or "You are a helpful AI assistant."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": temperature,
                "max_tokens": max_tokens,
                "stream": False
            }

            response = await self.client.post(
                f"{self.base_url}/chat/completions",
                json=payload
            )

            response.raise_for_status()
            return response.json()

        except httpx.HTTPError as e:
            return {
                "error": str(e),
                "success": False
            }

    async def search(
        self,
        query: str,
        focus: str = "internet"
    ) -> Dict[str, Any]:
        """
        Wyszukaj informacje online (Deep Research)

        Args:
            query: Zapytanie wyszukiwania
            focus: Typ wyszukiwania (internet, scholar, science)

        Returns:
            Wyniki z online sources
        """
        try:
            payload = {
                "model": self.model,
                "messages": [
                    {
                        "role": "user",
                        "content": query
                    }
                ],
                "search_focus": focus
            }

            response = await self.client.post(
                f"{self.base_url}/chat/completions",
                json=payload
            )

            response.raise_for_status()
            return response.json()

        except httpx.HTTPError as e:
            return {"error": str(e), "success": False}

    async def code_review(self, code: str) -> str:
        """Przegląd kodu AI"""
        prompt = f"""Przeanalizuj poniższy kod i podaj:
1. Potencjalne problemy
2. Sugestie ulepszeń
3. Best practices
4. Bezpieczeństwo

Kod:
```
{code}
```"""

        result = await self.query(prompt, temperature=0.3)
        return result.get("choices", [{}])[0].get("message", {}).get("content", "")

    async def generate_comment(self, context: str, comment_type: str = "github") -> str:
        """Generuj komentarze na GitHub / Social Media"""
        prompts = {
            "github": f"Wygeneruj profesjonalny komentarz na GitHub dotyczący: {context}",
            "twitter": f"Stwórz tweet (max 280 znaków) o: {context}",
            "email": f"Napisz profesjonalny email o: {context}",
            "review": f"Napisz review na podstawie: {context}"
        }

        prompt = prompts.get(comment_type, prompts["github"])
        result = await self.query(prompt, temperature=0.7, max_tokens=500)
        return result.get("choices", [{}])[0].get("message", {}).get("content", "")

    async def summarize(self, text: str, max_length: int = 300) -> str:
        """Podsumuj tekst"""
        prompt = f"Podsumuj poniższy tekst w max {max_length} znakach:\n\n{text}"
        result = await self.query(prompt, temperature=0.3, max_tokens=200)
        return result.get("choices", [{}])[0].get("message", {}).get("content", "")

    async def translate(self, text: str, target_language: str = "pl") -> str:
        """Przetłumacz tekst"""
        prompt = f"Przetłumacz na {target_language}:\n\n{text}"
        result = await self.query(prompt, temperature=0.3, max_tokens=2000)
        return result.get("choices", [{}])[0].get("message", {}).get("content", "")

    async def close(self):
        """Zamknij client"""
        await self.client.aclose()


# Globalna instancja
_perplexity_client: Optional[PerplexityAPI] = None


async def get_perplexity_client() -> PerplexityAPI:
    """Pobierz lub utwórz globalną instancję klienta"""
    global _perplexity_client
    if _perplexity_client is None:
        _perplexity_client = PerplexityAPI()
    return _perplexity_client


async def close_perplexity_client():
    """Zamknij globalną instancję"""
    global _perplexity_client
    if _perplexity_client:
        await _perplexity_client.close()
        _perplexity_client = None
