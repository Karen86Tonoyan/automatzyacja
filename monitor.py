#!/usr/bin/env python3
"""
monitor.py - Monitoring systemu AI Browser Agent
"""
import asyncio
import httpx
from datetime import datetime
import json

class SystemMonitor:
    """Monitor systemu"""

    def __init__(self, api_url: str = "http://localhost:8000", interval: int = 60):
        self.api_url = api_url
        self.interval = interval
        self.client = httpx.AsyncClient(timeout=10)

    async def check_health(self) -> dict:
        """Sprawdzaj health check"""
        try:
            response = await self.client.get(f"{self.api_url}/health")
            if response.status_code == 200:
                return response.json()
            else:
                return {"status": "offline", "code": response.status_code}
        except Exception as e:
            return {"status": "error", "error": str(e)}

    async def monitor_loop(self):
        """Pętla monitorowania"""
        print(f"🔍 Monitoring {self.api_url} (interwał: {self.interval}s)")
        checks = 0
        successes = 0

        while True:
            try:
                health = await self.check_health()
                checks += 1
                
                if health.get("status") == "healthy":
                    successes += 1
                    icon = "✅"
                else:
                    icon = "❌"

                uptime = (successes / checks) * 100
                timestamp = datetime.now().strftime("%H:%M:%S")
                
                print(f"[{timestamp}] {icon} Status: {health.get('status', 'unknown')} | Uptime: {uptime:.1f}%")

            except Exception as e:
                print(f"[{datetime.now()}] ❌ Error: {e}")

            await asyncio.sleep(self.interval)

    async def close(self):
        """Zamknij klienta"""
        await self.client.aclose()


async def main():
    """Główna funkcja"""
    import sys
    interval = int(sys.argv[1]) if len(sys.argv) > 1 else 60
    api_url = sys.argv[2] if len(sys.argv) > 2 else "http://localhost:8000"

    monitor = SystemMonitor(api_url=api_url, interval=interval)
    try:
        await monitor.monitor_loop()
    except KeyboardInterrupt:
        print("\n✅ Monitoring zakończony")
    finally:
        await monitor.close()


if __name__ == "__main__":
    asyncio.run(main())
