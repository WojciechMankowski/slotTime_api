


### Backend (FastAPI)
```bash
cd backend
cp .env.example .env
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/Mac: source .venv/bin/activate
pip install -r requirements.txt
python seed.py
uvicorn app.main:app --reload --port 8000
```

### Frontend (Vite + React)
```bash
cd frontend
npm install
npm run dev
```

Otwórz: http://localhost:5173

## Dane testowe (seed)
- superadmin / superadmin
- admin / admin
- client / client

## Najważniejsze rzeczy które są już spięte
- /api/login + /api/me + JWT
- Kontekst magazynu wyliczany z usera (bez nagłówków)
- CRUD: companies/users/docks (admin) + filtrowanie dla clienta
- Slot workflow: list + reserve + approve + notice + assign-dock + cancel
- error_code w odpowiedziach błędów
- i18n PL/EN (localStorage)

## Uwaga
To jest baza do dalszej rozbudowy. Rozszerzenia: Calendar, Cancel workflow (CANCEL_PENDING), raporty, itd.
