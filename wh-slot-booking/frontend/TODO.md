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

- [ ] ** POST /api/companies bez alias działa (alias auto)**
  - POST `/api/companies` z body bez pola `alias` zwraca 201 i wygenerowany alias
  - Alias jest tworzony jako slug z nazwy firmy (lowercase, bez spacji/znaków specjalnych)
  - Jeśli alias już istnieje, dodawany jest numeryczny sufiks (np. `firma-1`)
  - POST z jawnie podanym aliasem nadal działa bez zmian

- [ ] **GET /api/companies zwraca aliasy**
  - GET `/api/companies` zwraca listę firm, każda z polem `alias`
  - GET `/api/companies/{id}` również zwraca `alias`
  - Alias jest widoczny w dokumentacji Swagger

- [ ] **Dodanie możliwości zmiany hasła dla użytkownika**
  - POST/PATCH `/api/users/me/password` przyjmuje `old_password` i `new_password`
  - Przy złym starym haśle zwraca 400 z czytelnym komunikatem
  - Nowe hasło musi spełniać wymagania (min. 8 znaków)
  - Po zmianie hasła stary token nadal działa do wygaśnięcia (lub nie, jeśli decyzja projektowa)
  - Hasło jest hashowane przed zapisem

### Frontend

- [x] **Dodanie formularza do edycji doku** (done 17.03.2026)
  - Admin widzi przycisk "Edytuj" przy każdym doku
  - Formularz wczytuje aktualne dane doku
  - Walidacja pól po stronie frontendu (wymagane pola, format)
  - Po zapisie lista doków odświeża się z aktualnymi danymi
  - Toast/komunikat o sukcesie lub błędzie
- [X] Odświeżenie danych dok, user (done 17.03.2026)

- [x] **Dodanie możliwości edycji użytkownika** (done 17.03.2026)
  - Admin widzi przycisk "Edytuj" przy każdym użytkowniku
  - Formularz wczytuje aktualne dane użytkownika
  - Zmiana roli działa poprawnie (dropdown z dostępnymi rolami)
  - Nie można edytować superadmina z poziomu admina
  - Walidacja email (unikalność, format)

- [ ] **Dodanie możliwości edycji firmy**
  - Admin widzi przycisk "Edytuj" przy każdej firmie
  - Formularz wczytuje aktualne dane firmy (w tym alias)
  - Zmiana nazwy firmy nie zmienia automatycznie aliasu (alias edytowalny osobno)
  - Walidacja unikalności nazwy i aliasu
  - Toast/komunikat o sukcesie lub błędzie

- [ ] **Dodanie możliwości zmiany hasła dla użytkownika (frontend)**
  - Użytkownik ma dostęp do formularza z menu profilu
  - Formularz wymaga podania starego hasła, nowego hasła i potwierdzenia
  - Walidacja po stronie frontendu: zgodność nowego hasła z potwierdzeniem, minimalna długość
  - Przy błędnym starym haśle wyświetla komunikat z API
  - Po udanej zmianie wyświetla potwierdzenie (nie wylogowuje)

---

## Etap 2: Rezerwacja i workflow slotów

**Cel:** pełna ścieżka życia slotu od wyświetlenia po zatwierdzenie.

**Definicja wykonania:** Klient może przeglądać dostępne sloty, zarezerwować slot, wypełnić awizację, a admin może zatwierdzić rezerwację i przypisać dock. Sloty przechodzą poprawnie między statusami.

**Kryteria akceptacji etapu:**

- Klient widzi tylko otwarte sloty swojego magazynu i może zarezerwować slot
- Admin widzi rezerwacje i może je zatwierdzić oraz przypisać dock
- Status slotu zmienia się zgodnie z diagramem stanów (OPEN → RESERVED → APPROVED → COMPLETED)
- Archiwum slotów ze statusem COMPLETED jest dostępne z filtrowaniem

### Backend

- [ ] **COMPLETED status + filtrowanie archiwum**
  - Slot może przejść do statusu COMPLETED (np. po zakończeniu okna czasowego lub ręcznie)
  - GET `/api/slots?status=COMPLETED` zwraca tylko zakończone sloty
  - GET `/api/slots?status=COMPLETED&date_from=...&date_to=...` filtruje po dacie
  - Domyślne listowanie slotów (bez filtra) nie zwraca COMPLETED (archiwum osobno)

### Frontend

- [ ] **Wyświetlanie otwartych slotów dla klientów**
  - Klient widzi tylko sloty ze statusem OPEN przypisane do jego magazynu
  - Widoczne informacje: data, godzina, typ (INBOUND/OUTBOUND/ANY), dock (jeśli przypisany)
  - Lista odświeża się po rezerwacji
  - Pusty stan ("Brak dostępnych slotów") wyświetla się poprawnie

- [ ] **Przycisk "Rezerwuj" dla klienta**
  - Przycisk "Rezerwuj" widoczny przy każdym otwartym slocie
  - Po kliknięciu slot zmienia status na RESERVED i znika z listy otwartych
  - Jeśli ktoś inny zdążył zarezerwować (race condition), wyświetla komunikat o błędzie
  - Przycisk jest nieaktywny podczas wysyłania żądania (zapobieganie podwójnemu kliknięciu)

- [ ] **Formularz awizacji (notice) dla klienta**
  - Formularz pojawia się po rezerwacji slotu (lub jest dostępny z widoku "Moje rezerwacje")
  - Wymagane pola: numer rejestracyjny, imię kierowcy, rodzaj towaru, ilość palet (do ustalenia)
  - Walidacja wymaganych pól przed wysłaniem
  - Dane zapisywane przez API i powiązane ze slotem

- [ ] **Obsługa slotów typu ANY (wybór INBOUND/OUTBOUND przy rezerwacji)**
  - Dla slotów typu ANY pojawia się dodatkowy select/radio z opcjami INBOUND/OUTBOUND
  - Wybrany kierunek jest zapisywany w rezerwacji
  - Dla slotów z ustalonym typem (INBOUND/OUTBOUND) dodatkowy wybór się nie pojawia

- [ ] **Przycisk "Zatwierdź" (approve) dla admina**
  - Przycisk "Zatwierdź" widoczny przy slotach ze statusem RESERVED (tylko dla admina)
  - Po zatwierdzeniu status zmienia się na APPROVED
  - Admin widzi dane awizacji przed zatwierdzeniem
  - Przycisk nieaktywny w trakcie wysyłania żądania

- [ ] **Przycisk "Przypisz dock" dla admina**
  - Przycisk/dropdown "Przypisz dock" widoczny przy slotach bez przypisanego doku
  - Lista doków filtrowana po magazynie i statusie (tylko aktywne)
  - Po przypisaniu dock wyświetla się przy slocie
  - Zmiana doku jest możliwa do momentu COMPLETED

- [ ] **COMPLETED status + filtrowanie archiwum (frontend)**
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

- [ ] **Dodanie akcji anulowania, zamknięcia slotu**
  - Przycisk "Anuluj" widoczny przy slotach w odpowiednich statusach
  - Przycisk "Zamknij" (→ COMPLETED) widoczny tylko dla admina
  - Potwierdzenie akcji modalem ("Czy na pewno chcesz anulować?")
  - Po akcji lista slotów odświeża się

- [ ] **Cancel workflow (CANCEL_PENDING)**
  - Klient klikając "Anuluj" zmienia status na CANCEL_PENDING (nie CANCELLED bezpośrednio)
  - Admin widzi sloty ze statusem CANCEL_PENDING z opcjami "Potwierdź anulowanie" / "Odrzuć"
  - Po potwierdzeniu status zmienia się na CANCELLED
  - Po odrzuceniu slot wraca do poprzedniego statusu
  - CANCEL_PENDING sloty są wizualnie wyróżnione (np. kolor, badge)

- [ ] **Przycisk "Anuluj" (cancel) dla obu ról**
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

- [ ] **api/calendar/summary (endpoint agregacyjny)**
  - GET `/api/calendar/summary?date_from=...&date_to=...&warehouse_id=...` zwraca dane
  - Odpowiedź zawiera: liczbę slotów per dzień/godzina, podział wg statusu, zajętość doków
  - Obsługa filtrów: warehouse, dock, typ operacji
  - Wydajność: odpowiedź poniżej 500 ms dla zakresu miesiąca
  - Dokumentacja w Swagger z przykładową odpowiedzią

### Frontend

- [ ] **Podstrona z generowaniem slotów na podstawie szablonów wraz z ich tworzeniem**
  - Formularz tworzenia szablonu: dni tygodnia, zakres godzin, interwał, typ operacji, dock (opcjonalnie)
  - Lista zapisanych szablonów z opcją edycji i usunięcia
  - Przycisk "Generuj sloty" z wyborem zakresu dat i szablonu
  - Podgląd ile slotów zostanie wygenerowanych przed potwierdzeniem
  - Po generowaniu wyświetla podsumowanie (ile utworzono, ile pominięto jako duplikaty)

- [ ] **Calendar (widok kalendarza)**
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

- [ ] **Klient nie widzi zasobów spoza swojego warehouse**
  - Lista slotów, doków i kalendarza zawiera tylko dane z magazynu klienta
  - Nawigacja nie zawiera opcji zmiany magazynu dla klienta
  - Ręczne wpisanie URL z innym warehouse_id nie zwraca danych (walidacja po stronie API + obsługa 403 na froncie)
  - Dropdown filtrów nie pokazuje innych magazynów

- [ ] **Klient widzi tylko aktywne docki**
  - Klient na liście doków widzi tylko te ze statusem active
  - Przy rezerwacji dropdown doków nie zawiera nieaktywnych
  - Admin nadal widzi wszystkie docki (aktywne i nieaktywne) z oznaczeniem statusu

- [ ] **Ekran zarządzania magazynami dla superadmina (CRUD w UI)**
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

- [ ] **Raporty**
  - Raport "Wykorzystanie slotów": % zajętości per dzień/tydzień/miesiąc
  - Raport "Rezerwacje per firma": liczba rezerwacji z podziałem na firmy
  - Filtrowanie po zakresie dat, magazynie, firmie
  - Eksport do CSV lub XLSX
  - Wykresy (bar chart / line chart) dla wizualizacji trendów

- [ ] **Przeklikanie czy wszędzie zmienia się język**
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

- [ ] **JWT_SECRET_KEY hardcoded jako "change_me_please" w .env**
  - `.env.example` zawiera placeholder z komentarzem jak wygenerować sekret
  - Aplikacja nie startuje, jeśli JWT_SECRET_KEY == "change_me_please" (fail-fast)
  - Dokumentacja w README opisuje jak ustawić bezpieczny sekret
  - Sekret ma minimum 32 znaki

- [ ] **Brak testów (unit / integration)**
  - Testy endpointów: tworzenie/edycja firmy, rezerwacja slotu, zmiana statusu, zmiana hasła
  - Testy walidacji: niepoprawne dane wejściowe, brakujące pola, duplikaty
  - Testy uprawnień: klient nie ma dostępu do zasobów admina, admin nie zmieni superadmina
  - Testy uruchamiane w CI (GitHub Actions lub analogiczne)
  - Minimum 80% pokrycia kodu kluczowych modułów

- [ ] **Obsługa błędów na frontendzie**
  - Error Boundary łapiący nieoczekiwane crashe komponentów (ekran "Coś poszło nie tak" z opcją odświeżenia)
  - Interceptor HTTP (axios/fetch) przechwytujący błędy API i wyświetlający toast z komunikatem
  - Obsługa 401 (automatyczny redirect do logowania)
  - Obsługa 403 (komunikat "Brak uprawnień")
  - Obsługa 500 (komunikat "Błąd serwera, spróbuj ponownie")
  - Obsługa braku połączenia z API (komunikat offline)
