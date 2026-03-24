# TODO

---

## Etap 1: Fundamenty backendowe i CRUD

**Cel:** solidna baza API, bez której frontend nie ruszy dalej.

**Definicja wykonania:** Wszystkie endpointy CRUD dla firm, użytkowników i doków działają, frontend umożliwia edycję każdego z tych zasobów, a zmiana hasła działa end-to-end.

**Kryteria akceptacji etapu:**

- Admin może edytować firmę, użytkownika i dok z poziomu UI
- Użytkownik może zmienić własne hasło
- API zwraca poprawne kody HTTP (200, 400, 404, 422) dla każdego scenariusza
- Żadne pole nie jest nadpisywane pustą wartością przy częściowej aktualizacji (PATCH)

### Backend

- [x] **Endpoint aktualizacji danych firm, użytkowników, doków** (done 17.03.2026)
  - PATCH `/api/companies/{id}` aktualizuje tylko przesłane pola
  - PATCH `/api/users/{id}` aktualizuje tylko przesłane pola
  - PATCH `/api/docks/{id}` aktualizuje tylko przesłane pola
  - Walidacja danych wejściowych (np. unikalność nazwy firmy, poprawność email)
  - Przy braku uprawnień zwraca 403
  - Przy nieistniejącym zasobie zwraca 404

- [x] ** POST /api/companies bez alias działa (alias auto)** (done 19.03.2026)
  - POST `/api/companies` z body bez pola `alias` zwraca 201 i wygenerowany alias
  - Alias jest tworzony jako slug z nazwy firmy (lowercase, bez spacji/znaków specjalnych)
  - Jeśli alias już istnieje, dodawany jest numeryczny sufiks (np. `firma-1`)
  - POST z jawnie podanym aliasem nadal działa bez zmian

- [x] **GET /api/companies zwraca aliasy** (done 19.03.2026)
  - GET `/api/companies` zwraca listę firm, każda z polem `alias`
  - GET `/api/companies/{id}` również zwraca `alias`
  - Alias jest widoczny w dokumentacji Swagger

- [x] Endpointy związane z awizacją (done 18.03.2026)
- [x] zmiany statusóww (done 18.03.2026)

- [x] **Blokada lokowania dla użytkownika nie zalogowanego** *(done 20.03.2026)*
      **Cel** weryfikuje tylko username + hasło. Klient z nieaktywną firmą
      dostaje token i dopiero później wpada na błędy 403 przy operacjach.
      - [x] Klient z `company.is_active=false` nie otrzymuje tokena JWT
      - [x] Zwracany jest `403 {"error_code": "COMPANY_INACTIVE"}`
      - [x] Klient z `company.is_active=true` loguje się bez zmian
      - [x] Klient bez `company_id` (brak firmy) dostaje `403`
      - [x] Admin loguje się niezależnie od stanu firm
      - [x] Superadmin loguje się niezależnie od stanu firm

### Frontend

- [x] **Dodanie formularza do edycji doku** (done 17.03.2026)
  - Admin widzi przycisk "Edytuj" przy każdym doku
  - Formularz wczytuje aktualne dane doku
  - Walidacja pól po stronie frontendu (wymagane pola, format)
  - Po zapisie lista doków odświeża się z aktualnymi danymi
  - Toast/komunikat o sukcesie lub błędzie -[x] Odświeżenie danych dok, user (done 17.03.2026)

- [x] **Dodanie możliwości edycji użytkownika** *(done 20.03.2026)*
  - Admin widzi przycisk "Edytuj" przy każdym użytkowniku
  - Formularz wczytuje aktualne dane użytkownika
  - Zmiana roli działa poprawnie (dropdown z dostępnymi rolami)
  - Admin nie może nadać roli superadmin (blokada po stronie backendu)
  - Walidacja unikalności username (backend zwraca USERNAME_TAKEN)

- [x] **Dodanie możliwości edycji firmy** *done 19.03.2026*
  - Admin widzi przycisk "Edytuj" przy każdej firmie
  - Formularz wczytuje aktualne dane firmy (w tym alias)
  - Zmiana nazwy firmy nie zmienia automatycznie aliasu (alias edytowalny osobno)
  - Walidacja unikalności nazwy i aliasu
  - Toast/komunikat o sukcesie lub błędzie
- [x] **Blokada lokowania dla użytkownika nie zalogowanego** *(done 20.03.2026)*
      **Cel** weryfikuje tylko username + hasło. Klient z nieaktywną firmą
      dostaje token i dopiero później wpada na błędy 403 przy operacjach.
      - [x] Klient z nieaktywną firmą widzi komunikat "Firma nieaktywna: brak dostępu."
      - [x] Komunikat zmienia się z językiem (PL/EN)
      - [x] Formularz logowania nie blokuje się po błędzie (można spróbować ponownie)
      - [x] Klient z aktywną firmą loguje się bez zmian
---

### Awizacja panel admina

- [x] **stworzenie pod strony do sprawdzania awizacji** _(done 19.03.2026)_

---

- [x] podbięcie akcj w tabeli z slotami (done 18.03.2026)
- [x] test czy działa akcje *(done 23.03.2026)*
- [x] rozpoczęcie pracy nad panelem dla klienta na razie pokazywanie i rezerwacja slotów (done 18.03.2026)

## Etap 2: Rezerwacja i workflow slotów

**Cel:** pełna ścieżka życia slotu od wyświetlenia po zatwierdzenie.

**Definicja wykonania:** Klient może przeglądać dostępne sloty, zarezerwować slot, wypełnić awizację, a admin może zatwierdzić rezerwację i przypisać dock. Sloty przechodzą poprawnie między statusami.

**Kryteria akceptacji etapu:**

- Klient widzi tylko otwarte sloty swojego magazynu i może zarezerwować slot
- Admin widzi rezerwacje i może je zatwierdzić oraz przypisać dock
- Status slotu zmienia się zgodnie z diagramem stanów (OPEN → RESERVED → APPROVED → COMPLETED)
- Archiwum slotów ze statusem COMPLETED jest dostępne z filtrowaniem

### Backend

- [x] **COMPLETED status + filtrowanie archiwum** *(done 20.03.2026)*
  - Slot przechodzi do COMPLETED przez `PATCH /api/slots/{id}/status`
  - `GET /api/slots/archive` zwraca zakończone sloty (domyślnie COMPLETED)
  - Parametry: `?status=COMPLETED|CANCELLED|ALL`, opcjonalne `date_from` i `date_to`
  - Klient widzi tylko swoje sloty; admin/superadmin widzi wszystkie w magazynie

### Frontend

- [x] **Wyświetlanie otwartych slotów dla klientów** *(done 20.03.2026)*
  - Klient widzi tylko sloty ze statusem OPEN przypisane do jego magazynu
  - Widoczne informacje: data, godzina, typ (INBOUND/OUTBOUND/ANY), dock (jeśli przypisany)
  - Lista odświeża się po rezerwacji
  - Pusty stan ("Brak dostępnych slotów") wyświetla się poprawnie

- [x] **Przycisk "Rezerwuj" dla klienta** *(done 20.03.2026)*
  - Przycisk "Rezerwuj" widoczny przy każdym otwartym slocie
  - Po kliknięciu slot zmienia status na RESERVED i znika z listy otwartych
  - Jeśli ktoś inny zdążył zarezerwować (race condition), wyświetla komunikat o błędzie
  - Przycisk jest nieaktywny podczas wysyłania żądania (zapobieganie podwójnemu kliknięciu)

- [x] **Formularz awizacji (notice) dla klienta** *(done 23.03.2026)*
  - Formularz pojawia się po rezerwacji slotu (lub jest dostępny z widoku "Moje rezerwacje")
  - Wymagane pola: numer rejestracyjny, imię kierowcy, rodzaj towaru, ilość palet (do ustalenia)
  - Walidacja wymaganych pól przed wysłaniem
  - Dane zapisywane przez API i powiązane ze slotem

- [ ] **Obsługa slotów typu ANY (wybór INBOUND/OUTBOUND przy rezerwacji)**
  - Dla slotów typu ANY pojawia się dodatkowy select/radio z opcjami INBOUND/OUTBOUND
  - Wybrany kierunek jest zapisywany w rezerwacji
  - Dla slotów z ustalonym typem (INBOUND/OUTBOUND) dodatkowy wybór się nie pojawia

- [x] **Przycisk "Zatwierdź" (approve) dla admina** *done 23.03.2026*
  - Przycisk "Zatwierdź" widoczny przy slotach ze statusem RESERVED (tylko dla admina)
  - Po zatwierdzeniu status zmienia się na APPROVED
  - Admin widzi dane awizacji przed zatwierdzeniem
  - Przycisk nieaktywny w trakcie wysyłania żądania

- [x] **Przycisk "Przypisz dock" dla admina** *done 23.03.2026*
  - Przycisk/dropdown "Przypisz dock" widoczny przy slotach bez przypisanego doku
  - Lista doków filtrowana po magazynie i statusie (tylko aktywne)
  - Po przypisaniu dock wyświetla się przy slocie
  - Zmiana doku jest możliwa do momentu COMPLETED

- [x] **COMPLETED status + filtrowanie archiwum (frontend)** *(done 23.03.2026)*
  - Zakładka "Archiwum" w nawigacji (lub toggle na liście slotów)
  - Filtrowanie po dacie (od, do), firmie, typie operacji
  - Tabela pokazuje wszystkie dane slotu (w tym dane awizacji)
  - Paginacja dla dużej ilości rekordów

---

## Etap 3: Anulowanie i cykl zamknięcia

**Cel:** obsługa scenariuszy negatywnych i zamykania slotów.

**Definicja wykonania:** Zarówno klient, jak i admin mogą anulować slot. Workflow anulowania (CANCEL_PENDING → CANCELLED) działa poprawnie z odpowiednimi uprawnieniami.

**Kryteria akceptacji etapu:**

- Klient może poprosić o anulowanie (CANCEL_PENDING)
- Admin może zatwierdzić anulowanie lub odrzucić
- Admin może bezpośrednio anulować slot
- Historia zmian statusu jest zachowana

### Frontend

- [x] **Dodanie akcji anulowania, zamknięcia slotu** *done 23.03.2026*
  - Przycisk "Anuluj" widoczny przy slotach w odpowiednich statusach
  - Przycisk "Zamknij" (→ COMPLETED) widoczny tylko dla admina
  - Potwierdzenie akcji modalem ("Czy na pewno chcesz anulować?")
  - Po akcji lista slotów odświeża się

- [x] **Cancel workflow (CANCEL_PENDING)** *done 23.03.2026*
  - Klient klikając "Anuluj" zmienia status na CANCEL_PENDING (nie CANCELLED bezpośrednio)
  - Admin widzi sloty ze statusem CANCEL_PENDING z opcjami "Potwierdź anulowanie" / "Odrzuć"
  - Po potwierdzeniu status zmienia się na CANCELLED
  - Po odrzuceniu slot wraca do poprzedniego statusu
  - CANCEL_PENDING sloty są wizualnie wyróżnione (np. kolor, badge)

- [x] **Przycisk "Anuluj" (cancel) dla obu ról** *done 23.03.2026*
  - Klient: przycisk tworzy żądanie anulowania (CANCEL_PENDING)
  - Admin: przycisk anuluje bezpośrednio (CANCELLED) lub zatwierdza żądanie klienta
  - Przycisk widoczny tylko przy slotach w statusach dopuszczających anulowanie
  - Przycisk nie jest widoczny przy slotach COMPLETED lub już CANCELLED
  - Opcjonalnie: pole na powód anulowania

---

## Etap 4: Generowanie slotów i kalendarz

**Cel:** widok kalendarzowy i masowe generowanie slotów z szablonów.

**Definicja wykonania:** Admin może tworzyć szablony slotów i generować sloty masowo na wybrany okres. Widok kalendarza pokazuje sloty w formie graficznej.

**Kryteria akceptacji etapu:**

- Admin może stworzyć szablon (np. "Pon-Pt, 8:00-16:00, co 30 min, INBOUND")
- Admin może wygenerować sloty z szablonu na wybrany zakres dat
- Widok kalendarza (dzień/tydzień) pokazuje sloty z kolorami wg statusu
- Endpoint `/api/calendar/summary` zwraca dane zagregowane dla widoku kalendarza

### Backend

- [x] **api/calendar/summary (endpoint agregacyjny)** *done 23.03.2026**done 23.03.2026*
  - GET `/api/calendar/summary?date_from=...&date_to=...&warehouse_id=...` zwraca dane
  - Odpowiedź zawiera: liczbę slotów per dzień/godzina, podział wg statusu, zajętość doków
  - Obsługa filtrów: warehouse, dock, typ operacji
  - Wydajność: odpowiedź poniżej 500 ms dla zakresu miesiąca
  - Dokumentacja w Swagger z przykładową odpowiedzią

### Frontend

- [x] **Podstrona z generowaniem slotów na podstawie szablonów wraz z ich tworzeniem**
  - Formularz tworzenia szablonu: dni tygodnia, zakres godzin, interwał, typ operacji, dock (opcjonalnie)
  - Lista zapisanych szablonów z opcją edycji i usunięcia
  - Przycisk "Generuj sloty" z wyborem zakresu dat i szablonu
  - Podgląd ile slotów zostanie wygenerowanych przed potwierdzeniem
  - Po generowaniu wyświetla podsumowanie (ile utworzono, ile pominięto jako duplikaty)

- [x] **Calendar (widok kalendarza)** *done 23.03.2026*
  - Widok tygodniowy z osią czasu (godziny) i kolumnami (dni)
  - Sloty wyświetlane jako bloki z kolorem zależnym od statusu
  - Kliknięcie w slot otwiera szczegóły (status, firma, awizacja)
  - Przełączanie między widokiem dziennym a tygodniowym
  - Filtrowanie po magazynie i doku
  - Dane pobierane z `/api/calendar/summary`

---

## Etap 5: Uprawnienia i widoczność zasobów

**Cel:** każda rola widzi dokładnie to, co powinna.

**Definicja wykonania:** System uprawnień działa spójnie na frontendzie i backendzie. Klient jest ograniczony do swojego magazynu, admin do swoich magazynów, superadmin widzi wszystko.

**Kryteria akceptacji etapu:**

- Klient nie może zobaczyć ani uzyskać dostępu do zasobów spoza swojego magazynu
- Klient widzi tylko aktywne docki
- Superadmin ma pełny CRUD na magazynach z poziomu UI
- Próba dostępu do niedozwolonego zasobu (np. ręczna zmiana URL) zwraca błąd lub redirect

### Frontend

- [x] **Klient nie widzi zasobów spoza swojego warehouse** *done 23.03.2026*
  - Lista slotów, doków i kalendarza zawiera tylko dane z magazynu klienta
  - Nawigacja nie zawiera opcji zmiany magazynu dla klienta
  - Ręczne wpisanie URL z innym warehouse_id nie zwraca danych (walidacja po stronie API + obsługa 403 na froncie)
  - Dropdown filtrów nie pokazuje innych magazynów

- [x] **Klient widzi tylko aktywne docki** *done 23.03.2026*
  - Klient na liście doków widzi tylko te ze statusem active
  - Przy rezerwacji dropdown doków nie zawiera nieaktywnych
  - Admin nadal widzi wszystkie docki (aktywne i nieaktywne) z oznaczeniem statusu

- [x] **Ekran zarządzania magazynami dla superadmina (CRUD w UI)** *done 23.03.2026*
  - Superadmin widzi listę wszystkich magazynów
  - Formularz tworzenia nowego magazynu (nazwa, adres, strefa czasowa)
  - Formularz edycji magazynu
  - Przycisk dezaktywacji/usunięcia magazynu z potwierdzeniem
  - Podstrona niedostępna dla admina i klienta (guard na routerze + sprawdzenie roli)

---

## Etap 6: Raporty i i18n

**Cel:** wartość biznesowa (raporty) + dopracowanie UX.

**Definicja wykonania:** System raportów pozwala na analizę wykorzystania slotów. Interfejs jest w pełni przetłumaczony na wszystkie obsługiwane języki.

**Kryteria akceptacji etapu:**

- Admin może wygenerować raport z wykorzystania slotów za wybrany okres
- Wszystkie elementy UI (etykiety, komunikaty, walidacje, toasty) zmieniają się przy przełączeniu języka
- Brak hardcodowanych tekstów w komponentach

### Frontend

- [x] **Raporty** *done 23.03.2026*
  - Raport "Wykorzystanie slotów": % zajętości per dzień/tydzień/miesiąc
  - Raport "Rezerwacje per firma": liczba rezerwacji z podziałem na firmy
  - Filtrowanie po zakresie dat, magazynie, firmie
  - Eksport do CSV lub XLSX
  - Wykresy (bar chart / line chart) dla wizualizacji trendów

- [x] **Przeklikanie czy wszędzie zmienia się język** *done 23.03.2026*
  - Checklist każdego widoku: nagłówki, przyciski, placeholdery, komunikaty walidacji, toasty, puste stany, tooltips
  - Przełączenie języka natychmiast zmienia wszystkie teksty (bez przeładowania strony)
  - Daty i liczby formatowane zgodnie z lokalizacją (np. dd.MM.yyyy dla PL)
  - Brak literówek i brakujących kluczy (console nie loguje ostrzeżeń i18n)

---

## Etap 7: Jakość i bezpieczeństwo (tech debt)

**Cel:** profesjonalizacja projektu przed wdrożeniem produkcyjnym.

**Definicja wykonania:** Kluczowe luki bezpieczeństwa zamknięte, podstawowe testy napisane, frontend obsługuje błędy gracefully.

**Kryteria akceptacji etapu:**

- JWT secret generowany, nie hardcodowany
- Minimum 80% pokrycia testami kluczowych endpointów
- Frontend nigdy nie pokazuje surowego błędu API (zawsze przyjazny komunikat)

- [x] **JWT_SECRET_KEY hardcoded jako "change_me_please" w .env** *done 24.03.2026*
  - `.env.example` zawiera placeholder z komentarzem jak wygenerować sekret
  - Aplikacja nie startuje, jeśli JWT_SECRET_KEY == "change_me_please" (fail-fast)
  - Dokumentacja w README opisuje jak ustawić bezpieczny sekret
  - Sekret ma minimum 32 znaki

- [x] **Brak testów (unit / integration)** *done 24.03.2026*
  - Testy endpointów: tworzenie/edycja firmy, rezerwacja slotu, zmiana statusu, zmiana hasła
  - Testy walidacji: niepoprawne dane wejściowe, brakujące pola, duplikaty
  - Testy uprawnień: klient nie ma dostępu do zasobów admina, admin nie zmieni superadmina
  - Testy uruchamiane w CI (GitHub Actions lub analogiczne)
  - Minimum 80% pokrycia kodu kluczowych modułów

- [x] **Obsługa błędów na frontendzie** *done 24.03.2026*
  - Error Boundary łapiący nieoczekiwane crashe komponentów (ekran "Coś poszło nie tak" z opcją odświeżenia)
  - Interceptor HTTP (axios/fetch) przechwytujący błędy API i wyświetlający toast z komunikatem
  - Obsługa 401 (automatyczny redirect do logowania)
  - Obsługa 403 (komunikat "Brak uprawnień")
  - Obsługa 500 (komunikat "Błąd serwera, spróbuj ponownie")
  - Obsługa braku połączenia z API (komunikat offline)

### Plan implementacji — obsługa błędów na frontendzie

#### Krok 1 — Globalny system toast/flash dla błędów

**Kontekst:** `useFlash` obsługuje tylko sukces i jest per-komponent. Potrzebny jest globalny system widoczny z dowolnego miejsca w drzewie.

**Pliki do stworzenia/modyfikacji:**
- `src/hooks/useToast.ts` — nowy hook: `{ toasts, addToast, removeToast }`, typy: `success | error | warning | info`
- `src/components/UI/ToastContainer.tsx` — nowy komponent: fixed w prawym dolnym rogu, renderuje listę toastów z auto-dismiss (4s)
- `src/App.tsx` — opakować w `<ToastContainer />` i wyeksportować `addToast` przez Context lub event emitter

> **Uwaga:** Zamiast Context można użyć prostego event emittera (np. `mitt`) lub globalnego modułu `toastBus.ts` — unika przepuszczania propsów przez całe drzewo i jest prostsze niż Context API.

---

#### Krok 2 — Interceptor response w `api.ts`

**Plik:** `src/API/api.ts`

Dodać `api.interceptors.response.use(onFulfilled, onRejected)`:

| Kod HTTP | Akcja |
|----------|-------|
| `401` | Wyczyść token (`setToken(null)`), przekieruj na `/login` via `window.location.href` lub event |
| `403` | Toast error: `t('error_forbidden')` |
| `500` / `502` / `503` | Toast error: `t('error_server')` |
| Brak odpowiedzi (`error.request`) | Toast error: `t('error_offline')` |
| Inne błędy API | Toast error: przetłumaczony `error_code` z `errorText` w `i18n.ts` (już istnieje) |

> **Uwaga:** Błędy walidacji (422) i biznesowe (400 z `error_code`) **nie** powinny być obsługiwane globalnie — każdy komponent/hook obsługuje je lokalnie przez `ErrorBanner` (jak jest teraz). Interceptor łapie tylko błędy infrastrukturalne.

---

#### Krok 3 — Error Boundary

**Plik do stworzenia:** `src/components/ErrorBoundary.tsx`

- Class component (React wymaga class dla Error Boundary)
- `componentDidCatch` loguje błąd do konsoli
- Fallback UI: ekran "Coś poszło nie tak" z przyciskiem "Odśwież stronę" (`window.location.reload()`)
- Obsługuje i18n (props `lang` lub odczyt z localStorage)

**Plik:** `src/main.tsx` — opakować `<App />` w `<ErrorBoundary>`

---

#### Krok 4 — Klucze i18n

**Plik:** `src/Helper/i18n.ts`

Dodać brakujące klucze do słowników PL i EN:
- `error_forbidden` — "Brak uprawnień" / "Access denied"
- `error_server` — "Błąd serwera, spróbuj ponownie" / "Server error, please try again"
- `error_offline` — "Brak połączenia z serwerem" / "Cannot reach the server"
- `error_boundary_title` — "Coś poszło nie tak" / "Something went wrong"
- `error_boundary_refresh` — "Odśwież stronę" / "Refresh page"

---

#### Kolejność wykonania

1. Krok 4 (i18n) — bez zależności
2. Krok 1 (toast system) — potrzebny przez interceptor
3. Krok 2 (interceptor) — zależy od toast
4. Krok 3 (Error Boundary) — niezależne, można równolegle z 1-2

## Etap 8 Jakość i bezpieczeństwo

- [ ] **J1. Testy integracyjne backendu** (pytest + TestClient)
  - Pokrycie: auth, slot workflow, company/user CRUD
- [ ] **J2. Rate limiting** na `/api/login`
- [ ] **J3. Refresh token** (obecny JWT wygasa, brak odświeżania)

### L — Naprawa konfiguracji testów frontendowych (Vitest)

- [ ] **L1. `ReferenceError: expect is not defined` w setup.ts**
  - `@testing-library/jest-dom` importowany w `setup.ts` wymaga globalnego `expect`
  - Dodać `globals: true` w konfiguracji Vitest (`vite.config.ts` lub `vitest.config.ts`)
  - Dotyczy wszystkich testów: `helper.test.ts`, `i18n.test.ts`, komponentów raportów, `useReports.test.ts`

### K — Naprawa istniejących testów (fail_test.md)

- [ ] **K1. Błędny kod HTTP przy braku tokenu** — `test_auth.py:47`, `test_warehouses.py:26`
  - API zwraca `401`, testy oczekują `403`
  - Poprawić asercje w testach na `== 401`

- [ ] **K2. Brakujące pole `warehouse_id` w odpowiedzi** — `test_companies.py:58`, `test_docks.py:41`
  - Schematy `CompanyOut` / `DockOut` w `schemas.py` nie zawierają pola `warehouse_id`
  - Dodać pole do schematów lub zweryfikować, czy endpoint je zwraca

- [ ] **K3. Filtrowanie slotów po statusie nie działa** — `test_slots.py:35`
  - `GET /api/slots?status=AVAILABLE` zwraca sloty o innych statusach
  - Sprawdzić i naprawić logikę filtrowania w `routers/slots.py`