"""Tests for key /api/slots workflows."""
from datetime import datetime

from app import models
from tests.conftest import make_slot


# ---------------------------------------------------------------------------
# GET /api/slots
# ---------------------------------------------------------------------------

def test_admin_lists_slots(api, db, wh, admin_h):
    make_slot(db, wh.id, start=datetime(2025, 6, 1, 8, 0), end=datetime(2025, 6, 1, 9, 0))
    make_slot(db, wh.id, start=datetime(2025, 6, 1, 9, 0), end=datetime(2025, 6, 1, 10, 0))

    resp = api.get(
        "/api/slots",
        params={"date_from": "2025-06-01", "date_to": "2025-06-01"},
        headers=admin_h,
    )
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_admin_filter_by_status(api, db, wh, admin_h):
    make_slot(db, wh.id, status=models.SlotStatus.AVAILABLE)
    make_slot(db, wh.id, status=models.SlotStatus.BOOKED)

    resp = api.get(
        "/api/slots",
        params={"date_from": "2025-06-01", "date_to": "2025-06-01", "status": "AVAILABLE"},
        headers=admin_h,
    )
    assert resp.status_code == 200
    assert all(s["status"] == "AVAILABLE" for s in resp.json())


def test_client_sees_slots_in_own_warehouse(api, db, wh, company, client_user, client_h):
    make_slot(db, wh.id, status=models.SlotStatus.AVAILABLE)

    resp = api.get(
        "/api/slots",
        params={"date_from": "2025-06-01", "date_to": "2025-06-01"},
        headers=client_h,
    )
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


# ---------------------------------------------------------------------------
# POST /api/slots/{id}/reserve
# ---------------------------------------------------------------------------

def test_client_reserves_available_slot(api, db, wh, company, client_user, client_h):
    # INBOUND slot — requested_type not needed (only required for ANY)
    slot = make_slot(db, wh.id, slot_type=models.SlotType.INBOUND)

    resp = api.post(
        f"/api/slots/{slot.id}/reserve",
        json={},
        headers=client_h,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "BOOKED"


def test_client_reserves_any_slot_with_type(api, db, wh, company, client_user, client_h):
    slot = make_slot(db, wh.id, slot_type=models.SlotType.ANY)

    resp = api.post(
        f"/api/slots/{slot.id}/reserve",
        json={"requested_type": "INBOUND"},
        headers=client_h,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "BOOKED"


def test_reserve_any_slot_without_type_fails(api, db, wh, company, client_user, client_h):
    slot = make_slot(db, wh.id, slot_type=models.SlotType.ANY)

    resp = api.post(
        f"/api/slots/{slot.id}/reserve",
        json={},
        headers=client_h,
    )
    assert resp.status_code == 400
    assert resp.json()["detail"]["error_code"] == "TYPE_REQUIRED"


def test_reserve_already_booked_slot_fails(api, db, wh, company, client_user, client_h):
    slot = make_slot(db, wh.id, status=models.SlotStatus.BOOKED)

    resp = api.post(
        f"/api/slots/{slot.id}/reserve",
        json={},
        headers=client_h,
    )
    assert resp.status_code == 409


def test_admin_cannot_reserve_slot(api, db, wh, admin_h):
    slot = make_slot(db, wh.id)

    resp = api.post(
        f"/api/slots/{slot.id}/reserve",
        json={"slot_type": "INBOUND"},
        headers=admin_h,
    )
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# POST /api/slots/{id}/approve
# ---------------------------------------------------------------------------

def test_admin_approves_booked_slot(api, db, wh, company, client_user, admin_h):
    slot = make_slot(
        db, wh.id,
        status=models.SlotStatus.BOOKED,
        reserved_by=client_user.id,
    )

    resp = api.post(f"/api/slots/{slot.id}/approve", headers=admin_h)
    assert resp.status_code == 200
    assert resp.json()["status"] == "APPROVED_WAITING_DETAILS"


def test_approve_non_booked_slot_fails(api, db, wh, admin_h):
    slot = make_slot(db, wh.id, status=models.SlotStatus.AVAILABLE)

    resp = api.post(f"/api/slots/{slot.id}/approve", headers=admin_h)
    assert resp.status_code == 409


# ---------------------------------------------------------------------------
# POST /api/slots/{id}/cancel
# ---------------------------------------------------------------------------

def test_admin_cancels_available_slot(api, db, wh, admin_h):
    slot = make_slot(db, wh.id, status=models.SlotStatus.AVAILABLE)

    resp = api.post(f"/api/slots/{slot.id}/cancel", headers=admin_h)
    assert resp.status_code == 200
    assert resp.json()["status"] == "CANCELLED"


def test_admin_cancels_booked_slot(api, db, wh, company, client_user, admin_h):
    slot = make_slot(
        db, wh.id,
        status=models.SlotStatus.BOOKED,
        reserved_by=client_user.id,
    )

    resp = api.post(f"/api/slots/{slot.id}/cancel", headers=admin_h)
    assert resp.status_code == 200
    assert resp.json()["status"] == "CANCELLED"


# ---------------------------------------------------------------------------
# DELETE /api/slots/{id}  (single)
# ---------------------------------------------------------------------------

def test_superadmin_deletes_available_slot(api, db, wh, superadmin_h):
    slot = make_slot(db, wh.id, status=models.SlotStatus.AVAILABLE)

    resp = api.delete(
        f"/api/slots/{slot.id}",
        params={"warehouse_id": wh.id},
        headers=superadmin_h,
    )
    assert resp.status_code == 204


def test_admin_cannot_delete_slot(api, db, wh, admin_h):
    slot = make_slot(db, wh.id)
    resp = api.delete(f"/api/slots/{slot.id}", headers=admin_h)
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# DELETE /api/slots  (bulk)
# ---------------------------------------------------------------------------

def test_superadmin_bulk_deletes_available_slots(api, db, wh, superadmin_h):
    make_slot(db, wh.id, status=models.SlotStatus.AVAILABLE)
    make_slot(db, wh.id, status=models.SlotStatus.AVAILABLE)
    make_slot(db, wh.id, status=models.SlotStatus.BOOKED)

    resp = api.delete(
        "/api/slots",
        params={
            "warehouse_id": wh.id,
            "date_from": "2025-06-01",
            "date_to": "2025-06-01",
            "status": "AVAILABLE",
        },
        headers=superadmin_h,
    )
    assert resp.status_code == 200
    assert resp.json()["deleted"] == 2


def test_admin_cannot_bulk_delete_slots(api, wh, admin_h):
    resp = api.delete(
        "/api/slots",
        params={"date_from": "2025-06-01", "date_to": "2025-06-01"},
        headers=admin_h,
    )
    assert resp.status_code == 403
