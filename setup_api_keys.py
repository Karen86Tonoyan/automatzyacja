#!/usr/bin/env python3
"""
Interaktywny konfigurator API Keys
Automatyczne wklejanie i walidacja kluczy
"""
import os
import re
from pathlib import Path
import pyperclip  # pip install pyperclip

# Colors
class Color:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'
    BOLD = '\033[1m'

# API Key validators
VALIDATORS = {
    'PERPLEXITY_API_KEY': {
        'pattern': r'^pplx-[a-zA-Z0-9]{32,}$',
        'url': 'https://www.perplexity.ai/settings/api',
        'example': 'pplx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    },
    'OPENAI_API_KEY': {
        'pattern': r'^sk-[a-zA-Z0-9]{48,}$',
        'url': 'https://platform.openai.com/api-keys',
        'example': 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    },
    'DEEPSEEK_API_KEY': {
        'pattern': r'^sk-[a-zA-Z0-9]{32,}$',
        'url': 'https://platform.deepseek.com/api_keys',
        'example': 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    },
    'ANTHROPIC_API_KEY': {
        'pattern': r'^sk-ant-[a-zA-Z0-9\-]{95,}$',
        'url': 'https://console.anthropic.com/account/keys',
        'example': 'sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    },
    'GOOGLE_API_KEY': {
        'pattern': r'^[a-zA-Z0-9_\-]{39}$',
        'url': 'https://makersuite.google.com/app/apikey',
        'example': 'AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
    },
    'MOONSHOT_API_KEY': {
        'pattern': r'^sk-[a-zA-Z0-9]{32,}$',
        'url': 'https://platform.moonshot.cn/console/api-keys',
        'example': 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    }
}

def validate_key(key_name, key_value):
    """Validate API key format"""
    if key_name not in VALIDATORS:
        return True, "Nieznany klucz (pomijam walidację)"
    
    validator = VALIDATORS[key_name]
    pattern = validator['pattern']
    
    if re.match(pattern, key_value):
        return True, "Poprawny format"
    else:
        return False, f"Niepoprawny format (oczekiwano: {validator['example']})"

def get_clipboard_content():
    """Get content from clipboard"""
    try:
        return pyperclip.paste()
    except:
        return None

def update_env_file(key_name, key_value):
    """Update .env file with new key"""
    env_path = Path('.env')
    
    if not env_path.exists():
        # Create from example
        if Path('.env.example').exists():
            import shutil
            shutil.copy('.env.example', '.env')
        else:
            env_path.touch()
    
    # Read current content
    content = env_path.read_text()
    
    # Check if key exists
    pattern = f'^{key_name}=.*$'
    if re.search(pattern, content, re.MULTILINE):
        # Replace existing
        new_content = re.sub(pattern, f'{key_name}={key_value}', content, flags=re.MULTILINE)
    else:
        # Append new
        new_content = content.rstrip() + f'\n{key_name}={key_value}\n'
    
    # Write back
    env_path.write_text(new_content)

def setup_key(key_name, skip_option=True):
    """Interactive setup for single API key"""
    validator = VALIDATORS.get(key_name, {})
    
    print(f"\n{Color.CYAN}{'='*60}{Color.END}")
    print(f"{Color.BOLD}{key_name}{Color.END}")
    print(f"{Color.CYAN}{'='*60}{Color.END}")
    
    if validator:
        print(f"📍 Pobierz z: {Color.BLUE}{validator['url']}{Color.END}")
        print(f"📋 Format: {validator['example']}")
    
    # Check clipboard
    clipboard = get_clipboard_content()
    if clipboard and clipboard.strip():
        valid, msg = validate_key(key_name, clipboard.strip())
        if valid:
            print(f"\n{Color.GREEN}✓ Wykryto klucz w schowku!{Color.END}")
            print(f"Podgląd: {clipboard[:20]}...{clipboard[-10:]}")
            
            response = input(f"\nUżyć tego klucza? (t/n/s=skip): ").strip().lower()
            if response in ['t', 'y', 'yes', 'tak']:
                update_env_file(key_name, clipboard.strip())
                print(f"{Color.GREEN}✓ Zapisano!{Color.END}")
                return True
            elif response in ['s', 'skip', 'pomiń']:
                print(f"{Color.YELLOW}⊘ Pominięto{Color.END}")
                return False
    
    # Manual input
    print(f"\n{Color.YELLOW}Opcje:{Color.END}")
    print("1. Wklej klucz (Ctrl+V)")
    print("2. Wpisz ręcznie")
    if skip_option:
        print("3. Pomiń (s)")
    
    while True:
        api_key = input(f"\n{key_name}: ").strip()
        
        if skip_option and api_key.lower() in ['s', 'skip', 'pomiń', '']:
            print(f"{Color.YELLOW}⊘ Pominięto{Color.END}")
            return False
        
        if not api_key:
            print(f"{Color.RED}✗ Klucz nie może być pusty{Color.END}")
            continue
        
        # Validate
        valid, msg = validate_key(key_name, api_key)
        
        if valid:
            update_env_file(key_name, api_key)
            print(f"{Color.GREEN}✓ {msg} - Zapisano!{Color.END}")
            return True
        else:
            print(f"{Color.RED}✗ {msg}{Color.END}")
            retry = input("Spróbować ponownie? (t/n): ").strip().lower()
            if retry not in ['t', 'y', 'yes', 'tak']:
                print(f"{Color.YELLOW}⊘ Pominięto{Color.END}")
                return False

def main():
    """Main setup flow"""
    print(f"\n{Color.BOLD}{'='*60}{Color.END}")
    print(f"{Color.BOLD}  🔑 AI BROWSER AGENT - SETUP API KEYS{Color.END}")
    print(f"{Color.BOLD}{'='*60}{Color.END}")
    
    # Check if .env exists
    if Path('.env').exists():
        print(f"\n{Color.YELLOW}⚠ .env już istnieje{Color.END}")
        overwrite = input("Czy nadpisać istniejące klucze? (t/n): ").strip().lower()
        if overwrite not in ['t', 'y', 'yes', 'tak']:
            print("\nEdytuj ręcznie: .env")
            return
    
    print(f"\n{Color.CYAN}Skonfiguruj API keys dla providerów AI:{Color.END}")
    print("\n💡 Tips:")
    print("  • Skopiuj klucz ze strony providera (Ctrl+C)")
    print("  • Ten skrypt wykryje go automatycznie!")
    print("  • Możesz pominąć (wpisz 's' lub Enter)")
    print("  • Wymagany co najmniej 1 klucz (zalecane: Perplexity)")
    
    # Setup each key
    configured = []
    for key_name in VALIDATORS.keys():
        if setup_key(key_name):
            configured.append(key_name)
    
    # Summary
    print(f"\n{Color.BOLD}{'='*60}{Color.END}")
    print(f"{Color.BOLD}  PODSUMOWANIE{Color.END}")
    print(f"{Color.BOLD}{'='*60}{Color.END}")
    
    if configured:
        print(f"\n{Color.GREEN}✓ Skonfigurowano {len(configured)} kluczy:{Color.END}")
        for key in configured:
            print(f"  • {key}")
    else:
        print(f"\n{Color.YELLOW}⚠ Nie skonfigurowano żadnego klucza{Color.END}")
        print("Edytuj ręcznie: .env")
    
    print(f"\n{Color.CYAN}Plik konfiguracyjny: .env{Color.END}")
    print(f"\n{Color.GREEN}✓ Gotowe! Możesz teraz uruchomić serwer.{Color.END}")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n{Color.YELLOW}Przerwano przez użytkownika{Color.END}")
    except Exception as e:
        print(f"\n{Color.RED}✗ Błąd: {e}{Color.END}")
