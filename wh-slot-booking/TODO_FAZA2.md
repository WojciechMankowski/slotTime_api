# TODO — Faza 2: CRUD (usuwanie) + Workflow slotów

---

## Blok A — Naprawa błędów (przed wszystkim)

- [x] **A1. Duplikat `patch_dock` w `docks.py`** _(done 20.03.2026)_
  - Usunąć drugą, identyczną funkcję (linie ~58–81)

- [x] **A2. Schema `UserPatch` nie aktualizuje `username` i `role`** _(done 20.03.2026)_
  - Dodać pola `username: str | None` i `role: Role | None` do schematu
  - Router `PATCH /api/users/{id}` musi je zastosować

---

# Blok D — Workflow slotów — uzupełnienia

- [x] **D1. Status COMPLETED** *(done 20.03.2026)*
  - [x] Admin ustawia `COMPLETED` przez `PATCH /api/slots/{id}/status`
  - [x] Archiwum: `GET /api/slots/archive?status=COMPLETED|CANCELLED|ALL&date_from&date_to`

- [x] **D2. Cancel workflow — CANCEL_PENDING** *(done 20.03.2026)*
  - [x] Nowy status `CANCEL_PENDING` w `SlotStatus` enum (backend `models.py`)
  - [x] Kolumna `previous_status` w modelu `Slot` (przechowuje status przed CANCEL_PENDING)
  - [x] `POST /api/slots/{id}/request-cancel` → status `CANCEL_PENDING` (klient)
  - [x] `POST /api/slots/{id}/reject-cancel` → przywrócenie poprzedniego statusu (admin)
  - [x] `POST /api/slots/{id}/cancel` zatwierdza anulowanie (admin, czyści previous_status)
  - [x] Guard w `PATCH /status` — blokuje ustawienie `CANCEL_PENDING` przez ten endpoint
  - [x] Klucze i18n: `cancel_pending`, `request_cancel`, `reject_cancel`, `cancel_pending_desc`, `approve_cancel`
  - [ ] UI: klient widzi "Poproś o anulowanie" zamiast bezpośredniego anulowania
  - [ ] Admin widzi sloty `CANCEL_PENDING` z akcją zatwierdzenia/odrzucenia w tabeli

- [ ] **D3. Filtr archiwum w widoku admina**
  - [ ] Dodać opcję "Pokaż zakończone/anulowane" w `FilertSlotAdmin.tsx`
  - [ ] Domyślnie ukrywać `COMPLETED` i `CANCELLED`

---

## Blok E — Kalendarz admina

- [ ] **E1. Backend — endpoint agregacyjny**
  - [ ] `GET /api/calendar/summary?date_from&date_to`
  - [ ] Zwraca: `{ date, total, available, booked, completed }[]`

- [ ] **E2. Frontend**
  - [ ] Nowa strona `AdminCalendar.tsx`
  - [ ] Widok miesięczny: siatka dni z kolorem/licznikiem per dzień
  - [ ] Widok tygodniowy: kolumny dni, wiersze godzin, sloty jako bloki
  - [ ] Klik w dzień → filtruje `AdminSlotTable` do wybranego dnia
  - [ ] Route `/calendar` w `App.tsx` (admin/superadmin)
  - [ ] Pozycja w Menu
  - [ ] Klucze i18n: `calendar`, `week_view`, `month_view`, `no_slots_this_day`

---
