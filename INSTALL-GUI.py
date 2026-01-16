"""
AI Browser Agent - GUI Installer
Graficzny instalator z interfejsem użytkownika
"""
import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import threading
import subprocess
import sys
import platform
from pathlib import Path
import queue

class InstallerGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("AI Browser Agent - Instalator")
        self.root.geometry("700x550")
        self.root.resizable(False, False)
        
        # Colors
        self.bg_color = "#1e1e1e"
        self.fg_color = "#ffffff"
        self.accent_color = "#007acc"
        self.success_color = "#4caf50"
        self.error_color = "#f44336"
        
        # Queue for thread communication
        self.log_queue = queue.Queue()
        
        # Setup UI
        self.setup_ui()
        
        # Start log processor
        self.process_log_queue()
    
    def setup_ui(self):
        """Setup UI components"""
        # Configure style
        style = ttk.Style()
        style.theme_use('clam')
        
        # Header
        header = tk.Frame(self.root, bg=self.accent_color, height=80)
        header.pack(fill=tk.X)
        header.pack_propagate(False)
        
        title = tk.Label(
            header,
            text="AI BROWSER AGENT + ATLAS",
            font=("Arial", 24, "bold"),
            bg=self.accent_color,
            fg=self.fg_color
        )
        title.pack(pady=15)
        
        subtitle = tk.Label(
            header,
            text="Instalator One-Click",
            font=("Arial", 12),
            bg=self.accent_color,
            fg=self.fg_color
        )
        subtitle.place(x=10, y=55)
        
        # Main content
        content = tk.Frame(self.root, bg=self.bg_color)
        content.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)
        
        # Progress label
        self.progress_label = tk.Label(
            content,
            text="Gotowy do instalacji",
            font=("Arial", 11),
            bg=self.bg_color,
            fg=self.fg_color
        )
        self.progress_label.pack(pady=(0, 10))
        
        # Progress bar
        self.progress = ttk.Progressbar(
            content,
            mode='determinate',
            length=660,
            maximum=7
        )
        self.progress.pack(pady=10)
        
        # Log area
        log_frame = tk.Frame(content, bg=self.bg_color)
        log_frame.pack(fill=tk.BOTH, expand=True, pady=10)
        
        tk.Label(
            log_frame,
            text="Log instalacji:",
            font=("Arial", 10, "bold"),
            bg=self.bg_color,
            fg=self.fg_color
        ).pack(anchor=tk.W)
        
        self.log_text = scrolledtext.ScrolledText(
            log_frame,
            height=15,
            bg="#2d2d2d",
            fg=self.fg_color,
            font=("Consolas", 9),
            state='disabled'
        )
        self.log_text.pack(fill=tk.BOTH, expand=True, pady=(5, 0))
        
        # Buttons
        button_frame = tk.Frame(content, bg=self.bg_color)
        button_frame.pack(pady=10)
        
        self.install_btn = tk.Button(
            button_frame,
            text="🚀 INSTALUJ",
            font=("Arial", 12, "bold"),
            bg=self.success_color,
            fg=self.fg_color,
            width=15,
            height=2,
            relief=tk.FLAT,
            cursor="hand2",
            command=self.start_installation
        )
        self.install_btn.pack(side=tk.LEFT, padx=5)
        
        self.close_btn = tk.Button(
            button_frame,
            text="Zamknij",
            font=("Arial", 12),
            bg="#555555",
            fg=self.fg_color,
            width=15,
            height=2,
            relief=tk.FLAT,
            cursor="hand2",
            command=self.root.quit
        )
        self.close_btn.pack(side=tk.LEFT, padx=5)
    
    def log(self, message, color=None):
        """Add message to log"""
        self.log_queue.put((message, color))
    
    def process_log_queue(self):
        """Process log messages from queue"""
        try:
            while True:
                message, color = self.log_queue.get_nowait()
                self.log_text.config(state='normal')
                
                if color:
                    tag = f"color_{color}"
                    self.log_text.tag_config(tag, foreground=color)
                    self.log_text.insert(tk.END, message + "\n", tag)
                else:
                    self.log_text.insert(tk.END, message + "\n")
                
                self.log_text.see(tk.END)
                self.log_text.config(state='disabled')
        except queue.Empty:
            pass
        
        self.root.after(100, self.process_log_queue)
    
    def update_progress(self, step, total, message):
        """Update progress bar and label"""
        self.progress['value'] = step
        self.progress_label.config(text=f"[{step}/{total}] {message}")
        self.log(f"[{step}/{total}] {message}...", self.accent_color)
    
    def run_command(self, command):
        """Run shell command and capture output"""
        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=300
            )
            return result.returncode == 0, result.stdout, result.stderr
        except Exception as e:
            return False, "", str(e)
    
    def installation_thread(self):
        """Installation process in separate thread"""
        try:
            # 1. Check Python
            self.update_progress(1, 7, "Sprawdzanie Python")
            version = sys.version_info
            if version.major >= 3 and version.minor >= 10:
                self.log(f"✓ Python {version.major}.{version.minor}.{version.micro}", self.success_color)
            else:
                self.log(f"✗ Python {version.major}.{version.minor} - wymagane 3.10+", self.error_color)
                raise Exception("Nieodpowiednia wersja Python")
            
            # 2. Create venv
            self.update_progress(2, 7, "Tworzenie virtual environment")
            if Path("venv").exists():
                self.log("⚠ venv już istnieje", "#FFA500")
            else:
                success, stdout, stderr = self.run_command(f"{sys.executable} -m venv venv")
                if success:
                    self.log("✓ venv utworzony", self.success_color)
                else:
                    raise Exception("Błąd tworzenia venv")
            
            # Get venv python
            if platform.system() == "Windows":
                python = "venv\\Scripts\\python.exe"
            else:
                python = "venv/bin/python"
            
            # 3. Upgrade pip
            self.update_progress(3, 7, "Aktualizacja pip")
            success, _, _ = self.run_command(f"{python} -m pip install --upgrade pip --quiet")
            if success:
                self.log("✓ pip zaktualizowany", self.success_color)
            
            # 4. Install packages
            self.update_progress(4, 7, "Instalacja pakietów (2-3 min)")
            success, stdout, stderr = self.run_command(f"{python} -m pip install -r requirements.txt --quiet")
            if success:
                self.log("✓ Pakiety zainstalowane", self.success_color)
            else:
                self.log("✗ Błąd instalacji pakietów", self.error_color)
                self.log(stderr, self.error_color)
                raise Exception("Błąd instalacji pakietów")
            
            # 5. Install Playwright
            self.update_progress(5, 7, "Instalacja Playwright browsers")
            success, _, _ = self.run_command(f"{python} -m playwright install chromium")
            if success:
                self.log("✓ Playwright gotowy", self.success_color)
            else:
                self.log("⚠ Playwright może wymagać dodatkowych uprawnień", "#FFA500")
            
            # 6. Setup .env
            self.update_progress(6, 7, "Konfiguracja .env")
            if Path(".env").exists():
                self.log("⚠ .env już istnieje", "#FFA500")
            elif Path(".env.example").exists():
                import shutil
                shutil.copy(".env.example", ".env")
                self.log("✓ .env utworzony", self.success_color)
                self.log("⚠ UZUPEŁNIJ KLUCZE API W PLIKU .env", "#FFA500")
            
            # 7. Test app
            self.update_progress(7, 7, "Testowanie aplikacji")
            success, stdout, _ = self.run_command(f'{python} -c "from app.main import app; print(\\"OK\\")"')
            if "OK" in stdout:
                self.log("✓ FastAPI app działa", self.success_color)
            else:
                self.log("⚠ Aplikacja wymaga uzupełnienia .env", "#FFA500")
            
            # Success
            self.log("\n" + "="*60, self.success_color)
            self.log("INSTALACJA ZAKOŃCZONA!", self.success_color)
            self.log("="*60 + "\n", self.success_color)
            self.log("Co teraz:")
            self.log("1. Edytuj .env (dodaj API keys)")
            if platform.system() == "Windows":
                self.log("2. Uruchom: start-atlas.bat")
            else:
                self.log("2. Uruchom: bash start-atlas.sh")
            self.log("3. Otwórz: http://localhost:8000/docs")
            self.log("4. Zainstaluj Chrome Extension z folderu: perplexity-agent/")
            
            # Enable buttons
            self.install_btn.config(
                text="✓ Gotowe",
                state=tk.NORMAL,
                bg=self.success_color
            )
            
            # Ask to start server
            if messagebox.askyesno("Instalacja zakończona", "Czy uruchomić serwer teraz?"):
                self.log("\nUruchamianie serwera...", self.accent_color)
                subprocess.Popen(f"{python} -m uvicorn app.main:app --reload --port 8000", shell=True)
        
        except Exception as e:
            self.log(f"\n✗ BŁĄD: {str(e)}", self.error_color)
            self.install_btn.config(
                text="❌ Błąd",
                state=tk.NORMAL,
                bg=self.error_color
            )
            messagebox.showerror("Błąd instalacji", str(e))
    
    def start_installation(self):
        """Start installation in background thread"""
        self.install_btn.config(state=tk.DISABLED, text="Instalowanie...")
        self.close_btn.config(state=tk.DISABLED)
        
        thread = threading.Thread(target=self.installation_thread, daemon=True)
        thread.start()

def main():
    """Main entry point"""
    # Check if we're in the right directory
    if not Path("requirements.txt").exists():
        messagebox.showerror(
            "Błąd",
            "Uruchom instalator z głównego folderu projektu!\n\n"
            "Brak pliku: requirements.txt"
        )
        sys.exit(1)
    
    root = tk.Tk()
    app = InstallerGUI(root)
    root.mainloop()

if __name__ == "__main__":
    main()
