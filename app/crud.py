"""
CRUD utilities — operacje na danych przez Supabase SDK (PostgREST).
DDL tabel przez pg8000.native.
"""
from __future__ import annotations

import ssl as ssl_module
from datetime import date, datetime
from urllib.parse import unquote

import pg8000.native
from supabase import Client

from .config import settings
from .enums import Role, SlotStatus, SlotType
from .security import get_password_hash


# ---------------------------------------------------------------------------
# pg8000 helpers
# ---------------------------------------------------------------------------

def _parse_db_url(url: str) -> dict:
    """
    Parsuje DATABASE_URL do słownika parametrów pg8000.
    Obsługuje schematy: postgresql://, postgresql+pg8000://, postgres://.
    """
    raw = url.strip()
    # strip driver spec
    for prefix in ("postgresql+pg8000://", "postgresql://", "postgres://"):
        if raw.startswith(prefix):
            raw = raw[len(prefix):]
            break

    at = raw.rfind("@")
    credentials = raw[:at]
    host_db = raw[at + 1:]

    colon = credentials.index(":")
    user = credentials[:colon]
    password = unquote(credentials[colon + 1:])

    slash = host_db.index("/")
    host_port = host_db[:slash]
    database = host_db[slash + 1:].split("?")[0]

    if ":" in host_port:
        host, port_str = host_port.rsplit(":", 1)
        port = int(port_str)
    else:
        host = host_port
        port = 5432

    return {"host": host, "user": user, "password": password, "database": database, "port": port}


def _pg_conn() -> pg8000.native.Connection:
    params = _parse_db_url(settings.DATABASE_URL)
    ctx = ssl_module.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl_module.CERT_NONE
    return pg8000.native.Connection(
        host=params["host"],
        user=params["user"],
        password=params["password"],
        database=params["database"],
        port=params["port"],
        ssl_context=ctx,
    )


# ---------------------------------------------------------------------------
# Zarządzanie tabelami (DDL przez pg8000)
# ---------------------------------------------------------------------------

_DDL_CREATE = """
CREATE TABLE IF NOT EXISTS warehouses (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    alias TEXT NOT NULL UNIQUE,
    location TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    logo_path TEXT
);

CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    alias TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE(warehouse_id, alias)
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    alias TEXT NOT NULL,
    role TEXT NOT NULL,
    warehouse_id INTEGER REFERENCES warehouses(id),
    company_id INTEGER REFERENCES companies(id)
);

CREATE TABLE IF NOT EXISTS docks (
    id SERIAL PRIMARY KEY,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    alias TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE(warehouse_id, alias)
);

CREATE TABLE IF NOT EXISTS slots (
    id SERIAL PRIMARY KEY,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    dock_id INTEGER REFERENCES docks(id),
    start_dt TIMESTAMP NOT NULL,
    end_dt TIMESTAMP NOT NULL,
    slot_type TEXT NOT NULL,
    original_slot_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'AVAILABLE',
    previous_status TEXT,
    reserved_by_user_id INTEGER REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS slot_notices (
    id SERIAL PRIMARY KEY,
    slot_id INTEGER NOT NULL UNIQUE REFERENCES slots(id) ON DELETE CASCADE,
    numer_zlecenia TEXT NOT NULL,
    referencja TEXT NOT NULL,
    rejestracja_auta TEXT NOT NULL,
    rejestracja_naczepy TEXT NOT NULL,
    ilosc_palet INTEGER NOT NULL,
    kierowca_imie_nazwisko TEXT,
    kierowca_tel TEXT,
    uwagi TEXT
);

CREATE TABLE IF NOT EXISTS day_capacities (
    id SERIAL PRIMARY KEY,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    slot_type TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    UNIQUE(warehouse_id, date, slot_type)
);

CREATE TABLE IF NOT EXISTS slot_templates (
    id SERIAL PRIMARY KEY,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_hour INTEGER NOT NULL DEFAULT 6,
    end_hour INTEGER NOT NULL DEFAULT 18,
    slot_minutes INTEGER NOT NULL DEFAULT 30,
    slot_type TEXT NOT NULL DEFAULT 'ANY',
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);
"""

_DDL_DROP = """
DROP TABLE IF EXISTS slot_notices CASCADE;
DROP TABLE IF EXISTS slots CASCADE;
DROP TABLE IF EXISTS slot_templates CASCADE;
DROP TABLE IF EXISTS day_capacities CASCADE;
DROP TABLE IF EXISTS docks CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE;
"""


def create_tables() -> None:
    conn = _pg_conn()
    for stmt in _DDL_CREATE.split(";"):
        stmt = stmt.strip()
        if stmt:
            conn.run(stmt)
    conn.close()


def drop_tables() -> None:
    conn = _pg_conn()
    for stmt in _DDL_DROP.split(";"):
        stmt = stmt.strip()
        if stmt:
            conn.run(stmt)
    conn.close()


def refresh_tables() -> None:
    drop_tables()
    create_tables()


def get_table_names() -> list[str]:
    conn = _pg_conn()
    rows = conn.run("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")
    conn.close()
    return [r[0] for r in rows]


def get_table_counts() -> dict[str, int]:
    conn = _pg_conn()
    rows = conn.run("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")
    tables = [r[0] for r in rows]
    counts = {}
    for table in tables:
        cnt = conn.run(f"SELECT COUNT(*) FROM {table}")
        counts[table] = cnt[0][0]
    conn.close()
    return counts


# ---------------------------------------------------------------------------
# Warehouses
# ---------------------------------------------------------------------------

def get_warehouses(supa: Client, *, active_only: bool = False) -> list[dict]:
    q = supa.table("warehouses").select("*")
    if active_only:
        q = q.eq("is_active", True)
    return q.order("id").execute().data


def get_warehouse(supa: Client, warehouse_id: int) -> dict | None:
    rows = supa.table("warehouses").select("*").eq("id", warehouse_id).execute().data
    return rows[0] if rows else None


def get_warehouse_by_alias(supa: Client, alias: str) -> dict | None:
    rows = supa.table("warehouses").select("*").eq("alias", alias).execute().data
    return rows[0] if rows else None


def create_warehouse(
    supa: Client,
    *,
    name: str,
    alias: str,
    location: str | None = None,
    is_active: bool = True,
    logo_path: str | None = None,
) -> dict:
    rows = supa.table("warehouses").insert({
        "name": name,
        "alias": alias,
        "location": location,
        "is_active": is_active,
        "logo_path": logo_path,
    }).execute().data
    return rows[0]


# ---------------------------------------------------------------------------
# Companies
# ---------------------------------------------------------------------------

def get_companies(
    supa: Client,
    *,
    warehouse_id: int | None = None,
    active_only: bool = False,
) -> list[dict]:
    q = supa.table("companies").select("*")
    if warehouse_id is not None:
        q = q.eq("warehouse_id", warehouse_id)
    if active_only:
        q = q.eq("is_active", True)
    return q.order("id").execute().data


def get_company(supa: Client, company_id: int) -> dict | None:
    rows = supa.table("companies").select("*").eq("id", company_id).execute().data
    return rows[0] if rows else None


def get_company_by_alias(supa: Client, warehouse_id: int, alias: str) -> dict | None:
    rows = (
        supa.table("companies").select("*")
        .eq("warehouse_id", warehouse_id)
        .eq("alias", alias)
        .execute().data
    )
    return rows[0] if rows else None


def create_company(
    supa: Client,
    *,
    warehouse_id: int,
    name: str,
    alias: str,
    is_active: bool = True,
) -> dict:
    rows = supa.table("companies").insert({
        "warehouse_id": warehouse_id,
        "name": name,
        "alias": alias,
        "is_active": is_active,
    }).execute().data
    return rows[0]


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

def get_users(
    supa: Client,
    *,
    warehouse_id: int | None = None,
    company_id: int | None = None,
    role: Role | None = None,
) -> list[dict]:
    q = supa.table("users").select("*")
    if warehouse_id is not None:
        q = q.eq("warehouse_id", warehouse_id)
    if company_id is not None:
        q = q.eq("company_id", company_id)
    if role is not None:
        q = q.eq("role", role.value)
    return q.order("id").execute().data


def get_user(supa: Client, user_id: int) -> dict | None:
    rows = supa.table("users").select("*").eq("id", user_id).execute().data
    return rows[0] if rows else None


def get_user_by_username(supa: Client, username: str) -> dict | None:
    rows = supa.table("users").select("*").eq("username", username).execute().data
    return rows[0] if rows else None


def create_user(
    supa: Client,
    *,
    username: str,
    password: str,
    alias: str,
    role: Role,
    email: str | None = None,
    warehouse_id: int | None = None,
    company_id: int | None = None,
) -> dict:
    rows = supa.table("users").insert({
        "username": username,
        "email": email,
        "password_hash": get_password_hash(password),
        "alias": alias,
        "role": role.value,
        "warehouse_id": warehouse_id,
        "company_id": company_id,
    }).execute().data
    return rows[0]


# ---------------------------------------------------------------------------
# Docks
# ---------------------------------------------------------------------------

def get_docks(
    supa: Client,
    *,
    warehouse_id: int | None = None,
    active_only: bool = False,
) -> list[dict]:
    q = supa.table("docks").select("*")
    if warehouse_id is not None:
        q = q.eq("warehouse_id", warehouse_id)
    if active_only:
        q = q.eq("is_active", True)
    return q.order("id").execute().data


def get_dock(supa: Client, dock_id: int) -> dict | None:
    rows = supa.table("docks").select("*").eq("id", dock_id).execute().data
    return rows[0] if rows else None


def create_dock(
    supa: Client,
    *,
    warehouse_id: int,
    name: str,
    alias: str,
    is_active: bool = True,
) -> dict:
    rows = supa.table("docks").insert({
        "warehouse_id": warehouse_id,
        "name": name,
        "alias": alias,
        "is_active": is_active,
    }).execute().data
    return rows[0]


# ---------------------------------------------------------------------------
# Slots
# ---------------------------------------------------------------------------

def get_slots(
    supa: Client,
    *,
    warehouse_id: int | None = None,
    dock_id: int | None = None,
    status: SlotStatus | None = None,
    slot_type: SlotType | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    reserved_by_user_id: int | None = None,
) -> list[dict]:
    q = supa.table("slots").select("*")
    if warehouse_id is not None:
        q = q.eq("warehouse_id", warehouse_id)
    if dock_id is not None:
        q = q.eq("dock_id", dock_id)
    if status is not None:
        q = q.eq("status", status.value)
    if slot_type is not None:
        q = q.eq("slot_type", slot_type.value)
    if date_from is not None:
        q = q.gte("start_dt", date_from.isoformat())
    if date_to is not None:
        q = q.lte("start_dt", date_to.isoformat())
    if reserved_by_user_id is not None:
        q = q.eq("reserved_by_user_id", reserved_by_user_id)
    return q.order("start_dt").execute().data


def get_slot(supa: Client, slot_id: int) -> dict | None:
    rows = supa.table("slots").select("*").eq("id", slot_id).execute().data
    return rows[0] if rows else None


def create_slot(
    supa: Client,
    *,
    warehouse_id: int,
    start_dt: datetime,
    end_dt: datetime,
    slot_type: SlotType,
    dock_id: int | None = None,
    status: SlotStatus = SlotStatus.AVAILABLE,
) -> dict:
    rows = supa.table("slots").insert({
        "warehouse_id": warehouse_id,
        "dock_id": dock_id,
        "start_dt": start_dt.isoformat(),
        "end_dt": end_dt.isoformat(),
        "slot_type": slot_type.value,
        "original_slot_type": slot_type.value,
        "status": status.value,
        "reserved_by_user_id": None,
    }).execute().data
    return rows[0]


# ---------------------------------------------------------------------------
# SlotNotices
# ---------------------------------------------------------------------------

def get_slot_notice(supa: Client, slot_id: int) -> dict | None:
    rows = supa.table("slot_notices").select("*").eq("slot_id", slot_id).execute().data
    return rows[0] if rows else None


def create_slot_notice(
    supa: Client,
    *,
    slot_id: int,
    numer_zlecenia: str,
    referencja: str,
    rejestracja_auta: str,
    rejestracja_naczepy: str,
    ilosc_palet: int,
    kierowca_imie_nazwisko: str | None = None,
    kierowca_tel: str | None = None,
    uwagi: str | None = None,
) -> dict:
    rows = supa.table("slot_notices").insert({
        "slot_id": slot_id,
        "numer_zlecenia": numer_zlecenia,
        "referencja": referencja,
        "rejestracja_auta": rejestracja_auta,
        "rejestracja_naczepy": rejestracja_naczepy,
        "ilosc_palet": ilosc_palet,
        "kierowca_imie_nazwisko": kierowca_imie_nazwisko,
        "kierowca_tel": kierowca_tel,
        "uwagi": uwagi,
    }).execute().data
    return rows[0]


# ---------------------------------------------------------------------------
# DayCapacities
# ---------------------------------------------------------------------------

def get_day_capacities(
    supa: Client,
    *,
    warehouse_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    slot_type: SlotType | None = None,
) -> list[dict]:
    q = supa.table("day_capacities").select("*")
    if warehouse_id is not None:
        q = q.eq("warehouse_id", warehouse_id)
    if date_from is not None:
        q = q.gte("date", date_from.isoformat())
    if date_to is not None:
        q = q.lte("date", date_to.isoformat())
    if slot_type is not None:
        q = q.eq("slot_type", slot_type.value)
    return q.order("date").execute().data


def get_day_capacity(
    supa: Client, warehouse_id: int, cap_date: date, slot_type: SlotType
) -> dict | None:
    rows = (
        supa.table("day_capacities").select("*")
        .eq("warehouse_id", warehouse_id)
        .eq("date", cap_date.isoformat())
        .eq("slot_type", slot_type.value)
        .execute().data
    )
    return rows[0] if rows else None


def create_day_capacity(
    supa: Client,
    *,
    warehouse_id: int,
    cap_date: date,
    slot_type: SlotType,
    capacity: int,
) -> dict:
    rows = supa.table("day_capacities").insert({
        "warehouse_id": warehouse_id,
        "date": cap_date.isoformat(),
        "slot_type": slot_type.value,
        "capacity": capacity,
    }).execute().data
    return rows[0]


# ---------------------------------------------------------------------------
# SlotTemplates
# ---------------------------------------------------------------------------

def get_slot_templates(
    supa: Client,
    *,
    warehouse_id: int | None = None,
    active_only: bool = False,
) -> list[dict]:
    q = supa.table("slot_templates").select("*")
    if warehouse_id is not None:
        q = q.eq("warehouse_id", warehouse_id)
    if active_only:
        q = q.eq("is_active", True)
    return q.order("id").execute().data


def get_slot_template(supa: Client, template_id: int) -> dict | None:
    rows = supa.table("slot_templates").select("*").eq("id", template_id).execute().data
    return rows[0] if rows else None


def create_slot_template(
    supa: Client,
    *,
    warehouse_id: int,
    name: str,
    start_hour: int,
    end_hour: int,
    slot_minutes: int,
    slot_type: SlotType,
    is_active: bool = True,
) -> dict:
    rows = supa.table("slot_templates").insert({
        "warehouse_id": warehouse_id,
        "name": name,
        "start_hour": start_hour,
        "end_hour": end_hour,
        "slot_minutes": slot_minutes,
        "slot_type": slot_type.value,
        "is_active": is_active,
    }).execute().data
    return rows[0]
