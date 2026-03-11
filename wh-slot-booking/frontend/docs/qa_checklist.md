# QA Checklist (manual) — mapping do AC z master_prompt.md

## Global
- [ ] AC-G4: język PL/EN przełącza UI i pamięta wybór
- [ ] AC-G5: API zwraca error_code i UI mapuje na tekst

## Auth / Context
- [ ] AC-A2: /api/me zwraca warehouse zawsze (również dla client)
- [ ] AC-C2: client nie widzi zasobów spoza swojego warehouse

## Companies
- [ ] AC-CO2: POST /api/companies bez alias działa (alias auto)
- [ ] AC-CO1: GET /api/companies zwraca aliasy

## Users
- [ ] AC-U3: GET /api/users nie wali walidacją, warehouse_id może być null
- [ ] AC-U3b: UI pokazuje company_alias zamiast company_id

## Docks
- [ ] AC-DCK2: client widzi tylko aktywne docki

## Slots flow
- [ ] AC-S3: ANY bez requested_type -> TYPE_REQUIRED
- [ ] AC-S4: approve -> APPROVED_WAITING_DETAILS
- [ ] AC-S5: notice waliduje pola i finalizuje RESERVED_CONFIRMED
- [ ] AC-S6: assign dock wykrywa konflikt DOCK_CONFLICT
- [ ] AC-S8: w slotach widoczne aliasy (dock_alias, reserved_by_alias)
