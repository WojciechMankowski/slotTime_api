# CLAUDE.md

Ten plik dostarcza wskazówek dla Claude Code (claude.ai/code) podczas pracy z kodem w tym repozytorium.

## Opis projektu

WH Slot Booking — system rezerwacji okien czasowych (slotów) w magazynie. Firmy rezerwują sloty załadunku/rozładunku (inbound/outbound). Backend oparty na FastAPI (Python), frontend na React + TypeScript.

## Komendy deweloperskie

### Backend

```bash
cd backend
python -m venv .venv
pip install -r requirements.txt
python seed.py                              # Inicjalizacja bazy z danymi testowymi
uvicorn app.main:app --reload --port 8000  # Uruchomienie serwera deweloperskiego
```

### Frontend

```bash
cd frontend
npm install
npm run dev    # Serwer Vite pod http://localhost:5173
npm run build  # Sprawdzenie TypeScript + build produkcyjny
```

### Pełny stack (Docker)

```bash
docker compose up --build
```

### Konta testowe (po uruchomieniu seed.py)

- `superadmin` / `superadmin`
- `admin` / `admin`
- `client` / `client`

## Architektura backendu

**Framework:** FastAPI + SQLAlchemy + SQLite (konfigurowalny przez `DATABASE_URL`)

**Punkt wejścia:** `backend/app/main.py` — tworzy aplikację, dodaje middleware CORS, montuje pliki statyczne, rejestruje wszystkie routery.

**Kluczowe pliki:**
- `app/models.py` — modele ORM SQLAlchemy (wszystkie tabele)
- `app/schemas.py` — modele Pydantic dla requestów i responsów
- `app/deps.py` — wstrzykiwanie zależności: `get_db`, `get_current_user`, `get_warehouse_id`
- `app/security.py` — tworzenie i weryfikacja tokenów JWT
- `app/routers/` — jeden plik na zasób

**Kontekst magazynu:** Nigdy nie przekazywany przez nagłówki. Wyznaczany z zalogowanego użytkownika:
- `client` → `user.company.warehouse_id`
- `admin` → `user.warehouse_id`
- `superadmin` → brak przypisanego magazynu (dostęp globalny)

**Role użytkowników:** `superadmin` > `admin` > `client`. Sprawdzanie uprawnień odbywa się w zależnościach routerów.

**Błędy API:** Zawsze zwracają `{"error_code": "NAZWA_BLEDU_SNAKE_CASE"}`. Frontend mapuje te kody na komunikaty PL/EN w `Helper/i18n.ts`.

### Workflow slotów (maszyna stanów)

```
AVAILABLE → BOOKED (klient rezerwuje)
         → APPROVED_WAITING_DETAILS (admin zatwierdza)
         → RESERVED_CONFIRMED (admin przypisuje dok / klient wypełnia awizację)
         → COMPLETED | CANCELLED
```

Typy slotów: `INBOUND`, `OUTBOUND`, `ANY`.

## Architektura frontendu

**Framework:** React 18 + TypeScript + Vite + Tailwind CSS v4

**Routing:** React Router v6 w `App.tsx`. Strażnicy tras przekierowują niezalogowanych użytkowników na `/login`; rola decyduje o stronie startowej (client → `/`, admin/superadmin → `/slots`).

**Warstwa API:** `src/API/api.ts` — pojedyncza instancja Axios wskazująca na `http://127.0.0.1:8000`. Token JWT wstrzykiwany automatycznie przez interceptor requestów z `localStorage`. Vite proxy przekierowuje `/api` i `/static` do `http://localhost:8000` w trybie deweloperskim.

**Zarządzanie stanem:** Brak globalnej biblioteki stanu. Każda strona/funkcjonalność ma dedykowany custom hook w `src/hooks/`, który zarządza pobieraniem danych, mutacjami i stanem lokalnym.

**i18n:** `src/Helper/i18n.ts` — płaskie słowniki PL/EN. Język przechowywany w `localStorage`. Kody błędów z API tłumaczone przez słownik `errorText` w tym samym pliku.

**Serwisy API:** `src/API/service*.ts` — cienkie wrappery nad instancją Axios, jeden plik na zasób backendowy.

**Typy:** `src/Types/` — wspólne interfejsy TypeScript. `apiType.ts` odzwierciedla schematy Pydantic backendu.

## Baza danych

Tabele: `warehouses`, `companies`, `users`, `docks`, `slots`, `slot_notices`, `day_capacities`, `slot_templates`.

`seed.py` usuwa i odtwarza wszystkie tabele, następnie wstawia dane demo. Nie uruchamiać na produkcji.

Alembic jest zainstalowany, ale migracje nie są aktywnie używane — zmiany schematu realizowane są przez modyfikację `models.py` i ponowne uruchomienie `seed.py`.

## Dokumentacja

- `docs/master_prompt-2.1.md` — wiążące wymagania funkcjonalne; konsultować przed implementacją nowych funkcji.
- `docs/roadmap_backlog.md` — planowane prace.
- `struktura_danych.md` — dokumentacja modelu danych.
- `zadania.md` — changelog / dziennik zadań.
