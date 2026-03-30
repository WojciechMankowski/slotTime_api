"""Tests for /api/warehouses endpoints."""


# ---------------------------------------------------------------------------
# GET /api/warehouses
# ---------------------------------------------------------------------------

def test_superadmin_sees_all_warehouses(api, db, wh, wh2, superadmin_h):
    resp = api.get("/api/warehouses", headers=superadmin_h)
    assert resp.status_code == 200
    aliases = [w["alias"] for w in resp.json()]
    assert "TWH" in aliases
    assert "SWH" in aliases


def test_admin_sees_only_own_warehouse(api, wh, wh2, admin_h):
    resp = api.get("/api/warehouses", headers=admin_h)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["alias"] == "TWH"


def test_unauthenticated_list_denied(api):
    resp = api.get("/api/warehouses")
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# POST /api/warehouses
# ---------------------------------------------------------------------------

def test_superadmin_creates_warehouse(api, superadmin_h):
    resp = api.post(
        "/api/warehouses",
        json={"name": "New WH", "alias": "NWH", "is_active": True},
        headers=superadmin_h,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["alias"] == "NWH"
    assert data["name"] == "New WH"


def test_create_warehouse_alias_conflict(api, wh, superadmin_h):
    resp = api.post(
        "/api/warehouses",
        json={"name": "Duplicate", "alias": "TWH", "is_active": True},
        headers=superadmin_h,
    )
    assert resp.status_code == 400
    assert resp.json()["detail"]["error_code"] == "ALIAS_TAKEN"


def test_admin_cannot_create_warehouse(api, wh, admin_h):
    resp = api.post(
        "/api/warehouses",
        json={"name": "X", "alias": "X", "is_active": True},
        headers=admin_h,
    )
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# PATCH /api/warehouses/{id}
# ---------------------------------------------------------------------------

def test_superadmin_updates_warehouse(api, wh, superadmin_h):
    resp = api.patch(
        f"/api/warehouses/{wh.id}",
        json={"name": "Updated Name"},
        headers=superadmin_h,
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Updated Name"


def test_update_warehouse_not_found(api, superadmin_h):
    resp = api.patch("/api/warehouses/9999", json={"name": "X"}, headers=superadmin_h)
    assert resp.status_code == 404
    assert resp.json()["detail"]["error_code"] == "WAREHOUSE_NOT_FOUND"


def test_update_warehouse_alias_conflict(api, db, wh, wh2, superadmin_h):
    # Try to rename wh to wh2's alias
    resp = api.patch(
        f"/api/warehouses/{wh.id}",
        json={"alias": "SWH"},
        headers=superadmin_h,
    )
    assert resp.status_code == 400
    assert resp.json()["detail"]["error_code"] == "ALIAS_TAKEN"


# ---------------------------------------------------------------------------
# DELETE /api/warehouses/{id}
# ---------------------------------------------------------------------------

def test_superadmin_deletes_empty_warehouse(api, db, superadmin_h):
    from app import models

    empty_wh = models.Warehouse(name="Empty", alias="EMP", is_active=True)
    db.add(empty_wh)
    db.commit()
    db.refresh(empty_wh)

    resp = api.delete(f"/api/warehouses/{empty_wh.id}", headers=superadmin_h)
    assert resp.status_code == 204


def test_delete_warehouse_not_found(api, superadmin_h):
    resp = api.delete("/api/warehouses/9999", headers=superadmin_h)
    assert resp.status_code == 404
    assert resp.json()["detail"]["error_code"] == "WAREHOUSE_NOT_FOUND"


def test_delete_warehouse_with_company_blocked(api, wh, company, superadmin_h):
    """Cannot delete warehouse that has companies."""
    resp = api.delete(f"/api/warehouses/{wh.id}", headers=superadmin_h)
    assert resp.status_code == 400
    assert resp.json()["detail"]["error_code"] == "WAREHOUSE_HAS_DEPENDENCIES"


def test_delete_warehouse_with_dock_blocked(api, wh, dock, superadmin_h):
    """Cannot delete warehouse that has docks."""
    resp = api.delete(f"/api/warehouses/{wh.id}", headers=superadmin_h)
    assert resp.status_code == 400
    assert resp.json()["detail"]["error_code"] == "WAREHOUSE_HAS_DEPENDENCIES"


def test_admin_cannot_delete_warehouse(api, wh, admin_h):
    resp = api.delete(f"/api/warehouses/{wh.id}", headers=admin_h)
    assert resp.status_code == 403
