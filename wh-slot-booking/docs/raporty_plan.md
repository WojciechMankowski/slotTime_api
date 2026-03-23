# Plan: Raporty wykorzystania slotów

Data: 2026-03-23
Zakres: backend (FastAPI) + frontend (React + TypeScript)
Dostęp: superadmin + admin (tylko własny magazyn)

---

## Cel

Strona raportów umożliwiająca analizę wykorzystania slotów w wybranym okresie: ile slotów było dostępnych, zarezerwowanych, zakończonych, anulowanych — z rozbiciem na dni, firmy i typy (INBOUND/OUTBOUND/ANY).

---

## 1. Backend — endpointy raportów

### 1.1 Raport dzienny `GET /api/reports/daily`

Query params: `date_from`, `date_to`
Zwraca tablicę wierszy, jeden na dzień:

```json
[
  {
    "date": "2026-03-01",
    "total": 40,
    "available": 5,
    "booked": 8,
    "approved_waiting_details": 2,
    "reserved_confirmed": 10,
    "completed": 12,
    "cancelled": 3,
    "inbound": 22,
    "outbound": 14,
    "any": 4,
    "utilization_pct": 87.5
  }
]
```

`utilization_pct` = `(total - available) / total * 100`

### 1.2 Raport per firma `GET /api/reports/by-company`

Query params: `date_from`, `date_to`
Zwraca tablicę firm z liczbą slotów i statusami:

```json
[
  {
    "company_id": 1,
    "company_name": "Firma ABC",
    "company_alias": "ABC",
    "total_reservations": 25,
    "completed": 18,
    "cancelled": 4,
    "active": 3,
    "inbound": 15,
    "outbound": 10
  }
]
```

### 1.3 Raport ogólny (summary) `GET /api/reports/summary`

Query params: `date_from`, `date_to`
Zwraca jeden obiekt z agregacją całego okresu — do wyświetlenia jako KPI cards na górze strony.

### Implementacja backendu

- Nowy router: `app/routers/reports.py`
- Rejestracja w `main.py`: `app.include_router(reports.router)`
- Zapytania SQL przez SQLAlchemy, grupowanie po `func.date(Slot.start_dt)`
- Uprawnienia: `require_role(admin)` — superadmin ma dostęp automatycznie, admin widzi tylko swój magazyn przez `get_context_warehouse`

---

## 2. Frontend — strona raportów

### 2.1 Nowa strona `src/pages/AdminReports.tsx`

Struktura strony (od góry):

1. **Nagłówek** — tytuł + opis
2. **Filtry** — date_from, date_to, przycisk "Generuj raport"
3. **KPI cards** — 4 kafelki: Wszystkie sloty / Wykorzystanie % / Zakończone / Anulowane
4. **Wykres dzienny** — komponent `ReportDailyChart` (słupki lub linia)
5. **Tabela dzienna** — komponent `ReportDailyTable`
6. **Tabela per firma** — komponent `ReportByCompanyTable`
7. **Przycisk eksportu CSV**

### 2.2 Hook `src/hooks/useReports.ts`

Odpowiada za:
- stan `filters` (dateFrom, dateTo)
- pobieranie `/api/reports/daily`, `/api/reports/by-company`, `/api/reports/summary`
- stan `loading`, `error`
- funkcja `generate()` wywołująca wszystkie trzy endpointy równolegle (`Promise.all`)

### 2.3 Komponenty

#### `src/components/reports/ReportKpiCards.tsx`
Cztery karty z liczbami (Wszystkie, Wykorzystanie %, Zakończone, Anulowane).
Props: `summary` (wynik z `/api/reports/summary`), `lang`.

#### `src/components/reports/ReportDailyChart.tsx`
Prosty wykres słupkowy bez zewnętrznej biblioteki (SVG) lub z `recharts` jeśli jest zainstalowany.
Pokazuje `completed` vs `cancelled` vs `available` per dzień.
Props: `rows`, `lang`.

#### `src/components/reports/ReportDailyTable.tsx`
Tabela z kolumnami: Data / Wszystkie / Dostępne / Zarezerwowane / Zakończone / Anulowane / Wykorzystanie %.
Wiersze sortowane po dacie rosnąco.
Props: `rows`, `lang`.

#### `src/components/reports/ReportByCompanyTable.tsx`
Tabela z kolumnami: Firma / Rezerwacje / Zakończone / Anulowane / Aktywne / INBOUND / OUTBOUND.
Sortowanie po liczbie rezerwacji malejąco.
Props: `rows`, `lang`.

### 2.4 Eksport CSV

Funkcja `exportToCsv(rows, filename)` w `src/Helper/helper.ts`.
Generuje plik CSV z danych raportu dziennego i pobiera go przez `<a download>`.
Przycisk eksportu widoczny po wygenerowaniu raportu.

---

## 3. Routing i nawigacja

- Nowa trasa w `App.tsx`: `path="/admin/reports"` — dostępna dla `admin` i `superadmin`
- Link w `Menu.tsx` w sekcji administracji: "Raporty" (`t("reports", lang)`)
- Nowy klucz i18n: `reports`, `reports_desc`, `generate_report`, `utilization`, `kpi_total`, `kpi_utilization`, `kpi_completed`, `kpi_cancelled`, `export_csv`

---

## 4. i18n

Nowe klucze do dodania w `src/Helper/i18n.ts`:

```
reports              → "Raporty" / "Reports"
reports_desc         → "Analiza wykorzystania slotów" / "Slot utilization analysis"
generate_report      → "Generuj raport" / "Generate report"
utilization          → "Wykorzystanie" / "Utilization"
kpi_total            → "Wszystkie sloty" / "Total slots"
kpi_utilization      → "Wykorzystanie" / "Utilization"
kpi_completed        → "Zakończone" / "Completed"
kpi_cancelled        → "Anulowane" / "Cancelled"
export_csv           → "Eksportuj CSV" / "Export CSV"
no_report_data       → "Brak danych — wybierz zakres i kliknij Generuj" / "No data — select range and click Generate"
by_company           → "Według firm" / "By company"
daily_breakdown      → "Rozkład dzienny" / "Daily breakdown"
reservations         → "Rezerwacje" / "Reservations"
```

---

## 5. Kolejność implementacji

1. Backend: `reports.py` — endpoint `summary` + `daily` + `by-company`
2. Rejestracja routera w `main.py`
3. i18n — nowe klucze
4. Hook `useReports.ts`
5. Komponenty: `ReportKpiCards` → `ReportDailyTable` → `ReportByCompanyTable` → `ReportDailyChart`
6. Strona `AdminReports.tsx` składająca wszystko w całość
7. Routing (`App.tsx`) + link w menu (`Menu.tsx`)
8. Eksport CSV (`helper.ts` + przycisk w `AdminReports.tsx`)

---

## 6. Uwagi techniczne

- Zapytania do backendu są wywoływane **równolegle** (`Promise.all`) — jeden klik generuje wszystkie trzy raporty jednocześnie
- Raport nie ładuje się automatycznie — użytkownik klika "Generuj raport" (dane mogą być duże)
- Wykres oparty na SVG (bez dodatkowych zależności) lub `recharts` jeśli pakiet jest już w `package.json`
- Eksport CSV generowany po stronie klienta — bez dodatkowego endpointu
- Daty przekazywane do backendu w formacie `YYYY-MM-DD`
