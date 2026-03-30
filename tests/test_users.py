"""Tests for /api/users endpoints."""


# ---------------------------------------------------------------------------
# GET /api/users
# ---------------------------------------------------------------------------

def test_admin_lists_users_in_own_warehouse(api, wh, admin, client_user, admin_h):
    resp = api.get("/api/users", headers=admin_h)
    assert resp.status_code == 200
    usernames = [u["username"] for u in resp.json()]
    assert "admin" in usernames
    assert "client" in usernames


def test_superadmin_lists_all_users(api, wh, admin, client_user, superadmin, superadmin_h):
    resp = api.get("/api/users", headers=superadmin_h)
    assert resp.status_code == 200
    usernames = [u["username"] for u in resp.json()]
    assert "admin" in usernames
    assert "client" in usernames
    assert "superadmin" in usernames


def test_client_cannot_list_users(api, client_user, client_h):
    resp = api.get("/api/users", headers=client_h)
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# POST /api/users
# ---------------------------------------------------------------------------

def test_admin_creates_client_user(api, wh, company, admin_h):
    resp = api.post(
        "/api/users",
        json={
            "username": "newclient",
            "password": "pass",
            "alias": "NC",
            "role": "client",
            "company_id": company.id,
        },
        headers=admin_h,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["username"] == "newclient"
    assert data["role"] == "client"


def test_admin_creates_admin_user(api, wh, admin_h):
    resp = api.post(
        "/api/users",
        json={
            "username": "newadmin",
            "password": "pass",
            "alias": "NA",
            "role": "admin",
        },
        headers=admin_h,
    )
    assert resp.status_code == 200
    assert resp.json()["role"] == "admin"


def test_superadmin_creates_admin_for_warehouse(api, wh, superadmin_h):
    resp = api.post(
        "/api/users",
        json={
            "username": "whadmin",
            "password": "pass",
            "alias": "WA",
            "role": "admin",
            "warehouse_id": wh.id,
        },
        headers=superadmin_h,
    )
    assert resp.status_code == 200
    assert resp.json()["warehouse_id"] == wh.id


def test_superadmin_cannot_create_client(api, superadmin_h):
    """Superadmin may only create admin users."""
    resp = api.post(
        "/api/users",
        json={"username": "x", "password": "pass", "alias": "X", "role": "client"},
        headers=superadmin_h,
    )
    assert resp.status_code == 400
    assert resp.json()["detail"]["error_code"] == "ROLE_NOT_ALLOWED"


def test_create_user_username_taken(api, wh, admin, admin_h):
    resp = api.post(
        "/api/users",
        json={"username": "admin", "password": "pass", "alias": "X", "role": "admin"},
        headers=admin_h,
    )
    assert resp.status_code == 400
    assert resp.json()["detail"]["error_code"] == "USERNAME_TAKEN"


def test_admin_cannot_create_client_in_foreign_warehouse(api, db, wh, wh2, admin_h):
    from app import models

    foreign_company = models.Company(
        warehouse_id=wh2.id, name="Foreign", alias="foreign", is_active=True
    )
    db.add(foreign_company)
    db.commit()
    db.refresh(foreign_company)

    resp = api.post(
        "/api/users",
        json={
            "username": "outsider",
            "password": "pass",
            "alias": "OUT",
            "role": "client",
            "company_id": foreign_company.id,
        },
        headers=admin_h,
    )
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# PATCH /api/users/{id}
# ---------------------------------------------------------------------------

def test_admin_updates_user_alias(api, wh, client_user, admin_h):
    resp = api.patch(
        f"/api/users/{client_user.id}",
        json={"alias": "UPDATED"},
        headers=admin_h,
    )
    assert resp.status_code == 200
    assert resp.json()["alias"] == "UPDATED"


def test_patch_user_not_found(api, admin_h):
    resp = api.patch("/api/users/9999", json={"alias": "X"}, headers=admin_h)
    assert resp.status_code == 404
    assert resp.json()["detail"]["error_code"] == "USER_NOT_FOUND"


def test_patch_username_conflict(api, wh, admin, client_user, admin_h):
    resp = api.patch(
        f"/api/users/{client_user.id}",
        json={"username": "admin"},  # already taken
        headers=admin_h,
    )
    assert resp.status_code == 400
    assert resp.json()["detail"]["error_code"] == "USERNAME_TAKEN"


# ---------------------------------------------------------------------------
# DELETE /api/users/{id}
# ---------------------------------------------------------------------------

def test_superadmin_deletes_user(api, wh, admin, superadmin_h):
    resp = api.delete(f"/api/users/{admin.id}", headers=superadmin_h)
    assert resp.status_code == 204


def test_superadmin_cannot_delete_self(api, superadmin, superadmin_h):
    resp = api.delete(f"/api/users/{superadmin.id}", headers=superadmin_h)
    assert resp.status_code == 400
    assert resp.json()["detail"]["error_code"] == "CANNOT_DELETE_SELF"


def test_delete_user_not_found(api, superadmin_h):
    resp = api.delete("/api/users/9999", headers=superadmin_h)
    assert resp.status_code == 404
    assert resp.json()["detail"]["error_code"] == "USER_NOT_FOUND"


def test_admin_cannot_delete_user(api, wh, client_user, admin_h):
    resp = api.delete(f"/api/users/{client_user.id}", headers=admin_h)
    assert resp.status_code == 403
