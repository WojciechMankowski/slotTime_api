========================================================== FAILURES ==========================================================
______________________________________________ test_login_no_bearer_returns_401 ______________________________________________

api = <starlette.testclient.TestClient object at 0x00000213C0B12CF0>

    def test_login_no_bearer_returns_401(api):
        resp = api.get("/api/me")
>       assert resp.status_code == 403  # HTTPBearer returns 403 when no credentials
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
E       assert 401 == 403
E        +  where 401 = <Response [401 Unauthorized]>.status_code

tests\test_auth.py:47: AssertionError
_________________________________________________ test_admin_creates_company _________________________________________________

api = <starlette.testclient.TestClient object at 0x00000213C0B12360>, wh = <app.models.Warehouse object at 0x00000213C0DC8140>
admin_h = {'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzc0MzY0Njg3fQ.CJJ8vt7VJe3EqGV7DueI5WxyeegPDnIS4WIUzQZmTJs'}

    def test_admin_creates_company(api, wh, admin_h):
        resp = api.post(
            "/api/companies",
            json={"name": "Beta Ltd", "alias": "beta", "is_active": True},
            headers=admin_h,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["alias"] == "beta"
>       assert data["warehouse_id"] == wh.id
               ^^^^^^^^^^^^^^^^^^^^
E       KeyError: 'warehouse_id'

tests\test_companies.py:58: KeyError
__________________________________________________ test_admin_creates_dock ___________________________________________________

api = <starlette.testclient.TestClient object at 0x00000213C0B127A0>, wh = <app.models.Warehouse object at 0x00000213C0DA54D0>
admin_h = {'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzc0MzY0Njg4fQ.5lDEamsWDJQCWAKYyz6KCSmgaJNnYv4k5nAK5Y8s45w'}

    def test_admin_creates_dock(api, wh, admin_h):
        resp = api.post(
            "/api/docks",
            json={"name": "Dock B", "alias": "DB", "is_active": True},
            headers=admin_h,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["alias"] == "DB"
>       assert data["warehouse_id"] == wh.id
               ^^^^^^^^^^^^^^^^^^^^
E       KeyError: 'warehouse_id'

tests\test_docks.py:41: KeyError
________________________________________________ test_admin_filter_by_status _________________________________________________

api = <starlette.testclient.TestClient object at 0x00000213C0CC78A0>
db = <sqlalchemy.orm.session.Session object at 0x00000213C0DF8140>, wh = <app.models.Warehouse object at 0x00000213C0E66650>
admin_h = {'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzc0MzY0NjkwfQ.y2PMS97CHbjXoixK4uPn3zKVRxPOVMNg_tzpLEUGsiw'}

    def test_admin_filter_by_status(api, db, wh, admin_h):
        make_slot(db, wh.id, status=models.SlotStatus.AVAILABLE)
        make_slot(db, wh.id, status=models.SlotStatus.BOOKED)

        resp = api.get(
            "/api/slots",
            params={"date_from": "2025-06-01", "date_to": "2025-06-01", "status": "AVAILABLE"},
            headers=admin_h,
        )
        assert resp.status_code == 200
>       assert all(s["status"] == "AVAILABLE" for s in resp.json())
E       assert False
E        +  where False = all(<generator object test_admin_filter_by_status.<locals>.<genexpr> at 0x00000213C0BB6F60>)

tests\test_slots.py:35: AssertionError
______________________________________________ test_unauthenticated_list_denied ______________________________________________

api = <starlette.testclient.TestClient object at 0x00000213C0CC6690>

    def test_unauthenticated_list_denied(api):
        resp = api.get("/api/warehouses")
>       assert resp.status_code == 403
E       assert 401 == 403
E        +  where 401 = <Response [401 Unauthorized]>.status_code

tests\test_warehouses.py:26: AssertionError
================================================== short test summary info ===================================================
FAILED tests/test_auth.py::test_login_no_bearer_returns_401 - assert 401 == 403
FAILED tests/test_companies.py::test_admin_creates_company - KeyError: 'warehouse_id'
FAILED tests/test_docks.py::test_admin_creates_dock - KeyError: 'warehouse_id'
FAILED tests/test_slots.py::test_admin_filter_by_status - assert False
FAILED tests/test_warehouses.py::test_unauthenticated_list_denied - assert 401 == 403