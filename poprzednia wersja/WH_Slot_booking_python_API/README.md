
# Time Slot App – lokalne MVP

Prosta aplikacja do zarządzania slotami czasowymi (awizacja dostaw/wysyłek)
działająca lokalnie na Windowsie, z backendem FastAPI + SQLite oraz lekkim
frontendem HTML+JS.

## Struktura

- `backend/` – FastAPI + SQLite
- `frontend/index.html` – UI w przeglądarce, które łączy się z API

---

## Jak uruchomić backend (Windows / Python 3.12)

1. Wejdź do katalogu backend:

```bash
cd backend
```

2. (Opcjonalnie) utwórz wirtualne środowisko:

```bash
py -m venv venv
venv\Scripts\activate
```

3. Zainstaluj zależności:

```bash
pip install -r requirements.txt
```

4. Uruchom serwer:

```bash
uvicorn app.main:app --reload
```

Backend będzie działał pod adresem:

- http://127.0.0.1:8000
- dokumentacja API: http://127.0.0.1:8000/docs

Przy starcie stworzy się plik `timeslot.db` (SQLite) oraz:

- firma: `Default Company`
- użytkownik admin:
  - login: `admin`
  - hasło: `admin`
  - rola: `admin`

---

## Jak uruchomić frontend (UI)

1. Pozostaw backend uruchomiony (musi działać na `127.0.0.1:8000`).

2. Otwórz plik:

- `frontend/index.html`

w przeglądarce (np. dwuklik lub `Otwórz za pomocą` → Chrome/Edge).

UI będzie wykonywał zapytania do API:

- `POST /api/login`
- `GET /api/slots`
- `POST /api/slots`
- `POST /api/slots/{id}/reserve`

Dzięki CORS ustawionym w backendzie, połączenie z lokalnego pliku HTML powinno działać.

---

## Logowanie i role

- domyślny użytkownik:
  - login: `admin`
  - hasło: `admin`
  - rola: `admin`

W Swaggerze (`/docs`) możesz:

- utworzyć firmę (`POST /api/companies`)
- utworzyć użytkownika-klienta (`POST /api/users` z `role="client"`)

Taki użytkownik (np. `klient1 / haslo123`) może się potem zalogować z UI
i rezerwować sloty.

---

## Powiadomienia e-mail (opcjonalnie)

Jeśli chcesz, aby przy rezerwacji slotu wysyłany był e-mail z powiadomieniem
(np. z konta Microsoft 365 / shared mailbox), ustaw zmienne środowiskowe:

```bash
set EMAIL_HOST=smtp.office365.com
set EMAIL_PORT=587
set EMAIL_USE_TLS=true

set EMAIL_USER=twoj-user@twojafirma.com
set EMAIL_PASSWORD=TwojeHaslo
set EMAIL_FROM=slot-notifications@twojafirma.com
set NOTIFY_EMAIL_TO=odbiorca@twojafirma.com
```

Następnie uruchom backend w tym samym oknie terminala. Jeśli zmienne nie będą
ustawione, rezerwacja slotu działa normalnie, tylko e-mail nie zostanie wysłany.


## Limity dzienne Inbound / Outbound

Nowa wersja dodaje tabelę `day_capacity` i endpointy:

- `POST /api/day-capacity` – ustawienie limitu na konkretny dzień:
  - `date` – data (YYYY-MM-DD)
  - `inbound_limit` – maks. liczba rezerwacji typu INBOUND na ten dzień (0 = brak limitu)
  - `outbound_limit` – maks. liczba rezerwacji typu OUTBOUND na ten dzień (0 = brak limitu)

- `GET /api/day-capacity` – lista ustawionych limitów dziennych.

Przy próbie rezerwacji slotu typu INBOUND / OUTBOUND, backend liczy aktualną liczbę
rezerwacji w danym dniu (statusy: `RESERVED_PENDING`, `RESERVED_CONFIRMED`,
`CANCEL_PENDING`). Jeśli liczba ta osiągnie limit, kolejna rezerwacja zostanie
zablokowana z komunikatem:

> "Przekroczono limit slotów {INBOUND/OUTBOUND} na dany dzień".


## Panel admina: dodawanie klientów (UI)

W `frontend/index.html` panel admina zawiera sekcję **"Klienci (firmy i użytkownicy)"**, która używa API:

- `GET /api/companies` + `POST /api/companies`
- `GET /api/users` + `POST /api/users`

Dzięki temu możesz dodawać firmy oraz konta klientów bez wchodzenia do Swaggera.

## Edycja interwału (szablony)

Dodano endpoint:
- `PATCH /api/templates/{id}`

UI pozwala wybrać szablon i edytować: nazwę, zakres godzin, **interwał**, pojemność oraz typ.

## Generowanie slotów + ustawianie limitów dziennych

Endpoint `POST /api/templates/{id}/generate` akceptuje opcjonalnie:

- `inbound_limit` (np. 5)
- `outbound_limit` (np. 30)

Jeśli wartości zostaną podane, backend automatycznie ustawi/zmieni limity dzienne dla wszystkich dni w zadanym zakresie.

---

## Rezerwacja z wyborem typu (Inbound / Outbound)

W panelu klienta, przy rezerwacji wybierasz z listy rozwijanej typ: **Inbound** lub **Outbound**.

- Jeśli slot ma typ **ANY**, wybór klienta ustala finalny typ (INBOUND/OUTBOUND) w momencie rezerwacji.
- Jeśli slot ma już typ **INBOUND** i klient wybierze **OUTBOUND** (lub odwrotnie), backend zwróci błąd z informacją, że w tym terminie ten typ nie jest dostępny.

---

## Awizacja po zatwierdzeniu przez magazyn

Po tym jak admin kliknie **Potwierdź** rezerwację, status slotu przechodzi na:

- `APPROVED_WAITING_DETAILS` – **Zatwierdzony (brak awizacji)**

Wtedy klient musi uzupełnić dane awizacyjne:

- numer zlecenia
- referencja
- rejestracja auta i naczepy
- dane kierowcy (imię/nazwisko + telefon)
- ilość palet
- uwagi (opcjonalnie)

Po zapisaniu awizacji status zmienia się na `RESERVED_CONFIRMED`.

---

## Doki magazynowe (wspólne)

Admin może przypisać do slotu konkretny **dok** (lista rozwijana w widoku magazynu).

- Domyślnie seedowane są: `Dok 1`, `Dok 2`, `Dok 3`.
- Endpointy:
  - `GET /api/docks`
  - `POST /api/docks` (admin)
  - `POST /api/slots/{id}/assign-dock` (admin)

System blokuje przypisanie tego samego doku do dwóch zachodzących na siebie slotów.
