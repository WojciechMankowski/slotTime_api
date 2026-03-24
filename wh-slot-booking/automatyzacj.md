# Automatyzacje — WH Slot Booking

Dokument opisuje wszystkie planowane i możliwe do wdrożenia automatyzacje w projekcie,
podzielone na pięć obszarów: CI/CD, operacje serwera, logika biznesowa, powiadomienia
oraz automatyzacje procesów biznesowych oparte na Microsoft Power Platform.

---

## 1. CI/CD — automatyzacja budowania i wdrożenia

### 1a. Pipeline GitHub Actions — testy i build (PR)

**Plik:** `.github/workflows/ci.yml`
**Wyzwalacz:** każdy push i pull request do `main`

```
Krok 1 — Backend tests
  └── python -m pytest tests/ -q
       ├── test_auth.py        (login, refresh token, rate limit)
       ├── test_slots.py       (CRUD, filtrowanie, statusy)
       ├── test_companies.py   (CRUD, aliasy)
       ├── test_users.py       (CRUD, role)
       ├── test_docks.py       (CRUD)
       └── test_warehouses.py  (CRUD)

Krok 2 — Frontend type check + build
  └── cd frontend && npm ci && npm run build
       ├── tsc -b              (sprawdzenie typów TypeScript)
       └── vite build          (produkcyjny bundle)

Krok 3 — Frontend tests
  └── cd frontend && npm run test:run
       └── vitest run          (unit testy komponentów i hooków)
```

**Status check blokuje merge** jeśli którykolwiek krok nie przejdzie.

---

### 1b. Pipeline GitHub Actions — wdrożenie produkcyjne (CD)

**Plik:** `.github/workflows/deploy.yml`
**Wyzwalacz:** push do gałęzi `main` (po pomyślnym CI)

```
Krok 1 — Build i push obrazów Docker
  ├── docker build backend  → ghcr.io/<org>/wh-backend:latest
  └── docker build frontend → ghcr.io/<org>/wh-frontend:latest

Krok 2 — Deploy na serwer (SSH)
  ├── git pull origin main
  ├── docker compose pull
  ├── docker compose up -d --build
  └── docker compose exec backend python -c "create_all()"

Krok 3 — Smoke test
  └── curl https://slots.domena.pl/api/health → {"ok": true}
```

**Wymagane sekrety GitHub:**
| Sekret | Opis |
|--------|------|
| `SSH_HOST` | IP/hostname serwera |
| `SSH_USER` | Użytkownik SSH |
| `SSH_PRIVATE_KEY` | Klucz prywatny SSH |
| `GHCR_TOKEN` | Token GitHub Container Registry |

---

### 1c. Pre-commit hooks (lokalnie)

**Plik:** `.pre-commit-config.yaml`
**Wyzwalacz:** `git commit`

```
Backend:
  └── ruff check app/          (linter Python)

Frontend:
  └── tsc --noEmit             (sprawdzenie typów bez buildu)
```

Instalacja:
```bash
pip install pre-commit
pre-commit install
```

---

## 2. Operacje serwera — automatyzacje cron

Wszystkie zadania działają jako cron jobs na hoście lub wewnątrz kontenera `backend`.

### 2a. Backup bazy danych

**Częstotliwość:** codziennie o 02:00
**Retencja:** 30 dni (starsze backupy usuwane automatycznie)

```bash
# /etc/cron.d/wh-backup
0 2 * * * root /opt/wh-slot-booking/scripts/backup.sh
```

```bash
# scripts/backup.sh
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M)
BACKUP_DIR=/opt/backups/wh-slot-booking

mkdir -p "$BACKUP_DIR"

docker compose -f /opt/wh-slot-booking/docker-compose.yml \
  exec -T db pg_dump -U slotuser slotbooking \
  | gzip > "$BACKUP_DIR/backup_$DATE.sql.gz"

# Usuń backupy starsze niż 30 dni
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete

echo "[$(date)] Backup: backup_$DATE.sql.gz" >> /var/log/wh-backup.log
```

---

### 2b. Health check i auto-restart

Docker Compose już obsługuje `restart: unless-stopped`.
Dodatkowy monitoring zewnętrzny przez **Cloudflare Health Checks**:

```
Zero Trust → Access → Applications → Health Check
  URL:      https://slots.domena.pl/api/health
  Interval: co 1 minuta
  Alert:    e-mail gdy endpoint nie odpowiada przez 3 min
```

Alternatywnie — cron co 5 minut:

```bash
# /etc/cron.d/wh-health
*/5 * * * * root curl -sf https://slots.domena.pl/api/health \
  || docker compose -f /opt/wh-slot-booking/docker-compose.yml restart backend
```

---

### 2c. Rotacja logów Docker

**Plik:** `/etc/docker/daemon.json`

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "5"
  }
}
```

Po zmianie: `sudo systemctl restart docker`

---

### 2d. Aktualizacja obrazu Cloudflare Tunnel

```bash
# /etc/cron.d/wh-cloudflared
0 3 * * 1 root docker compose -f /opt/wh-slot-booking/docker-compose.yml \
  pull cloudflared && docker compose up -d cloudflared
```

---

## 3. Logika biznesowa — automatyczne zmiany statusów slotów

Zadania uruchamiane przez **APScheduler** w tle wewnątrz procesu FastAPI
lub jako osobny kontener `scheduler` w `docker-compose.yml`.

### 3a. Auto-Complete — zamykanie przeterminowanych slotów

**Częstotliwość:** co 15 minut
**Logika:**

```
Znajdź sloty gdzie:
  status IN (BOOKED, APPROVED_WAITING_DETAILS, RESERVED_CONFIRMED)
  AND end_dt < NOW()

→ Zmień status na COMPLETED
→ Zaloguj zmianę w tabeli audit_log (opcjonalnie)
```

**Dlaczego:** zabezpiecza przed slotami, które nigdy nie zostały ręcznie zamknięte przez admina.

---

### 3b. Auto-Cancel — anulowanie niepotwierdzonych rezerwacji

**Częstotliwość:** co godzinę
**Logika:**

```
Znajdź sloty gdzie:
  status = BOOKED
  AND start_dt < NOW() - 2h        (slot już minął, klient nie wypełnił awizacji)

→ Zmień status na CANCELLED
→ Zwolnij slot (opcjonalnie: generuj zastępczy)
```

**Parametr konfiguроwalny:** `AUTO_CANCEL_AFTER_HOURS=2` w `.env`

---

### 3c. Czyszczenie starych slotów z archiwum

**Częstotliwość:** raz w tygodniu (niedziela 03:00)
**Logika:**

```
Usuń sloty gdzie:
  status IN (COMPLETED, CANCELLED)
  AND end_dt < NOW() - 365 dni
```

**Parametr:** `ARCHIVE_RETENTION_DAYS=365` w `.env`

---

### 3d. Generowanie slotów z szablonów (planowane)

**Częstotliwość:** codziennie o 00:05
**Logika:**

```
Dla każdego aktywnego szablonu:
  Jeśli brak slotów na jutro:
    → POST /api/slots/generate (date_from=jutro, date_to=jutro, template_id=X)
```

Opcja: admin ustawia flagę `auto_generate: true` na szablonie.

---

## 4. Powiadomienia e-mail

Backend: biblioteka **FastMail** (`fastapi-mail`) lub SMTP stdlib.
Konfiguracja przez zmienne środowiskowe w `.env`:

```env
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=noreply@firma.pl
MAIL_PASSWORD=haslo_aplikacji
MAIL_FROM=noreply@firma.pl
```

### 4a. Powiadomienie o nowej rezerwacji → admin

```
Wyzwalacz: klient zarezerwował slot (status → BOOKED)
Odbiorca:  admin magazynu
Treść:
  Firma: [alias firmy]
  Slot:  [data] [godzina start – end]
  Typ:   [INBOUND / OUTBOUND]
  Link:  https://slots.domena.pl/slots
```

---

### 4b. Potwierdzenie rezerwacji → klient

```
Wyzwalacz: admin zatwierdził slot (status → APPROVED_WAITING_DETAILS)
Odbiorca:  użytkownik który zarezerwował
Treść:
  Twój slot [data godzina] został zatwierdzony.
  Uzupełnij awizację: https://slots.domena.pl/book
```

---

### 4c. Przypomnienie o awizacji → klient

```
Wyzwalacz: cron co godzinę
Warunek:   status = APPROVED_WAITING_DETAILS AND start_dt - NOW() < 24h
           AND powiadomienie jeszcze nie wysłane
Treść:
  Przypomnienie: slot jutro o [godzina]. Uzupełnij awizację.
```

---

### 4d. Alert o niepotwierdzonych rezerwacjach → admin

```
Wyzwalacz: cron codziennie o 08:00
Warunek:   sloty z status=BOOKED na dziś/jutro bez awizacji
Treść:     Lista slotów czekających na zatwierdzenie
```

---

## 5. Power Platform — automatyzacje procesów biznesowych

Punkt wejścia dla wszystkich integracji Power Platform to REST API aplikacji
(`https://slots.domena.pl/api`). Komunikacja odbywa się przez **Custom Connector**
lub bezpośrednio przez akcję **HTTP** w Power Automate.

---

### 5a. Custom Connector — baza dla wszystkich integracji

**Gdzie:** Power Automate / Power Apps → Łączniki niestandardowe → Nowy łącznik

Custom Connector definiuje raz autoryzację i dostępne operacje — potem używają go
wszystkie flow'y i aplikacje bez konfigurowania nagłówków ręcznie.

```
Nazwa:         WH Slot Booking API
Host:          slots.domena.pl
Bazowy URL:    /api
Uwierzytelnianie: Bearer Token (JWT)

Operacje (wybrane):
  ├── GetSlots          GET  /slots
  ├── ReserveSlot       POST /slots/{id}/reserve
  ├── GetMySlots        GET  /slots/mine
  ├── GetCompanies      GET  /companies
  ├── PatchSlotStatus   PATCH /slots/{id}/status
  └── GetCalendar       GET  /calendar/summary
```

Connector eksportować jako plik `.swagger.json` i wersjonować w repozytorium.

---

### 5b. Power Automate — powiadomienia Teams przy zmianie statusu slotu

**Typ flow:** Automated cloud flow
**Wyzwalacz:** HTTP Webhook lub cykliczne odpytywanie API (co 5 minut)

#### Flow 1 — Nowa rezerwacja → kanał Teams admina

```
Wyzwalacz: Scheduled (co 5 min)
  └── HTTP GET /api/slots?status=BOOKED&modified_after=[last_run]
        │
        ├── [brak nowych] → zakończ
        │
        └── [są nowe sloty]
              └── Teams: Post message in channel
                    Kanał: "Magazyn — rezerwacje"
                    Treść (Adaptive Card):
                      🟡 Nowa rezerwacja
                      Firma:  [company_alias]
                      Slot:   [start_dt] – [end_dt]
                      Typ:    [slot_type]
                      [Przejdź do panelu →]
```

#### Flow 2 — Slot zatwierdzony → wiadomość Teams do klienta

```
Wyzwalacz: Scheduled (co 5 min)
  └── HTTP GET /api/slots?status=APPROVED_WAITING_DETAILS&modified_after=[last_run]
        └── Teams: Send a message to a user (chat 1:1)
              Do:    [e-mail użytkownika z pola reserved_by]
              Treść: ✅ Twój slot [data godzina] został zatwierdzony.
                     Uzupełnij awizację w aplikacji.
```

---

### 5c. Power Automate — zatwierdzanie slotów z poziomu Outlooka

Admin może zatwierdzić lub odrzucić rezerwację bezpośrednio z e-maila,
bez logowania do aplikacji.

**Typ flow:** Automated cloud flow

```
Wyzwalacz: Scheduled (co 15 min)
  └── HTTP GET /api/slots?status=BOOKED
        └── [dla każdego slotu]
              └── Outlook: Wyślij e-mail z możliwością działania (Actionable Message)
                    Do:      admin@firma.pl
                    Treść:   Rezerwacja od [firma] na [data godzina]
                    Przyciski:
                      [✅ Zatwierdź]  → HTTP PATCH /api/slots/{id}/status {status: APPROVED_WAITING_DETAILS}
                      [❌ Odrzuć]    → HTTP PATCH /api/slots/{id}/status {status: CANCELLED}
                    Po akcji: Teams: powiadom klienta o decyzji
```

> Wymaga rejestracji aplikacji w Microsoft Actionable Email Developer Dashboard.

---

### 5d. Power Automate — dzienny raport poranny do admina

**Typ flow:** Scheduled cloud flow
**Częstotliwość:** codziennie o 07:30

```
1. HTTP GET /api/slots?date_from=dziś&date_to=dziś
   → zlicz: AVAILABLE, BOOKED, COMPLETED, CANCELLED

2. HTTP GET /api/slots?status=BOOKED&date_from=dziś
   → lista slotów czekających na zatwierdzenie

3. Outlook: Wyślij e-mail z podsumowaniem dnia
   Do: admin@firma.pl, kierownik@firma.pl
   Temat: [data] — Plan dnia magazynu
   Treść (tabela HTML):
     Dostępnych slotów:       [X]
     Zarezerwowanych:         [X]  ← czekają na zatwierdzenie
     Zatwierdzonych:          [X]
     Zakończonych (wczoraj):  [X]
```

---

### 5e. Power Automate — tygodniowy raport wykorzystania → Excel na SharePoint

**Typ flow:** Scheduled cloud flow
**Częstotliwość:** poniedziałek 06:00 (za poprzedni tydzień)

```
1. HTTP GET /api/reports/daily?date_from=[pon]&date_to=[nd]
   → dane dzienne: total_slots, booked, completed, cancelled, utilization_%

2. SharePoint: Pobierz plik "Raporty tygodniowe.xlsx" z biblioteki dokumentów

3. Excel Online: Dodaj wiersze do tabeli "Tygodniowe"
   Kolumny: Tydzień | Magazyn | Dostępne | Zarezerwowane | Zakończone | Anulowane | Wykorzystanie%

4. Outlook: Wyślij e-mail z linkiem do pliku
   Do: zarząd@firma.pl
   Temat: Raport tygodniowy — wykorzystanie slotów [data_od] – [data_do]
```

---

### 5f. Power Automate — synchronizacja anulowań z kalendarzem Outlook

Gdy klient anuluje slot (status → `CANCEL_PENDING` lub `CANCELLED`),
admin otrzymuje zaktualizowany wpis w kalendarzu.

```
Wyzwalacz: Scheduled (co 30 min)
  └── HTTP GET /api/slots?status=CANCELLED&modified_after=[last_run]
        └── Outlook Calendar: Usuń zdarzenie (znajdź po tytule zawierającym [slot_id])
              LUB aktualizuj tytuł na "❌ ANULOWANO — [firma] [godzina]"
```

---

### 5g. Power BI — dashboard operacyjny magazynu

**Źródło danych:** bezpośrednie połączenie z PostgreSQL
(host serwera, port 5432, baza `slotbooking`, użytkownik tylko do odczytu)

#### Strona 1 — Widok dzienny (odświeżanie co 1h)

```
Kafelki KPI (górny pasek):
  ├── Sloty dzisiaj łącznie
  ├── % zajętości (BOOKED+COMPLETED / AVAILABLE)
  ├── Czekające na zatwierdzenie
  └── Anulowane dzisiaj

Wykres słupkowy poziomy:
  └── Zajętość per dok (ile slotów / ile dostępnych)

Tabela szczegółowa:
  └── Lista slotów: godzina | firma | typ | status | dok
```

#### Strona 2 — Trendy tygodniowe / miesięczne

```
Wykres liniowy:
  └── Liczba rezerwacji per dzień (ostatnie 30 dni)

Wykres kołowy:
  └── Podział INBOUND / OUTBOUND / ANY

Wykres słupkowy:
  └── Top 10 firm wg liczby rezerwacji (miesięcznie)
```

#### Strona 3 — Analiza anulowań

```
Wskaźnik:
  └── % anulowań per firma (ostatnie 90 dni)

Tabela:
  └── Firmy z najwyższym wskaźnikiem anulowań
      (sygnał do przeglądu umów / zmiany polityki rezerwacji)
```

**Odświeżanie danych:** Power BI Gateway na serwerze → automatyczne odświeżanie co 1h

---

### 5h. Power Apps — aplikacja mobilna dla kierowców

Kierowca sprawdza swój slot na telefonie bez logowania do pełnej aplikacji webowej.

**Typ:** Canvas App (Mobile)

```
Ekran 1 — Wyszukiwarka
  └── Pole: numer rejestracyjny pojazdu
        └── HTTP GET /api/slots?rejestracja=[nr]&status=RESERVED_CONFIRMED
              └── Lista slotów:
                    [data] [godzina] | [magazyn] | [dok] | [status]

Ekran 2 — Szczegóły slotu
  └── Dane awizacji (tylko odczyt):
        numer zlecenia | typ | ilość palet | uwagi

Ekran 3 — Nawigacja
  └── Przycisk "Nawiguj do magazynu"
        └── Otwiera Maps/Google Maps z adresem magazynu
```

**Dystrybucja:** link do aplikacji wysyłany SMS-em lub e-mailem przez flow 5b.

---

### 5i. Power Apps — panel admina osadzony w Microsoft Teams

Admin zarządza slotami bez opuszczania Teams.

**Typ:** Canvas App osadzona jako zakładka w kanale Teams

```
Zakładka "Sloty":
  ├── Lista slotów na dziś (tabela z filtrami)
  ├── Przyciski: Zatwierdź | Przypisz dok | Anuluj
  └── Formularz szybkiej awizacji

Zakładka "Kalendarz":
  └── Widok tygodniowy z kolorami statusów (iframe lub natywny)
```

Połączenie z API przez Custom Connector (sekcja 5a).

---

### 5j. Copilot Studio — chatbot Teams „Asystent Magazynowy"

Bot odpowiada na pytania admina i klienta w Teams bez otwierania aplikacji.

**Wyzwalacz:** wiadomość do bota `@Asystent Magazynowy` w Teams

```
Scenariusze obsługiwane:

Klient:
  "Kiedy mam slot?"
    → HTTP GET /api/slots/mine → wylistuj nadchodzące sloty
  "Anuluj mój slot na [data]"
    → HTTP PATCH /api/slots/{id}/status {status: CANCEL_PENDING}
    → "Prośba o anulowanie wysłana do admina."

Admin:
  "Ile wolnych slotów jest na jutro?"
    → HTTP GET /api/slots?date=jutro&status=AVAILABLE → podaj liczbę
  "Pokaż rezerwacje czekające na zatwierdzenie"
    → HTTP GET /api/slots?status=BOOKED → lista jako Adaptive Card
  "Wygeneruj sloty na przyszły tydzień z szablonu X"
    → HTTP POST /api/slots/generate → potwierdzenie
```

**Autoryzacja:** bot używa konta serwisowego z rolą `admin`
(oddzielny user tylko do integracji Power Platform).

---

## 6. Harmonogram wdrożenia automatyzacji

| Priorytet | Obszar | Automatyzacja | Złożoność | Wartość |
|-----------|--------|--------------|-----------|---------|
| 🔴 Wysoki | Serwer | CI — testy backend (GitHub Actions) | niska | krytyczna |
| 🔴 Wysoki | Serwer | Backup bazy danych (cron) | niska | krytyczna |
| 🔴 Wysoki | Serwer | Health check + auto-restart | niska | wysoka |
| 🔴 Wysoki | Power Platform | Custom Connector (baza integracji) | niska | krytyczna |
| 🟡 Średni | Serwer | CD — deploy na push do main | średnia | wysoka |
| 🟡 Średni | Logika | Auto-Complete przeterminowanych slotów | średnia | wysoka |
| 🟡 Średni | Power Platform | Power Automate — powiadomienia Teams | niska | wysoka |
| 🟡 Średni | Power Platform | Power Automate — dzienny raport e-mail | niska | wysoka |
| 🟡 Średni | Power Platform | Power BI — dashboard operacyjny | średnia | wysoka |
| 🟡 Średni | E-mail | Powiadomienie: nowa rezerwacja → admin | średnia | średnia |
| 🟢 Niski | Power Platform | Power Automate — zatwierdzanie z Outlooka | średnia | średnia |
| 🟢 Niski | Power Platform | Power Automate — raport tygodniowy Excel | średnia | średnia |
| 🟢 Niski | Power Platform | Power Apps — aplikacja mobilna kierowcy | wysoka | średnia |
| 🟢 Niski | Power Platform | Power Apps — panel admina w Teams | wysoka | średnia |
| 🟢 Niski | Logika | Auto-Cancel niepotwierdzonych rezerwacji | średnia | średnia |
| 🟢 Niski | Logika | Generowanie slotów z szablonów (auto) | wysoka | średnia |
| 🟢 Niski | E-mail | Przypomnienie o awizacji | średnia | niska |
| 🟢 Niski | Power Platform | Copilot Studio — chatbot Teams | wysoka | niska |
| 🟢 Niski | Logika | Czyszczenie archiwum | niska | niska |

---

## 7. Struktura plików automatyzacji

```
wh-slot-booking/
├── .github/
│   └── workflows/
│       ├── ci.yml              ← testy + build check na każdym PR
│       └── deploy.yml          ← deploy na push do main
├── .pre-commit-config.yaml     ← pre-commit hooks (ruff, tsc)
├── scripts/
│   ├── backup.sh               ← backup PostgreSQL
│   └── healthcheck.sh          ← zewnętrzny health check + restart
├── power-platform/
│   ├── connector/
│   │   └── wh-slot-booking.swagger.json   ← definicja Custom Connector
│   └── flows/
│       ├── notyfikacje-teams.json         ← export flow 5b
│       ├── raport-dzienny.json            ← export flow 5d
│       ├── raport-tygodniowy.json         ← export flow 5e
│       └── zatwierdzanie-outlook.json     ← export flow 5c
└── backend/
    └── app/
        └── scheduler.py        ← APScheduler: auto-complete, auto-cancel, e-maile
```
