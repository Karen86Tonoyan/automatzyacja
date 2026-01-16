pa# 🤖 ATLAS AI SYSTEM

**Automated Lead & Task Automation System**

Cyfrowy sekretarz + operator, który wyręcza cię w 70% nudnej roboty.

---

## 📦 Co Jest W Środku

```
atlas/
├── agents/                    # 4 gotowe agenty
│   ├── conversation.md        # Agent rozmów (mail + chat)
│   ├── research.md            # Agent researchu
│   ├── github.md              # Agent GitHub
│   └── wordpress.md           # Agent WordPress
│
├── workflows/                 # Gotowe flow
│   ├── lead-qualification.md
│   ├── client-onboarding.md
│   └── content-automation.md
│
├── templates/                 # Szablony
│   ├── email-responses.md
│   ├── brief-template.md
│   └── crm-structure.md
│
└── README.md                  # Ten plik
```

---

## 🚀 Szybki Start (5 min)

### 1. Wybierz Agenta

```bash
cd atlas/agents/
cat conversation.md  # Skopiuj prompt
```

### 2. Wklej Jako System Prompt

W **Cursor / Windsurf / ChatGPT**:
- Settings → System Prompt
- Wklej zawartość pliku
- Save

### 3. Testuj

```
"Odpowiedz na tę wiadomość: 
[przykładowa wiadomość od klienta]"
```

AI automatycznie:
- Kwalifikuje leada
- Zbiera brief
- Proponuje dalsze kroki

---

## 🎯 Czego Użyć Do Czego

| Zadanie | Agent | Gdzie Użyć |
|---|---|---|
| **Rozmowy z klientami** | `conversation.md` | Gmail, chatbot |
| **Analiza konkurencji** | `research.md` | Notion, arkusze |
| **Code review, issues** | `github.md` | GitHub, GitLab |
| **Wpisy, SEO, optymalizacja** | `wordpress.md` | WordPress |

---

## 💼 Agent Rozmów (Conversation)

**Co robi:**
- ✅ Odpowiada na pierwsze wiadomości
- ✅ Kwalifikuje klientów (budżet, termin, potrzeby)
- ✅ Zbiera brief
- ✅ Odsiewa słabe leady
- ✅ Przygotowuje raport dla ciebie

**Użycie:**
```
System: [wklej prompt z conversation.md]
User: "Odpowiedz na: [wiadomość od klienta]"
```

**Output:**
- Drafty odpowiedzi
- Ocena leada (1-10)
- Brief klienta
- Rekomendacja (kontynuuj / zamknij)

---

## 🔍 Agent Research

**Co robi:**
- ✅ Analizuje firmy z twojej niszy
- ✅ Sprawdza strony, oferty, słabe punkty
- ✅ Generuje tabelę z okazjami sprzedaży
- ✅ Proponuje rozwiązania

**Użycie:**
```
"Znajdź 20 firm z niszy [X] i przeanalizuj:
- stronę
- ofertę
- problemy
- szanse sprzedaży"
```

**Output:**
- Tabela w CSV/Excel
- Brief każdej firmy
- Ranking (najlepsze leady na górze)

---

## 🧑‍💻 Agent GitHub

**Co robi:**
- ✅ Code review
- ✅ Otwiera issues
- ✅ Pisze dokumentację
- ✅ Generuje testy
- ✅ Proponuje refactor

**Użycie:**
```
"Przeanalizuj repo [URL] i:
- zrób code review
- otwórz 5 issues na ulepszenia
- napisz README.md"
```

**Output:**
- PR ready code
- Issues z priorytetem
- Dokumentacja

---

## 📝 Agent WordPress

**Co robi:**
- ✅ Pisze wpisy SEO
- ✅ Optymalizuje szybkość
- ✅ Sprawdza broken linki
- ✅ Aktualizuje treści
- ✅ Pilnuje bezpieczeństwa

**Użycie:**
```
"Napisz wpis na temat [X]:
- 1500 słów
- SEO optymalizacja
- meta description
- nagłówki H2-H3"
```

**Output:**
- Gotowy wpis HTML
- Meta dane
- Sugestie kategorii/tagów

---

## 🔗 Integracje (Opcjonalne)

### Make.com / Zapier

**Flow rozmów:**
```
Gmail → Make → AI Agent → Draft → Twoje zatwierdzenie
```

**Flow research:**
```
Lista firm → AI → Analiza → Google Sheets → Powiadomienie
```

**Setup:**
1. Połącz Make z Gmail
2. Webhook → AI API
3. Response → Draft w Gmailu

---

### Notion / CRM

**Struktura bazy:**
```
Leady
├── Imię/Firma
├── Email
├── Budżet
├── Status (gorący/ciepły/zimny)
├── Brief
└── Notatki AI
```

**Auto-fill:**
- AI zbiera dane z rozmowy
- Make → Notion API
- Automatyczne dodawanie leadów

---

### Chatbot (strona)

**Platformy:**
- Tawk.to (free)
- Crisp
- Intercom

**Setup:**
1. Zainstaluj chatbot
2. Webhook → Make → AI
3. AI odpowiada w czasie rzeczywistym

---

## 📊 Przykładowy Workflow

### Kwalifikacja Leada (end-to-end)

```
1. Klient pisze na maila
   ↓
2. Make przechwytuje wiadomość
   ↓
3. AI Agent Conversation analizuje:
   - Czy lead wartościowy?
   - Jaki budżet?
   - Kiedy projekt?
   ↓
4. AI pisze draft odpowiedzi
   ↓
5. Zapisuje brief w Notion
   ↓
6. Wysyła Ci powiadomienie Slack:
   "🔥 Gorący lead: Firma X, budżet 50k"
   ↓
7. Ty: klikasz "Wyślij" lub "Edytuj"
```

**Czas twojej pracy:** 30 sekund  
**Czas AI:** 2 minuty  
**Oszczędność:** 15 minut gadki

---

## 🎓 Best Practices

### ✅ Dobre Użycie

```
❌ "Napisz mi ofertę"
✅ "Wygeneruj draft odpowiedzi na podstawie brief'u klienta"

❌ "Sprzedaj za mnie"
✅ "Przygotuj klienta do rozmowy sprzedażowej"

❌ "Załatw wszystko"
✅ "Zbierz informacje i daj mi raport"
```

### Reguła 70/30

- **70% robi AI:** kwalifikacja, research, drafty, analiza
- **30% robisz Ty:** decyzje, rozmowy sprzedażowe, zamknięcia

---

## 🔒 Bezpieczeństwo

**Ustawienia:**
- Nie podawaj AI poufnych danych klienta
- Zawsze przeglądaj odpowiedzi przed wysłaniem
- Używaj webhooków z tokenami
- Loguj wszystkie interakcje

**RODO:**
- Informuj klientów o AI (opcjonalnie)
- Przechowuj dane zgodnie z RODO
- Daj możliwość usunięcia danych

---

## 📈 Metryki Sukcesu

**Po tygodniu:**
- [ ] 50% mniej czasu na maile
- [ ] Wszystkie leady w CRM
- [ ] Zero pierdół w skrzynce

**Po miesiącu:**
- [ ] 70% rozmów prowadzi AI
- [ ] Ty wchodzisz tylko w finały
- [ ] 2x więcej czasu na biznes

---

## 🆙 Upgrade Do PRO

Jeśli chcesz **pełny system**:

### Dodatkowe Funkcje:
- ✅ Webhooki Make/Zapier (gotowe flow)
- ✅ Integracja Gmail + Notion + Slack
- ✅ Dashboard analytics
- ✅ Auto-followup (AI dopytuje klienta po X dniach)
- ✅ Multi-language support
- ✅ Voice AI (rozmowy telefoniczne)
- ✅ Custom agenty dla twojej niszy

### Setup Zajmuje:
- 2h konfiguracji
- Gotowe szablony
- Video tutorial

**Napisz co chcesz ulepszyć.**

---

## 🛠️ Troubleshooting

### "AI nie kwalifikuje dobrze"
→ Doprecyzuj w prompcie: budżet min/max, branże

### "Odpowiedzi za długie"
→ Dodaj: "Maksymalnie 3 zdania"

### "Make nie łączy się"
→ Sprawdzaj webhook URL i tokeny

---

## 📞 Support

Pytania? Problemy?
- 📧 Email: support@atlas-ai.local
- 💬 Discord: [coming soon]
- 📖 Docs: [atlas/README.md](README.md)

---

## 🎉 Ready to Go

**Twój cyfrowy sekretarz jest gotowy.**

1. Wybierz agenta (agents/)
2. Wklej prompt jako SYSTEM
3. Testuj na realnych wiadomościach
4. Iteruj (dodawaj swoje zasady)

**Oszczędzaj 10h tygodniowo.**  
**Skupiaj się na tym, co ważne.**

---

Made with ❤️ by ATLAS AI Team © 2025
