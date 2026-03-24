# Instrukcja wdrożenia — WH Slot Booking

## Architektura

```
Internet
    │
    ▼
Cloudflare Tunnel (cloudflared)
    │
    ▼
Nginx — port 80
    ├── /api/*    ──► FastAPI backend (port 8000)
    ├── /static/* ──► FastAPI backend (port 8000)
    └── /*        ──► React SPA (zbudowane pliki statyczne)

FastAPI backend (port 8000)
    │
    ▼
PostgreSQL 16 (port 5432)
```

---

## Wymagania wstępne

- Linux z zainstalowanym **Docker** (≥ 24) i **Docker Compose** (≥ 2.20)
- Konto **Cloudflare** (bezpłatne) z domeną dodaną do Cloudflare
- Zainstalowane `cloudflared` na serwerze (jednorazowo, do konfiguracji tunelu)

### Instalacja cloudflared (Debian/Ubuntu)

```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb
```

---

## Krok 1 — Sklonuj repozytorium

```bash
git clone <url-repozytorium> wh-slot-booking
cd wh-slot-booking
```

---

## Krok 2 — Konfiguracja Cloudflare Tunnel

### 2a. Zaloguj się do Cloudflare (jednorazowo)

```bash
cloudflared tunnel login
# Otworzy przeglądarkę — autoryzuj swoje konto Cloudflare
```

### 2b. Utwórz tunel

```bash
cloudflared tunnel create wh-slot-booking
# Zapamiętaj wyświetlony Tunnel ID (UUID)
```

### 2c. Pobierz token tunelu

```bash
cloudflared tunnel token wh-slot-booking
# Skopiuj zwrócony token — wkleisz go do .env jako CLOUDFLARE_TUNNEL_TOKEN
```

### 2d. Skonfiguruj publiczny hostname

W panelu Cloudflare:
1. Przejdź do **Zero Trust → Networks → Tunnels**
2. Kliknij tunel `wh-slot-booking` → **Edit**
3. Zakładka **Public Hostname** → **Add a public hostname**:
   - **Subdomain:** `slots` (lub inna nazwa)
   - **Domain:** `twoja-domena.pl`
   - **Service:** `http://frontend:80`
4. Zapisz

---

## Krok 3 — Przygotuj plik `.env`

```bash
cp backend/.env.example backend/.env
```

Edytuj `backend/.env` i uzupełnij wszystkie wartości:

```env
APP_ENV=production
DATABASE_URL=postgresql://slotuser:TWOJE_HASLO_DB@db:5432/slotbooking

# Generuj losowy klucz:
# python3 -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET_KEY=<64-znakowy_losowy_ciag>
JWT_EXPIRE_HOURS=8
JWT_REFRESH_DAYS=7

# Twoja domena z Cloudflare (po konfiguracji tunelu)
APP_CORS_ORIGINS=https://slots.twoja-domena.pl

# Musi być takie samo jak w DATABASE_URL
POSTGRES_PASSWORD=TWOJE_HASLO_DB

# Token z kroku 2c
CLOUDFLARE_TUNNEL_TOKEN=<token_z_cloudflare>
```

> **Ważne:** nigdy nie commituj `backend/.env` do repozytorium. Plik jest w `.gitignore`.

---

## Krok 4 — Pierwsze uruchomienie

```bash
docker compose up --build -d
```

Sprawdź czy wszystkie kontenery działają:

```bash
docker compose ps
```

Oczekiwany stan:

```
NAME          STATUS
db            running (healthy)
backend       running
frontend      running
cloudflared   running
```

Sprawdź logi w razie problemów:

```bash
docker compose logs backend     # błędy FastAPI / bazy danych
docker compose logs cloudflared # status tunelu
docker compose logs frontend    # błędy nginx
```

---

## Krok 5 — Weryfikacja

Otwórz w przeglądarce: `https://slots.twoja-domena.pl`

Powinien pojawić się ekran logowania. Sprawdź też health check API:

```bash
curl https://slots.twoja-domena.pl/api/health
# Oczekiwana odpowiedź: {"ok": true}
```

---

## Opcjonalnie — załaduj dane demo

> **Uwaga:** `seed.py` usuwa wszystkie istniejące dane i wstawia dane testowe. Uruchamiaj tylko na świeżej instalacji.

```bash
docker compose exec backend python seed.py
```

Konta testowe:
| Login | Hasło | Rola |
|-------|-------|------|
| `superadmin` | `superadmin` | superadmin |
| `admin` | `admin` | admin |
| `client` | `client` | klient |

---

## Zarządzanie

### Zatrzymanie

```bash
docker compose down
```

### Zatrzymanie z usunięciem danych bazy (NIEODWRACALNE)

```bash
docker compose down -v
```

### Aktualizacja aplikacji

```bash
git pull
docker compose up --build -d
```

### Backup bazy danych

```bash
docker compose exec db pg_dump -U slotuser slotbooking > backup_$(date +%Y%m%d).sql
```

### Przywracanie backupu

```bash
docker compose exec -T db psql -U slotuser slotbooking < backup_YYYYMMDD.sql
```

### Podgląd logów na żywo

```bash
docker compose logs -f
```

---

## Tryb deweloperski (lokalnie, bez Dockera)

```bash
# Backend
cd backend
python -m venv .venv
.venv/Scripts/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python seed.py                 # inicjalizacja SQLite + dane demo
uvicorn app.main:app --reload --port 8000

# Frontend (nowe okno terminala)
cd frontend
npm install
npm run dev                    # http://localhost:5173
```

Plik `frontend/.env.development` ustawia `VITE_API_URL=http://127.0.0.1:8000`,
więc Axios łączy się bezpośrednio z backendem. Proxy Vite (`/api`, `/static`) działa równolegle.

---

## Zmienne środowiskowe — opis

| Zmienna | Opis | Przykład |
|---------|------|---------|
| `APP_ENV` | Środowisko | `production` |
| `DATABASE_URL` | Connection string PostgreSQL | `postgresql://user:pass@db:5432/db` |
| `JWT_SECRET_KEY` | Klucz podpisywania JWT (min. 32 znaki) | `abc123...` |
| `JWT_EXPIRE_HOURS` | Ważność access tokenu (godziny) | `8` |
| `JWT_REFRESH_DAYS` | Ważność refresh tokenu (dni) | `7` |
| `APP_CORS_ORIGINS` | Dozwolone originy CORS | `https://slots.domena.pl` |
| `POSTGRES_PASSWORD` | Hasło PostgreSQL | `SuperTajne123` |
| `CLOUDFLARE_TUNNEL_TOKEN` | Token tunelu Cloudflare | `eyJ...` |
