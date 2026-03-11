# WH Slot Booking — Roadmap / Backlog (v1)
# MUST → SHOULD → LATER w kolejności realizacji

## MUST — fundamenty
0.1 Auth + kontekst (/api/login, /api/me) + filtrowanie warehouse
- Done: AC-A2, AC-C2

0.2 Error codes (szkielet) dla kluczowych endpointów
- Done: AC-G5 dla login/reserve/notice/users/companies

## MUST — dane i administracja
1.1 DB schema final (Warehouse/Company/User/Dock/Slot/SlotNotice/DayCapacity/Template)
- Done: AC-D3, AC-D7

1.2 Warehouses management (superadmin)
- Done: AC-W1, AC-W2

1.3 Loga (static + upload)
- Done: AC-L1, AC-L3

## MUST — firmy i użytkownicy
2.1 Companies GET/POST, alias auto
- Done: AC-CO2, AC-CO1

2.2 Users GET/POST, response z aliasami (company_alias/warehouse_alias)
- Done: AC-U3, AC-U3b

## MUST — docki
3.1 Dock CRUD + is_active (client widzi tylko aktywne)
- Done: AC-DCK1, AC-DCK2

## MUST — slot workflow end-to-end
4.1 Slot list + range filter
- Done: AC-S2

4.2 Reserve (client) + ANY type
- Done: AC-S3

4.3 Approve (admin)
- Done: AC-S4

4.4 Notice (client) + walidacje pól
- Done: AC-S5, AC-N1, AC-N3

4.5 Assign dock + konflikt
- Done: AC-S6

4.6 SlotOut aliasy
- Done: AC-S8, AC-UX2

## MUST — DayCapacity + Generator
5.1 DayCapacity CRUD
- Done: AC-CAP2

5.2 Generator z przycinaniem do capacity
- Done: AC-CAP2b

## MUST — UI
6.1 i18n skeleton PL/EN + localStorage
- Done: AC-I3, AC-I4

7.1 Login + header kontekst (/api/me) + logo globalne i warehouse
- Done: brak "Błąd połączenia z API" + poprawne aliasy/loga

8.1 Admin: firmy/użytkownicy/docki z aliasami
- Done: AC-UX1

9.1 Sloty + workflow w UI-v2 (client/admin)
- Done: pełny flow działa bez ręcznych obejść

## SHOULD
10. Admin Calendar month/week (range fetch)
- Done: AC-CAL2, AC-CAL3
- Optional: /api/calendar/summary

11. Cancel workflow z CANCEL_PENDING + approve/reject
12. COMPLETED status + filtrowanie archiwum

## LATER
13. Raporty/eksporty
14. Granularne role
15. Migracje DB (Alembic)
