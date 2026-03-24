"""
Shared test configuration and fixtures.

Run from the backend directory:
    pip install -r requirements-test.txt
    pytest tests/ -v
"""
import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db import Base, get_db
from app import models
from app.security import get_password_hash, create_access_token

# ---------------------------------------------------------------------------
# In-memory SQLite shared via StaticPool (all sessions see the same data)
# ---------------------------------------------------------------------------

engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def _override_get_db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


app.dependency_overrides[get_db] = _override_get_db


# ---------------------------------------------------------------------------
# Core fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def reset_db():
    """Re-create all tables before each test; drop them after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db(reset_db):
    """Session used by test code to seed / inspect data."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def api():
    """Synchronous TestClient for sending HTTP requests."""
    with TestClient(app) as c:
        yield c


# ---------------------------------------------------------------------------
# Model fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def wh(db):
    warehouse = models.Warehouse(name="Test Warehouse", alias="TWH", is_active=True)
    db.add(warehouse)
    db.commit()
    db.refresh(warehouse)
    return warehouse


@pytest.fixture
def wh2(db):
    warehouse = models.Warehouse(name="Second Warehouse", alias="SWH", is_active=True)
    db.add(warehouse)
    db.commit()
    db.refresh(warehouse)
    return warehouse


@pytest.fixture
def superadmin(db):
    u = models.User(
        username="superadmin",
        password_hash=get_password_hash("pass"),
        alias="SA",
        role=models.Role.superadmin,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@pytest.fixture
def admin(db, wh):
    u = models.User(
        username="admin",
        password_hash=get_password_hash("pass"),
        alias="ADM",
        role=models.Role.admin,
        warehouse_id=wh.id,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@pytest.fixture
def company(db, wh):
    c = models.Company(warehouse_id=wh.id, name="ACME Corp", alias="acme", is_active=True)
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@pytest.fixture
def client_user(db, company):
    u = models.User(
        username="client",
        password_hash=get_password_hash("pass"),
        alias="CLI",
        role=models.Role.client,
        company_id=company.id,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@pytest.fixture
def dock(db, wh):
    d = models.Dock(warehouse_id=wh.id, name="Dock A", alias="DA", is_active=True)
    db.add(d)
    db.commit()
    db.refresh(d)
    return d


# ---------------------------------------------------------------------------
# Auth header fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def superadmin_h(superadmin):
    token = create_access_token(user_id=superadmin.id, role="superadmin")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_h(admin):
    token = create_access_token(user_id=admin.id, role="admin")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def client_h(client_user):
    token = create_access_token(user_id=client_user.id, role="client")
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Slot factory helper
# ---------------------------------------------------------------------------

def make_slot(
    db,
    warehouse_id: int,
    status: models.SlotStatus = models.SlotStatus.AVAILABLE,
    slot_type: models.SlotType = models.SlotType.INBOUND,
    start: datetime = datetime(2025, 6, 1, 8, 0),
    end: datetime = datetime(2025, 6, 1, 9, 0),
    dock_id: int | None = None,
    reserved_by: int | None = None,
) -> models.Slot:
    slot = models.Slot(
        warehouse_id=warehouse_id,
        dock_id=dock_id,
        start_dt=start,
        end_dt=end,
        slot_type=slot_type,
        original_slot_type=slot_type,
        status=status,
        reserved_by_user_id=reserved_by,
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return slot
