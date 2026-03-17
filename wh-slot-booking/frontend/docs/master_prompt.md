# WH Slot Booking — MASTER PROMPT (Source of Truth) v2.1
# Format: moduły → wymagania → kryteria akceptacji (AC)

---

## MODUŁ 0 — Zasady globalne

### Wymagania
G0. Backend waliduje reguły biznesowe (frontend tylko UX).
G1. Dane filtrowane po magazynie wynikającym z kontekstu użytkownika (bez nagłówków typu X-Warehouse-Id).
G2. UI-v2 jest bazą (nie upraszczać interfejsu).
G3. UI user-friendly: w UI pokazujemy aliasy/nazwy zamiast surowych ID.
G4. UI wielojęzyczne PL/EN (i18n), przełącznik języka, zapamiętanie wyboru.
G5. Backend błędy: zwracanie kodów error_code (bez stałych tekstów).

### Kryteria akceptacji
AC-G0: Wszystkie endpointy krytyczne (slots/users/companies/docks/templates/day-capacity) odrzucają niepoprawne dane regułami backendu.
AC-G1: Client nie widzi danych spoza swojego warehouse.
AC-G3: W tabelach UI nie ma “ID” jako głównej informacji (sloty, rezerwacje, użytkownicy, firmy, docki).
AC-G4: Zmiana języka przełącza UI PL/EN i utrzymuje wybór po odświeżeniu (localStorage).
AC-G5: Błędy API zwracają {"error_code": "..."} i UI mapuje je na komunikaty PL/EN.

---

## MODUŁ 1 — Role i uprawnienia

### Wymagania
R1. Role: superadmin | admin | client.
R2. superadmin (globalny):
- tworzy/edytuje/aktywuje/dezaktywuje Warehouses,
- może tworzyć adminów przypisanych do konkretnego warehouse.
R3. admin (magazynowy):
- przypisany do jednego warehouse,
- zarządza dockami, firmami, użytkownikami klientów, slotami, generatorami, awizacjami i przypisywaniem docków.
R4. client:
- przypisany do Company w ramach warehouse,
- widzi i działa tylko w obrębie swojego warehouse.

### Kryteria akceptacji
AC-R1: /api/me zwraca role i kontekst (warehouse zawsze).
AC-R2: superadmin może utworzyć warehouse i admina; admin widzi tylko własny warehouse.
AC-R4: client nie ma dostępu do endpointów admin (403).

---

## MODUŁ 2 — Model danych (DB)

### Wymagania
D1. Warehouse: id, name, alias(unique), location, is_active, logo_path.
D2. Company: id, warehouse_id, name, alias(unique per warehouse), is_active.
D3. User: id, username(unique), password_hash, alias, role, warehouse_id(nullable), company_id(nullable).
- superadmin: warehouse_id=NULL, company_id=NULL
- admin: warehouse_id!=NULL, company_id=NULL
- client: company_id!=NULL, warehouse_id=NULL
D4. Dock: id, warehouse_id, name, alias(unique per warehouse), is_active.
D5. Slot: id, warehouse_id, dock_id(nullable), start_dt, end_dt, slot_type(INBOUND|OUTBOUND|ANY), original_slot_type, status(KANON), reserved_by_user_id(nullable).
D6. SlotNotice (1:1): wymagane pola awizacji (patrz moduł 6).
D7. DayCapacity: UNIQUE(warehouse_id, date, slot_type), capacity >=0.
D8. SlotTemplate: per warehouse (dla generatora).

### Kryteria akceptacji
AC-D2: Nie da się utworzyć Company bez warehouse_id; alias unikalny per warehouse.
AC-D3: Nie da się utworzyć client bez company_id; admin bez warehouse_id.
AC-D7: W danym dniu i typie istnieje max 1 wpis DayCapacity.

---

## MODUŁ 3 — Kontekst magazynu i filtrowanie

### Wymagania
C1. Funkcja prawdy:
- superadmin: brak ograniczeń (może operować na różnych warehouse przez parametry/ścieżki tam gdzie dozwolone)
- admin: warehouse_id=user.warehouse_id
- client: warehouse_id=user.company.warehouse_id
C2. Wszystkie listy i operacje ograniczone kontekstem warehouse.

### Kryteria akceptacji
AC-C2: client widzi tylko companies/docks/slots z własnego warehouse.
AC-C2b: admin nie widzi firm i userów z innych warehouse.

---

## MODUŁ 4 — Auth + /me

### Wymagania
A1. POST /api/login {username,password} -> {access_token, role}
A2. GET /api/me ->
{
 id, username, alias, role,
 company: {id,name,alias} | null,
 warehouse: {id,name,alias,logo_path}  // zawsze obecne nawet dla client
}
A3. JWT auth / Bearer token.

### Kryteria akceptacji
AC-A2: client dostaje warehouse w /api/me (wyliczone przez company).
AC-A3: wywołania bez tokena zwracają 401.

---

## MODUŁ 5 — Warehouses (zarządzanie)

### Wymagania
W1. superadmin może:
- POST /api/warehouses {name, alias, location, is_active}
- PATCH /api/warehouses/{id} {fields}
- GET /api/warehouses (lista)
W2. admin/client:
- GET /api/warehouses -> tylko swój warehouse (lub pomijamy i opieramy się na /me)

### Kryteria akceptacji
AC-W1: superadmin tworzy warehouse i od razu jest dostępny w UI listach (superadmin).
AC-W2: admin nie widzi listy wszystkich warehouse (tylko swój).

---

## MODUŁ 6 — Loga (static + upload)

### Wymagania
L1. Static:
- GET /static/app_logo.png (logo globalne, ekran logowania)
- GET /static/warehouses/{warehouse_id}.png (logo magazynu)
L2. Upload:
- POST /api/warehouses/{id}/logo (superadmin/admin z prawem do tego warehouse) multipart
L3. /api/me dostarcza warehouse.logo_path.

### Kryteria akceptacji
AC-L1: Na loginie widoczne logo globalne.
AC-L3: Po loginie UI pokazuje logo magazynu z warehouse.logo_path.

---

## MODUŁ 7 — i18n UI PL/EN

### Wymagania
I1. Wszystkie teksty UI idą przez słownik i18n (klucze).
I2. Przełącznik PL/EN w UI.
I3. Zapamiętanie wyboru w localStorage.
I4. Statusy i błędy tłumaczone (mapa status->PL/EN, error_code->PL/EN).

### Kryteria akceptacji
AC-I1: Brak “na sztywno” wpisanych tekstów w UI (poza kluczami i słownikiem).
AC-I3: Odświeżenie strony nie resetuje języka.
AC-I4: Ten sam error_code ma tekst PL i EN.

---

## MODUŁ 8 — Companies (Firmy)

### Wymagania
CO1. admin:
- GET /api/companies (tylko własny warehouse)
- POST /api/companies {name, alias?, is_active?}
CO2. alias opcjonalny:
- jeśli brak, backend auto-generuje (brak 422).
CO3. Dla clientów:
- company.is_active=false -> user nie może rezerwować / widzieć danych (403 lub filtr).

### Kryteria akceptacji
AC-CO2: POST bez alias działa (alias auto).
AC-CO1: GET zwraca listę firm z aliasami.
AC-CO3: Dezaktywowana firma blokuje działania clientów.

---

## MODUŁ 9 — Users (tworzenie + lista)

### Wymagania
U1. admin:
- GET /api/users (users w warehouse)
- POST /api/users:
  - tworzenie client: {username,password,alias,role:"client",company_id}
  - tworzenie admin: {username,password,alias,role:"admin"} (warehouse z kontekstu)
U2. superadmin:
- może tworzyć admin dla warehouse: { ..., role:"admin", warehouse_id }
U3. Response UserOut stabilny:
- id, username, alias, role
- warehouse_id: int|null
- company_id: int|null
- company_alias: str|null
- warehouse_alias: str|null

### Kryteria akceptacji
AC-U3: GET /api/users nigdy nie wywala ResponseValidationError (warehouse_id optional).
AC-U1: UI tworzy clienta wybierając firmę (dropdown).
AC-U3b: UI w tabeli userów pokazuje company_alias zamiast company_id.

---

## MODUŁ 10 — Docki

### Wymagania
DCK1. admin:
- POST /api/docks {name, alias, is_active}
- PATCH /api/docks/{id} {fields}
- GET /api/docks (wszystkie)
DCK2. client:
- GET /api/docks (tylko is_active=true)
DCK3. docki przypisane do warehouse (wspólna pula).

### Kryteria akceptacji
AC-DCK2: client nie widzi nieaktywnych doków.
AC-DCK1: admin może dezaktywować dock i znika on klientowi.

---

## MODUŁ 11 — Sloty (workflow)

### Wymagania
S1. Statusy kanoniczne:
- AVAILABLE, BOOKED, APPROVED_WAITING_DETAILS, RESERVED_CONFIRMED, COMPLETED(optional), CANCELLED
S2. GET /api/slots?date_from&date_to (filtrowanie per warehouse kontekst)
S3. client reserve:
- POST /api/slots/{id}/reserve {requested_type?}
- slot_type=ANY -> required requested_type (INBOUND/OUTBOUND)
- walidacja zgodności typu
S4. admin approve:
- POST /api/slots/{id}/approve -> APPROVED_WAITING_DETAILS
S5. notice:
- GET/POST /api/slots/{id}/notice
- POST waliduje wymagane pola, zmienia status na RESERVED_CONFIRMED
S6. assign dock:
- POST /api/slots/{id}/assign-dock {dock_id}
- walidacja konfliktu czasowego
S7. cancel:
- POST /api/slots/{id}/cancel {reason?} -> CANCELLED
S8. SlotOut musi zawierać aliasy:
- dock_alias
- reserved_by_alias
- reserved_by_company_alias

### Kryteria akceptacji
AC-S2: admin widzi sloty tylko ze swojego warehouse; client tak samo.
AC-S3: dla ANY bez requested_type -> 400 error_code=TYPE_REQUIRED.
AC-S4: approve zmienia status z BOOKED na APPROVED_WAITING_DETAILS.
AC-S5: niekompletna awizacja -> 400 z field + error_code, kompletna -> RESERVED_CONFIRMED.
AC-S6: konflikt docka -> 409 error_code=DOCK_CONFLICT.
AC-S8: UI pokazuje aliasy (dock_alias i reserved_by_alias) zamiast ID.

---

## MODUŁ 12 — Awizacja (SlotNotice)

### Wymagania
N1. Pola wymagane:
- numer_zlecenia, referencja, rejestracja_auta, rejestracja_naczepy, ilosc_palet
N2. Pola opcjonalne:
- kierowca_imie_nazwisko, kierowca_tel, uwagi
N3. Dostęp:
- client może edytować tylko swoje rezerwacje i tylko w APPROVED_WAITING_DETAILS
- admin może podglądać

### Kryteria akceptacji
AC-N1: brak wymaganego pola -> błąd per pole (field) + error_code.
AC-N3: client nie może edytować notice dla slota, którego nie zarezerwował.

---

## MODUŁ 13 — DayCapacity + Generator

### Wymagania
CAP1. DayCapacity per typ per dzień:
- POST /api/day-capacity {date, slot_type, capacity} (upsert)
- GET /api/day-capacity?date_from&date_to
CAP2. Generator slotów:
- POST /api/slots/generate {template_id, date_from, date_to, parallel_slots}
- Generator NIE przekracza capacity:
  - jeśli template wygenerowałby więcej -> PRZYCINA i raportuje
CAP3. Brak wpisu capacity -> brak limitu (∞)

### Kryteria akceptacji
AC-CAP2: generator zwraca {generated_count, skipped_due_to_capacity, days:[...]}.
AC-CAP2b: dla capacity=12 i requested=20 -> generated=12, skipped=8, bez błędu 4xx/5xx.

---

## MODUŁ 14 — Admin Calendar (miesiąc/tydzień)

### Wymagania
CAL1. Widok kalendarza month/week w UI (admin).
CAL2. Klik w dzień pokazuje listę slotów.
CAL3. Dane pobierane po zakresie:
- GET /api/slots?date_from&date_to
CAL4 (opcjonalnie, recommended): endpoint agregacyjny:
- GET /api/calendar/summary?date_from&date_to
  -> counts per day/status/type

### Kryteria akceptacji
AC-CAL3: UI pobiera zakres tygodnia/miesiąca jednym requestem.
AC-CAL2: klik w dzień pokazuje poprawne sloty tylko z tego dnia.
AC-CAL4: jeśli summary istnieje, UI nie musi liczyć wszystkiego po stronie JS.

---

## MODUŁ 15 — UI aliasy i “no raw IDs”

### Wymagania
UX1. W tabelach: sloty, users, companies, docks -> alias/name zamiast ID.
UX2. slot list: reserved_by_company_alias i reserved_by_alias.
UX3. users table: company_alias i warehouse_alias.

### Kryteria akceptacji
AC-UX1: nie ma “company_id=3” w UI; jest “DEMO”.
AC-UX2: sloty pokazują “Klient: DEMO / Jan Kowalski” zamiast ID.
