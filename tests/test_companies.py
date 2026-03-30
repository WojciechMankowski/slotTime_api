"""Tests for /api/companies endpoints."""


# ---------------------------------------------------------------------------
# GET /api/companies
# ---------------------------------------------------------------------------

def test_admin_lists_companies(api, wh, company, admin_h):
    resp = api.get("/api/companies", params={"warehouse_id": wh.id}, headers=admin_h)
    assert resp.status_code == 200
    assert any(c["alias"] == "acme" for c in resp.json())


def test_client_sees_only_active_companies(api, db, wh, company, client_h):
    from app import models

    inactive = models.Company(warehouse_id=wh.id, name="Gone", alias="gone", is_active=False)
    db.add(inactive)
    db.commit()

    resp = api.get("/api/companies", headers=client_h)
    assert resp.status_code == 200
    aliases = [c["alias"] for c in resp.json()]
    assert "acme" in aliases
    assert "gone" not in aliases


def test_superadmin_needs_warehouse_id(api, wh, superadmin_h):
    """Superadmin without warehouse_id gets WAREHOUSE_CONTEXT_REQUIRED."""
    resp = api.get("/api/companies", headers=superadmin_h)
    assert resp.status_code == 400
    assert resp.json()["detail"]["error_code"] == "WAREHOUSE_CONTEXT_REQUIRED"


def test_superadmin_with_warehouse_id_lists_companies(api, wh, company, superadmin_h):
    resp = api.get(
        "/api/companies",
        params={"warehouse_id": wh.id},
        headers=superadmin_h,
    )
    assert resp.status_code == 200
    assert any(c["alias"] == "acme" for c in resp.json())


# ---------------------------------------------------------------------------
# POST /api/companies
# ---------------------------------------------------------------------------

def test_admin_creates_company(api, wh, admin_h):
    resp = api.post(
        "/api/companies",
        json={"name": "Beta Ltd", "alias": "beta", "is_active": True},
        headers=admin_h,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["alias"] == "beta"
    assert data["warehouse_id"] == wh.id


def test_create_company_auto_alias(api, wh, admin_h):
    """Alias is auto-generated when not provided."""
    resp = api.post(
        "/api/companies",
        json={"name": "Omega Inc", "is_active": True},
        headers=admin_h,
    )
    assert resp.status_code == 200
    assert resp.json()["alias"] != ""


def test_create_company_alias_conflict(api, wh, company, admin_h):
    resp = api.post(
        "/api/companies",
        json={"name": "Duplicate", "alias": "acme", "is_active": True},
        headers=admin_h,
    )
    assert resp.status_code == 400
    assert resp.json()["detail"]["error_code"] == "ALIAS_TAKEN"


def test_client_cannot_create_company(api, wh, client_h):
    resp = api.post(
        "/api/companies",
        json={"name": "X", "alias": "x", "is_active": True},
        headers=client_h,
    )
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# PATCH /api/companies/{id}
# ---------------------------------------------------------------------------

def test_admin_updates_company(api, wh, company, admin_h):
    resp = api.patch(
        f"/api/companies/{company.id}",
        json={"name": "ACME Updated", "is_active": False},
        headers=admin_h,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "ACME Updated"
    assert data["is_active"] is False


def test_update_company_not_found(api, wh, admin_h):
    resp = api.patch("/api/companies/9999", json={"name": "X"}, headers=admin_h)
    assert resp.status_code == 404
    assert resp.json()["detail"]["error_code"] == "COMPANY_NOT_FOUND"


# ---------------------------------------------------------------------------
# DELETE /api/companies/{id}
# ---------------------------------------------------------------------------

def test_superadmin_deletes_empty_company(api, db, wh, superadmin_h):
    from app import models

    c = models.Company(warehouse_id=wh.id, name="Empty Co", alias="emptyco", is_active=True)
    db.add(c)
    db.commit()
    db.refresh(c)

    resp = api.delete(f"/api/companies/{c.id}", headers=superadmin_h)
    assert resp.status_code == 204


def test_delete_company_not_found(api, superadmin_h):
    resp = api.delete("/api/companies/9999", headers=superadmin_h)
    assert resp.status_code == 404
    assert resp.json()["detail"]["error_code"] == "COMPANY_NOT_FOUND"


def test_delete_company_with_users_blocked(api, company, client_user, superadmin_h):
    """Cannot delete company that still has users."""
    resp = api.delete(f"/api/companies/{company.id}", headers=superadmin_h)
    assert resp.status_code == 409
    assert resp.json()["detail"]["error_code"] == "COMPANY_HAS_USERS"


def test_admin_cannot_delete_company(api, company, admin_h):
    resp = api.delete(f"/api/companies/{company.id}", headers=admin_h)
    assert resp.status_code == 403
