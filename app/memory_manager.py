"""
Memory Manager - Zarządzanie pamięcią i ChromaDB
"""
from typing import Optional, List, Dict, Any
from datetime import datetime


class MemoryManager:
    """Menedżer pamięci dla interakcji"""
    
    def __init__(self):
        """Inicjalizacja"""
        self.interactions = []
        self.init_status = "initialized"
    
    async def store_interaction(
        self,
        provider: str,
        task: str,
        result: Dict[str, Any]
    ) -> bool:
        """Zapisz interakcję do pamięci"""
        try:
            interaction = {
                "timestamp": datetime.now().isoformat(),
                "provider": provider,
                "task": task,
                "result": result
            }
            self.interactions.append(interaction)
            return True
        except Exception as e:
            print(f"❌ Błąd zapisu: {e}")
            return False
    
    async def search(self, query: str) -> List[Dict[str, Any]]:
        """Przeszukaj pamięć"""
        try:
            # Placeholder dla ChromaDB
            results = [
                i for i in self.interactions
                if query.lower() in str(i).lower()
            ]
            return results
        except Exception as e:
            print(f"❌ Błąd wyszukiwania: {e}")
            return []
    
    async def get_history(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Pobierz historię interakcji"""
        try:
            return self.interactions[-limit:]
        except Exception as e:
            print(f"❌ Błąd pobierania historii: {e}")
            return []
    
    async def clear(self) -> bool:
        """Wyczyść pamięć"""
        try:
            self.interactions.clear()
            return True
        except Exception as e:
            print(f"❌ Błąd czyszczenia: {e}")
            return False
