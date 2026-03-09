# Struktura Bazy Danych (Data Structure)

Plik opisuje strukturę bazy danych systemu, opartą na modelach SQLAlchemy zdefiniowanych w `backend/app/models.py`.

## 1. Wyliczenia (Enums)

*   **Role**: Definiuje typy użytkowników (`superadmin`, `admin`, `client`).
*   **SlotType**: Określa typ przedziału/operacji (`INBOUND` - dostawa, `OUTBOUND` - odbiór, `ANY` - dowolny).
*   **SlotStatus**: Określa status rezerwacji (`AVAILABLE`, `BOOKED`, `APPROVED_WAITING_DETAILS`, `RESERVED_CONFIRMED`, `COMPLETED`, `CANCELLED`).

---

## 2. Tabele (Modele)

### `warehouses` (Magazyny)
Główna jednostka w systemie. Do magazynu przypisane są doki, firmy, pojemności, sloty oraz szablony.
*   **id**: Integer (Primary Key)
*   **name**: String
*   **alias**: String (Unikalny identyfikator / skrót)
*   **location**: String
*   **is_active**: Boolean (Domyślnie: true)
*   **logo_path**: String

### `companies` (Firmy/Klienci)
Firmy powiązane z danym magazynem.
*   **id**: Integer (Primary Key)
*   **warehouse_id**: Integer (Foreign Key -> `warehouses.id`)
*   **name**: String
*   **alias**: String
*   **is_active**: Boolean (Domyślnie: true)
*   **Relacje**: `Warehouse`, `User` (użytkownicy przypisani do danej firmy).

### `users` (Użytkownicy)
Konta logowania do systemu z określonymi rolami.
*   **id**: Integer (Primary Key)
*   **username**: String (Unikalna nazwa logowania / e-mail)
*   **password_hash**: String (Zahashowane hasło)
*   **alias**: String (Wyświetlana nazwa, np. Jan Kowalski)
*   **role**: Enum `Role`
*   **warehouse_id**: Integer (Foreign Key, używane dla roli `admin`)
*   **company_id**: Integer (Foreign Key, używane dla roli `client`)

### `docks` (Doki)
Punkty załadunkowo-rozładunkowe w magazynie.
*   **id**: Integer (Primary Key)
*   **warehouse_id**: Integer (Foreign Key -> `warehouses.id`)
*   **name**: String
*   **alias**: String
*   **is_active**: Boolean (Domyślnie: true)

### `slots` (Okienka Czasowe / Środki Transportu)
Najważniejsza tabela - reprezentuje pojedynczy czasowy slot na konkretnym doku lub ogólnie w magazynie.
*   **id**: Integer (Primary Key)
*   **warehouse_id**: Integer (Foreign Key -> `warehouses.id`)
*   **dock_id**: Integer (Foreign Key -> `docks.id`)
*   **start_dt**: DateTime (Początek)
*   **end_dt**: DateTime (Koniec)
*   **slot_type**: Enum `SlotType` (Obecny typ)
*   **original_slot_type**: Enum `SlotType` (Oryginalny typ bazowy)
*   **status**: Enum `SlotStatus` (Domyślnie `AVAILABLE`)
*   **reserved_by_user_id**: Integer (Foreign Key -> `users.id` - kto zarezerwował)
*   **Relacje**: Posiada szczegóły transportu przez relację `SlotNotice` (jeden-do-jednego).

### `slot_notices` (Szczegóły Awizacji)
Szczegółowe dane dotyczące załadunku/rozładunku powiązane z konkretnym slotem (awizacja).
*   **id**: Integer (Primary Key)
*   **slot_id**: Integer (Foreign Key -> `slots.id`, 1:1)
*   **numer_zlecenia**: String
*   **referencja**: String
*   **rejestracja_auta**: String
*   **rejestracja_naczepy**: String
*   **ilosc_palet**: Integer
*   **kierowca_imie_nazwisko**: String (Opcjonalnie)
*   **kierowca_tel**: String (Opcjonalnie)
*   **uwagi**: String (Opcjonalnie)

### `day_capacities` (Pojemność Dniowa)
Zarządzanie maksymalnymi możliwościami obsługi magazynu (np. wg typu operacji INBOUND/OUTBOUND).
*   **id**: Integer (Primary Key)
*   **warehouse_id**: Integer (Foreign Key -> `warehouses.id`)
*   **date**: Date (Konkretny dzień)
*   **slot_type**: Enum `SlotType`
*   **capacity**: Integer (Maksymalna pojemność w danym dniu)

### `slot_templates` (Szablony Slotów)
Służy do automatycznego generowania harmonogramów okienek czasowych.
*   **id**: Integer (Primary Key)
*   **warehouse_id**: Integer (Foreign Key -> `warehouses.id`)
*   **name**: String
*   **start_hour**: Integer (Godzina startu, domyślnie 6)
*   **end_hour**: Integer (Godzina końca, domyślnie 18)
*   **slot_minutes**: Integer (Czas trwania okna, np. 30 minut)
*   **slot_type**: Enum `SlotType` (Domyślnie `ANY`)
*   **is_active**: Boolean (Domyślnie: true)
