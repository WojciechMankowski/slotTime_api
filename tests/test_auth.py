"""Tests for POST /api/login"""


def test_login_admin_success(api, admin):
    resp = api.post("/api/login", json={"username": "admin", "password": "pass"})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["role"] == "admin"


def test_login_superadmin_success(api, superadmin):
    resp = api.post("/api/login", json={"username": "superadmin", "password": "pass"})
    assert resp.status_code == 200
    assert resp.json()["role"] == "superadmin"


def test_login_client_success(api, client_user):
    resp = api.post("/api/login", json={"username": "client", "password": "pass"})
    assert resp.status_code == 200
    assert resp.json()["role"] == "client"


def test_login_wrong_password(api, admin):
    resp = api.post("/api/login", json={"username": "admin", "password": "WRONG"})
    assert resp.status_code == 401
    assert resp.json()["detail"]["error_code"] == "BAD_CREDENTIALS"


def test_login_unknown_user(api):
    resp = api.post("/api/login", json={"username": "nobody", "password": "pass"})
    assert resp.status_code == 401
    assert resp.json()["detail"]["error_code"] == "BAD_CREDENTIALS"


def test_login_inactive_company_blocked(api, db, company, client_user):
    company.is_active = False
    db.commit()

    resp = api.post("/api/login", json={"username": "client", "password": "pass"})
    assert resp.status_code == 403
    assert resp.json()["detail"]["error_code"] == "COMPANY_INACTIVE"


def test_login_no_bearer_returns_401(api):
    resp = api.get("/api/me")
    assert resp.status_code == 401
