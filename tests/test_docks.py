"""Tests for /api/docks endpoints."""


# ---------------------------------------------------------------------------
# GET /api/docks
# ---------------------------------------------------------------------------

def test_admin_lists_all_docks(api, wh, dock, admin_h):
    resp = api.get("/api/docks", headers=admin_h)
    assert resp.status_code == 200
    assert any(d["alias"] == "DA" for d in resp.json())


def test_client_sees_only_active_docks(api, db, wh, dock, company, client_user, client_h):
    from app import models

    inactive = models.Dock(warehouse_id=wh.id, name="Closed", alias="CL", is_active=False)
    db.add(inactive)
    db.commit()

    resp = api.get("/api/docks", headers=client_h)
    assert resp.status_code == 200
    aliases = [d["alias"] for d in resp.json()]
    assert "DA" in aliases
    assert "CL" not in aliases


# ---------------------------------------------------------------------------
# POST /api/docks
# ---------------------------------------------------------------------------

def test_admin_creates_dock(api, wh, admin_h):
    resp = api.post(
        "/api/docks",
        json={"name": "Dock B", "alias": "DB", "is_active": True},
        headers=admin_h,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["alias"] == "DB"
    assert data["warehouse_id"] == wh.id


def test_create_dock_alias_conflict(api, wh, dock, admin_h):
    resp = api.post(
        "/api/docks",
        json={"name": "Duplicate", "alias": "DA", "is_active": True},
        headers=admin_h,
    )
    assert resp.status_code == 400
    assert resp.json()["detail"]["error_code"] == "ALIAS_TAKEN"


def test_client_cannot_create_dock(api, wh, company, client_user, client_h):
    resp = api.post(
        "/api/docks",
        json={"name": "X", "alias": "X", "is_active": True},
        headers=client_h,
    )
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# PATCH /api/docks/{id}
# ---------------------------------------------------------------------------

def test_admin_updates_dock(api, wh, dock, admin_h):
    resp = api.patch(
        f"/api/docks/{dock.id}",
        json={"name": "Dock A Updated", "is_active": False},
        headers=admin_h,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Dock A Updated"
    assert data["is_active"] is False


def test_update_dock_not_found(api, wh, admin_h):
    resp = api.patch("/api/docks/9999", json={"name": "X"}, headers=admin_h)
    assert resp.status_code == 404
    assert resp.json()["detail"]["error_code"] == "DOCK_NOT_FOUND"


def test_update_dock_alias_conflict(api, db, wh, dock, admin_h):
    from app import models

    other = models.Dock(warehouse_id=wh.id, name="Dock B", alias="DB", is_active=True)
    db.add(other)
    db.commit()

    resp = api.patch(f"/api/docks/{dock.id}", json={"alias": "DB"}, headers=admin_h)
    assert resp.status_code == 400
    assert resp.json()["detail"]["error_code"] == "ALIAS_TAKEN"


# ---------------------------------------------------------------------------
# DELETE /api/docks/{id}
# ---------------------------------------------------------------------------

def test_superadmin_deletes_dock_without_active_slots(api, wh, dock, superadmin_h):
    resp = api.delete(
        f"/api/docks/{dock.id}",
        params={"warehouse_id": wh.id},
        headers=superadmin_h,
    )
    assert resp.status_code == 204


def test_delete_dock_not_found(api, wh, superadmin_h):
    resp = api.delete(
        "/api/docks/9999",
        params={"warehouse_id": wh.id},
        headers=superadmin_h,
    )
    assert resp.status_code == 404
    assert resp.json()["detail"]["error_code"] == "DOCK_NOT_FOUND"


def test_delete_dock_with_active_slot_blocked(api, db, wh, dock, superadmin_h):
    from app import models
    from tests.conftest import make_slot

    make_slot(db, wh.id, status=models.SlotStatus.BOOKED, dock_id=dock.id)

    resp = api.delete(
        f"/api/docks/{dock.id}",
        params={"warehouse_id": wh.id},
        headers=superadmin_h,
    )
    assert resp.status_code == 409
    assert resp.json()["detail"]["error_code"] == "DOCK_HAS_ACTIVE_SLOTS"


def test_admin_cannot_delete_dock(api, wh, dock, admin_h):
    resp = api.delete(f"/api/docks/{dock.id}", headers=admin_h)
    assert resp.status_code == 403
