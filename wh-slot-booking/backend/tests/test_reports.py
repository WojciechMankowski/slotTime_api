"""Tests for /api/reports/* endpoints."""
from datetime import datetime

from app import models
from tests.conftest import make_slot


DATE_FROM = "2025-06-01"
DATE_TO = "2025-06-30"
PARAMS = {"date_from": DATE_FROM, "date_to": DATE_TO}


def _seed_slots(db, wh_id: int, client_id: int):
    """Create a known set of slots for report assertions."""
    # 3 COMPLETED INBOUND
    for h in range(3):
        make_slot(
            db, wh_id,
            status=models.SlotStatus.COMPLETED,
            slot_type=models.SlotType.INBOUND,
            start=datetime(2025, 6, 1, 8 + h, 0),
            end=datetime(2025, 6, 1, 9 + h, 0),
            reserved_by=client_id,
        )
    # 2 CANCELLED OUTBOUND
    for h in range(2):
        make_slot(
            db, wh_id,
            status=models.SlotStatus.CANCELLED,
            slot_type=models.SlotType.OUTBOUND,
            start=datetime(2025, 6, 2, 8 + h, 0),
            end=datetime(2025, 6, 2, 9 + h, 0),
        )
    # 5 AVAILABLE ANY
    for h in range(5):
        make_slot(
            db, wh_id,
            status=models.SlotStatus.AVAILABLE,
            slot_type=models.SlotType.ANY,
            start=datetime(2025, 6, 3, 8 + h, 0),
            end=datetime(2025, 6, 3, 9 + h, 0),
        )


# ---------------------------------------------------------------------------
# GET /api/reports/summary
# ---------------------------------------------------------------------------

def test_summary_aggregates_correctly(api, db, wh, company, client_user, admin_h):
    _seed_slots(db, wh.id, client_user.id)

    resp = api.get("/api/reports/summary", params=PARAMS, headers=admin_h)
    assert resp.status_code == 200
    data = resp.json()

    assert data["total"] == 10
    assert data["completed"] == 3
    assert data["cancelled"] == 2
    assert data["available"] == 5
    assert data["inbound"] == 3
    assert data["outbound"] == 2
    assert data["any"] == 5


def test_summary_utilization_calculation(api, db, wh, admin_h):
    # 4 total, 1 available → utilization = (4-1)/4 * 100 = 75.0
    for i in range(3):
        make_slot(db, wh.id, status=models.SlotStatus.COMPLETED,
                  start=datetime(2025, 6, 10, 8 + i, 0), end=datetime(2025, 6, 10, 9 + i, 0))
    make_slot(db, wh.id, status=models.SlotStatus.AVAILABLE,
              start=datetime(2025, 6, 10, 11, 0), end=datetime(2025, 6, 10, 12, 0))

    resp = api.get("/api/reports/summary", params=PARAMS, headers=admin_h)
    assert resp.status_code == 200
    assert resp.json()["utilization_pct"] == 75.0


def test_summary_client_forbidden(api, company, client_user, client_h):
    resp = api.get("/api/reports/summary", params=PARAMS, headers=client_h)
    assert resp.status_code == 403


def test_summary_invalid_date_format(api, admin_h):
    resp = api.get(
        "/api/reports/summary",
        params={"date_from": "not-a-date", "date_to": "2025-06-30"},
        headers=admin_h,
    )
    assert resp.status_code == 400
    assert resp.json()["detail"]["error_code"] == "INVALID_DATE_RANGE"


# ---------------------------------------------------------------------------
# GET /api/reports/daily
# ---------------------------------------------------------------------------

def test_daily_returns_rows_per_day(api, db, wh, admin_h):
    # 2 slots on day 1, 1 slot on day 2
    make_slot(db, wh.id, start=datetime(2025, 6, 1, 8, 0), end=datetime(2025, 6, 1, 9, 0))
    make_slot(db, wh.id, start=datetime(2025, 6, 1, 10, 0), end=datetime(2025, 6, 1, 11, 0))
    make_slot(db, wh.id, start=datetime(2025, 6, 2, 8, 0), end=datetime(2025, 6, 2, 9, 0))

    resp = api.get("/api/reports/daily", params=PARAMS, headers=admin_h)
    assert resp.status_code == 200
    rows = resp.json()
    assert len(rows) == 2

    day1 = next(r for r in rows if r["date"] == "2025-06-01")
    day2 = next(r for r in rows if r["date"] == "2025-06-02")
    assert day1["total"] == 2
    assert day2["total"] == 1


def test_daily_empty_range_returns_empty(api, wh, admin_h):
    resp = api.get(
        "/api/reports/daily",
        params={"date_from": "2020-01-01", "date_to": "2020-01-31"},
        headers=admin_h,
    )
    assert resp.status_code == 200
    assert resp.json() == []


# ---------------------------------------------------------------------------
# GET /api/reports/by-company
# ---------------------------------------------------------------------------

def test_by_company_groups_reservations(api, db, wh, company, client_user, admin_h):
    for i in range(2):
        make_slot(
            db, wh.id,
            status=models.SlotStatus.COMPLETED,
            reserved_by=client_user.id,
            start=datetime(2025, 6, 1, 8 + i, 0),
            end=datetime(2025, 6, 1, 9 + i, 0),
        )

    resp = api.get("/api/reports/by-company", params=PARAMS, headers=admin_h)
    assert resp.status_code == 200
    rows = resp.json()
    assert len(rows) >= 1
    acme_row = next((r for r in rows if r["company_alias"] == "acme"), None)
    assert acme_row is not None
    assert acme_row["total_reservations"] == 2
    assert acme_row["completed"] == 2


def test_by_company_no_reservations_returns_empty(api, wh, admin_h):
    resp = api.get("/api/reports/by-company", params=PARAMS, headers=admin_h)
    assert resp.status_code == 200
    assert resp.json() == []


# ---------------------------------------------------------------------------
# GET /api/reports/by-warehouse  (superadmin only)
# ---------------------------------------------------------------------------

def test_by_warehouse_returns_all_warehouses(api, db, wh, wh2, superadmin_h):
    make_slot(db, wh.id)
    make_slot(db, wh2.id)

    resp = api.get("/api/reports/by-warehouse", params=PARAMS, headers=superadmin_h)
    assert resp.status_code == 200
    aliases = [r["warehouse_alias"] for r in resp.json()]
    assert "TWH" in aliases
    assert "SWH" in aliases


def test_by_warehouse_skips_warehouses_without_slots(api, db, wh, wh2, superadmin_h):
    make_slot(db, wh.id)
    # wh2 has no slots

    resp = api.get("/api/reports/by-warehouse", params=PARAMS, headers=superadmin_h)
    assert resp.status_code == 200
    aliases = [r["warehouse_alias"] for r in resp.json()]
    assert "TWH" in aliases
    assert "SWH" not in aliases


def test_by_warehouse_admin_forbidden(api, wh, admin_h):
    resp = api.get("/api/reports/by-warehouse", params=PARAMS, headers=admin_h)
    assert resp.status_code == 403
    assert resp.json()["detail"]["error_code"] == "FORBIDDEN"
