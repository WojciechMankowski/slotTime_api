# TODO — Faza 3: Status systemu i plan dalszego rozwoju

> Dokument opisuje stan wdrożenia na dzień **20.03.2026** oraz planowane prace.

---

## ✅ Wdrożone — Faza 1 + 2

### Autoryzacja i kontekst
- [x] POST `/api/login` + JWT token
- [x] GET `/api/me` z pełnym kontekstem (rola, warehouse, company)
- [x] Kontekst magazynu wyznaczany z roli (bez nagłówków)
- [x] Blokada logowania gdy firma klienta jest nieaktywna

### Model danych
- [x] Wszystkie tabele: Warehouse, Company, User, Dock, Slot, SlotNotice, DayCapacity, SlotTemplate
- [x] Kolumna `previous_status` w Slot (dla workflow CANCEL_PENDING)
- [x] Enum `SlotStatus` z pełnym zestawem: AVAILABLE, BOOKED, APPROVED_WAITING_DETAILS, RESERVED_CONFIRMED, COMPLETED, CANCELLED, CANCEL_PENDING

### Firmy (Companies)
- [x] GET / POST / PATCH (admin)
- [x] Auto-generowanie alias jeśli nie podano
- [x] Dezaktywacja firmy blokuje klientów (403)
- [x] UI: tabela z edycją inline

### Użytkownicy (Users)
- [x] GET / POST / PATCH (admin/superadmin)
- [x] Walidacja unikalności username przy PATCH
- [x] Zmiana roli z guardem (admin nie może nadać superadmin)
- [x] Selektor firmy przy tworzeniu/edycji klienta (pobierany z API)
- [x] Response z `company_alias` i `warehouse_alias`

### Docki (Docks)
- [x] GET / POST / PATCH (admin)
- [x] Klient widzi tylko aktywne doki
- [x] Unique alias per warehouse



### Sloty — backend
- [x] GET `/api/slots?date_from&date_to`
- [x] POST `/api/slots/generate` (generator z szablonami i DayCapacity)
- [x] POST `/api/slots/{id}/reserve` (klient)
- [x] POST `/api/slots/{id}/approve` (admin)
- [x] POST `/api/slots/{id}/assign-dock` (admin, z walidacją konfliktu)
- [x] POST `/api/slots/{id}/cancel` (admin)
- [x] POST `/api/slots/{id}/request-cancel` (klient → CANCEL_PENDING)
- [x] POST `/api/slots/{id}/reject-cancel` (admin → przywrócenie statusu)
- [x] PATCH `/api/slots/{id}/status` (admin, z guardem na CANCEL_PENDING)
- [x] GET `/api/slots/archive?status&date_from&date_to`

### Sloty — workflow UI
- [x] Widok admina: tabela z edycją statusu/doku inline
- [x] Widok admina: wyróżnione wiersze CANCEL_PENDING (pomarańczowe tło + przyciski)
- [x] Widok admina: domyślnie ukryte COMPLETED i CANCELLED
- [x] Widok klienta: lista wolnych slotów + rezerwacja
- [x] Widok klienta: moje rezerwacje z grupowaniem po dniach
- [x] Widok klienta: "Poproś o anulowanie" (zamiast bezpośredniego anulowania)
- [x] Awizacje: formularz klienta (SlotNotice) + widok admina

### Archiwum
- [x] Strona `/admin/archive` z tabelą zakończonych/anulowanych slotów
- [x] Filtry: zakres dat + status (COMPLETED / CANCELLED / Wszystkie)
- [x] Link z `/slots` do archiwum

### Kalendarz admina
- [x] GET `/api/calendar/summary?date_from&date_to`
- [x] Strona `/calendar`: widok miesięczny (siatka z kropkami + pasek postępu)
- [x] Widok tygodniowy: siatka godzinowa 06:00–22:00 z blokami slotów
- [x] Nawigacja prev/next miesiąc i tydzień
- [x] Klik w dzień → przekierowanie do `/slots?date=YYYY-MM-DD` z auto-ładowaniem
- [x] Legenda kolorów obłożenia

### i18n
- [x] Słowniki PL/EN w `i18n.ts`
- [x] Przełącznik języka w headerze, zapamiętanie w localStorage
- [x] Kody błędów API tłumaczone na PL/EN
- [x] Pełne pokrycie kluczy (brak hardkodowanych tekstów w UI)

### UX / Menu
- [x] Sidebar menu z blokadą scrolla strony gdy otwarty
- [x] Archiwum w sekcji Slotów
- [x] Kalendarz w sekcji Slotów
- [x] Strona `/slots` odczytuje `?date=` z URL

---

## ❌ Nie wdrożone — planowane w Fazie 3

### B — Usuwanie (DELETE) — tylko superadmin

- [x] **B1. DELETE `/api/companies/{id}`** (superadmin)
  - Guard: nie usuwać jeśli są powiązani użytkownicy lub sloty
  - UI: przycisk w `AdminCompaniesTable` z modalem potwierdzenia

- [x] **B2. DELETE `/api/users/{id}`** (superadmin)
  - Guard: nie usuwać siebie (własnego konta)
  - UI: przycisk w `AdminUsersTable` z modalem potwierdzenia

- [x] **B3. DELETE `/api/docks/{id}`** (superadmin)
  - Guard: nie usuwać jeśli dok ma przypisane aktywne sloty
  - UI: przycisk w `AdminDocksTable` z modalem potwierdzenia

- [x] **B4. DELETE `/api/slots/{id}`** (superadmin)
  - Tylko dla slotów AVAILABLE
  - UI: przycisk w tabeli admin

- [x] **Wspólny komponent `ConfirmDeleteModal`** (reużywalny dla B1–B4)

### C — Zarządzanie magazynami (superadmin)

- [ ] **C1. `serviceWarehouse.ts`** — wrappery API dla warehouse CRUD
- [ ] **C2. Strona `AdminWarehouses.tsx`** (superadmin)
  - Lista magazynów z is_active toggle
  - Tworzenie nowego magazynu (POST `/api/warehouses`)
  - Edycja (PATCH `/api/warehouses/{id}`)
  - Upload logo (POST `/api/warehouses/{id}/logo`)
- [ ] **C3. Route `/admin/warehouses`** + pozycja w Menu (tylko superadmin)

### F — Raporty i eksport

- [ ] **F1. Eksport archiwum do CSV/Excel**
  - Przycisk "Pobierz CSV" na stronie `/admin/archive`
  - Backend: endpoint `GET /api/slots/archive/export?format=csv`

- [ ] **F2. Raport dzienny / tygodniowy**
  - Podsumowanie: liczba slotów, zajętość %, lista firm

### G — Granularne role i uprawnienia

- [ ] **G1. Prawo admina do usuwania** (osobna flaga zamiast tylko superadmin)
- [ ] **G2. Tryb tylko do odczytu** dla wybranych adminów

### H — Migracje DB

- [ ] **H1. Aktywacja Alembic** zamiast drop+recreate w `seed.py`
  - Generowanie migracji przy zmianie `models.py`
  - Bezpieczne wdrożenie na produkcji bez utraty danych

### I — Powiadomienia

- [ ] **I1. E-mail przy zmianie statusu slotu** (opcjonalne, SMTP)
  - Klient: potwierdzenie rezerwacji, zatwierdzenia, odrzucenia anulowania
  - Admin: nowe CANCEL_PENDING

### J — Jakość i bezpieczeństwo

- [ ] **J1. Testy integracyjne backendu** (pytest + TestClient)
  - Pokrycie: auth, slot workflow, company/user CRUD
- [ ] **J2. Rate limiting** na `/api/login`
- [ ] **J3. Refresh token** (obecny JWT wygasa, brak odświeżania)

---

## Priorytety na Fazę 3

| Priorytet | Blok | Opis |
|-----------|------|------|
| ✅ Gotowe | B | Usuwanie — brakujące CRUD dla superadmin |
| 🔴 Wysoki | C | Zarządzanie magazynami w UI |
| 🟡 Średni | H | Alembic — bezpieczne migracje |
| 🟡 Średni | F | Eksport CSV archiwum |
| 🟢 Niski | I | Powiadomienia e-mail |
| 🟢 Niski | J | Testy i bezpieczeństwo |
