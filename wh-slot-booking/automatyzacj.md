# Automatyzacje — WH Slot Booking

Dokument opisuje wszystkie planowane i możliwe do wdrożenia automatyzacje w projekcie,
podzielone na cztery obszary: CI/CD, operacje serwera, logika biznesowa i powiadomienia.

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

## 5. Harmonogram wdrożenia automatyzacji

| Priorytet | Automatyzacja | Złożoność | Wartość |
|-----------|--------------|-----------|---------|
| 🔴 Wysoki | CI — testy backend (GitHub Actions) | niska | krytyczna |
| 🔴 Wysoki | Backup bazy danych (cron) | niska | krytyczna |
| 🔴 Wysoki | Health check + auto-restart | niska | wysoka |
| 🟡 Średni | CD — deploy na push do main | średnia | wysoka |
| 🟡 Średni | Auto-Complete przeterminowanych slotów | średnia | wysoka |
| 🟡 Średni | Powiadomienie e-mail: nowa rezerwacja | średnia | średnia |
| 🟢 Niski | Auto-Cancel niepotwierdzonych | średnia | średnia |
| 🟢 Niski | Generowanie slotów z szablonów | wysoka | średnia |
| 🟢 Niski | Przypomnienie o awizacji (e-mail) | średnia | niska |
| 🟢 Niski | Czyszczenie archiwum | niska | niska |

---

## 6. Struktura plików automatyzacji

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
└── backend/
    └── app/
        └── scheduler.py        ← APScheduler: auto-complete, auto-cancel, e-maile
```
