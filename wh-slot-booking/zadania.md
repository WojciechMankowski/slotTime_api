# Wszystkie zadania - WH Slot Booking

---

### SHOULD - do zrobienia
- [x] Admin Calendar month/week (range fetch)
- *[ ] Optional: /api/calendar/summary (endpoint agregacyjny)*
- [ ] Cancel workflow z CANCEL_PENDING + approve/reject
- [ ] COMPLETED status + filtrowanie archiwum

### LATER - przyszłość
- [ ] Raporty / eksporty
- [ ] Granularne role
- [ ] Migracje DB (Alembic)

---

## 2. QA Checklist (qa_checklist.md)

### Global
- [x] AC-G4: język PL/EN przełącza UI i pamięta wybór
- [ ] AC-G5: API zwraca error_code i UI mapuje na tekst

### Auth / Context
- [ ] AC-A2: /api/me zwraca warehouse zawsze (również dla klient)
- [ ] AC-C2: klient nie widzi zasobów spoza swojego warehouse

### Companies
- [ ] AC-CO2: POST /api/companies bez alias działa (alias auto)
- [ ] AC-CO1: GET /api/companies zwraca aliasy

### Users
- [ ] AC-U3: GET /api/users nie wali walidacją, warehouse_id może być null
- [ ] AC-U3b: UI pokazuje company_alias zamiast company_id

### Docks
- [ ] AC-DCK2: klient widzi tylko aktywne docki

### Slots flow
- [ ] AC-S3: ANY bez requested_type -> TYPE_REQUIRED
- [ ] AC-S4: approve -> APPROVED_WAITING_DETAILS
- [ ] AC-S5: notice waliduje pola i finalizuje RESERVED_CONFIRMED
- [ ] AC-S6: assign dock wykrywa konflikt DOCK_CONFLICT
- [ ] AC-S8: w slotach widoczne aliasy (dock_alias, reserved_by_alias)

---

## 3. Następne kroki (update 2026-02-05)

- [ ] Zaimplementować finalny UI GenerateSlots.tsx (1:1 jak stare narzędzie)
- [ ] Podpiąć routing `/generate`
- [ ] Wrócić do Templates.tsx

---

## 4. Placeholdery / TODO w kodzie

### GenerateSlots.tsx
- [ ] Podpiąć DayCapacity do prawej kolumny (placeholder: "tu w kolejnym kroku podepniemy DayCapacity")

### templates.tsx
- [ ] Wkleić istniejący formularz szablonów (TemplatesForm - placeholder)
- [ ] Wkleić istniejący formularz + tabelę limitów (LimitsForm - placeholder)
- [ ] Naprawić błąd składni (brakujący przecinek w `gridTemplateColumns`)

### templates.tsx - routing
- [ ] Dodać Templates.tsx do routingu w App.tsx (brak route'a w obecnej konfiguracji)

---

## 5. Rozszerzenia wymienione w README

- [ ] Calendar (widok kalendarza)
- [ ] Cancel workflow (CANCEL_PENDING)
- [ ] Raporty

---

## 6. Wymagania z master_prompt jeszcze niezaimplementowane w UI

### Moduł 14 - Admin Calendar
- [ ] CAL1: widok kalendarza month/week w UI (admin)
- [ ] CAL2: klik w dzień pokazuje listę slotów
- [ ] CAL4: endpoint agregacyjny /api/calendar/summary (opcjonalny)

### Moduł 11 - brakujące akcje w UI Slots.tsx
- [ ] Przycisk "Rezerwuj" dla klienta
- [ ] Przycisk "Zatwierdź" (approve) dla admina
- [ ] Formularz awizacji (notice) dla klienta
- [ ] Przycisk "Przypisz dock" dla admina
- [ ] Przycisk "Anuluj" (cancel) dla obu ról
- [ ] Obsługa slotów typu ANY (wybór INBOUND/OUTBOUND przy rezerwacji)

### Moduł 5 - Warehouses UI
- [ ] Ekran zarządzania magazynami dla superadmina (CRUD w UI)

---

## 7. Dług techniczny

- [ ] Brak Alembic - migracje DB (obecnie `create_all` w seed.py)
- [ ] JWT_SECRET_KEY hardcoded jako "change_me_please" w .env
- [ ] Brak testów (unit / integration)
- [ ] templates.tsx ma błąd składni (nie skompiluje się)
- [ ] Brak obsługi błędów sieci / timeout w API calls na frontendzie