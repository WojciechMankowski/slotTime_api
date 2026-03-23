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
  - [x] UI: klient widzi "Poproś o anulowanie" zamiast bezpośredniego anulowania
  - [x] Admin widzi sloty `CANCEL_PENDING` z akcją zatwierdzenia/odrzucenia w tabeli

- [x] **D3. Filtr archiwum w widoku admina**
  - [x] Dodać opcję "Pokaż zakończone/anulowane" w `FilertSlotAdmin.tsx`
  - [x] Domyślnie ukrywać `COMPLETED` i `CANCELLED`

---

## Blok E — Kalendarz admina

- [x] **E1. Backend — endpoint agregacyjny** *(done 20.03.2026)*
  - [x] `GET /api/calendar/summary?date_from&date_to`
  - [x] Zwraca: `{ date, total, available, booked, completed, cancelled }[]`

- [x] **E2. Frontend** *(done 20.03.2026)*
  - [x] Nowa strona `AdminCalendar.tsx`
  - [x] Widok miesięczny: siatka dni z kolorem/licznikiem per dzień
  - [x] Widok tygodniowy: kolumny dni, wiersze godzin, sloty jako bloki
  - [x] Klik w dzień → przekierowuje do `/slots?date=YYYY-MM-DD`
  - [x] Route `/calendar` w `App.tsx` (admin/superadmin)
  - [x] Pozycja w Menu
  - [x] Klucze i18n: `calendar`, `week_view`, `month_view`, `no_slots_this_day`

---
