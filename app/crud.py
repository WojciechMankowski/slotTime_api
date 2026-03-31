
"""
CRUD utilities — funkcje pobierania danych, tworzenia rekordów oraz zarządzania tabelami.
Każda funkcja przyjmuje sesję SQLAlchemy i opcjonalne filtry.
"""
from __future__ import annotations

from datetime import date, datetime

from sqlalchemy.orm import Session

from .db import Base, engine
from . import models
from .security import get_password_hash


# ---------------------------------------------------------------------------
# Zarządzanie tabelami
# ---------------------------------------------------------------------------

def create_tables() -> None:
    """Tworzy wszystkie tabele, jeśli jeszcze nie istnieją."""
    Base.metadata.create_all(bind=engine)


def drop_tables() -> None:
    """Usuwa wszystkie tabele (OSTROŻNIE — nieodwracalne)."""
    Base.metadata.drop_all(bind=engine)


def refresh_tables() -> None:
    """Usuwa i odtwarza wszystkie tabele (reset schematu)."""
    drop_tables()
    create_tables()


# ---------------------------------------------------------------------------
# Warehouses
# ---------------------------------------------------------------------------

def get_warehouses(db: Session, *, active_only: bool = False) -> list[models.Warehouse]:
    q = db.query(models.Warehouse)
    if active_only:
        q = q.filter(models.Warehouse.is_active.is_(True))
    return q.order_by(models.Warehouse.id).all()


def get_warehouse(db: Session, warehouse_id: int) -> models.Warehouse | None:
    return db.query(models.Warehouse).filter(models.Warehouse.id == warehouse_id).first()


def get_warehouse_by_alias(db: Session, alias: str) -> models.Warehouse | None:
    return db.query(models.Warehouse).filter(models.Warehouse.alias == alias).first()


def create_warehouse(
    db: Session,
    *,
    name: str,
    alias: str,
    location: str | None = None,
    is_active: bool = True,
    logo_path: str | None = None,
) -> models.Warehouse:
    obj = models.Warehouse(
        name=name, alias=alias, location=location,
        is_active=is_active, logo_path=logo_path,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


# ---------------------------------------------------------------------------
# Companies
# ---------------------------------------------------------------------------

def get_companies(
    db: Session,
    *,
    warehouse_id: int | None = None,
    active_only: bool = False,
) -> list[models.Company]:
    q = db.query(models.Company)
    if warehouse_id is not None:
        q = q.filter(models.Company.warehouse_id == warehouse_id)
    if active_only:
        q = q.filter(models.Company.is_active.is_(True))
    return q.order_by(models.Company.id).all()


def get_company(db: Session, company_id: int) -> models.Company | None:
    return db.query(models.Company).filter(models.Company.id == company_id).first()


def get_company_by_alias(
    db: Session, warehouse_id: int, alias: str
) -> models.Company | None:
    return (
        db.query(models.Company)
        .filter(
            models.Company.warehouse_id == warehouse_id,
            models.Company.alias == alias,
        )
        .first()
    )


def create_company(
    db: Session,
    *,
    warehouse_id: int,
    name: str,
    alias: str,
    is_active: bool = True,
) -> models.Company:
    obj = models.Company(
        warehouse_id=warehouse_id, name=name, alias=alias, is_active=is_active,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

def get_users(
    db: Session,
    *,
    warehouse_id: int | None = None,
    company_id: int | None = None,
    role: models.Role | None = None,
) -> list[models.User]:
    q = db.query(models.User)
    if warehouse_id is not None:
        q = q.filter(models.User.warehouse_id == warehouse_id)
    if company_id is not None:
        q = q.filter(models.User.company_id == company_id)
    if role is not None:
        q = q.filter(models.User.role == role)
    return q.order_by(models.User.id).all()


def get_user(db: Session, user_id: int) -> models.User | None:
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_username(db: Session, username: str) -> models.User | None:
    return db.query(models.User).filter(models.User.username == username).first()


def create_user(
    db: Session,
    *,
    username: str,
    password: str,
    alias: str,
    role: models.Role,
    email: str | None = None,
    warehouse_id: int | None = None,
    company_id: int | None = None,
) -> models.User:
    obj = models.User(
        username=username,
        email=email,
        password_hash=get_password_hash(password),
        alias=alias,
        role=role,
        warehouse_id=warehouse_id,
        company_id=company_id,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


# ---------------------------------------------------------------------------
# Docks
# ---------------------------------------------------------------------------

def get_docks(
    db: Session,
    *,
    warehouse_id: int | None = None,
    active_only: bool = False,
) -> list[models.Dock]:
    q = db.query(models.Dock)
    if warehouse_id is not None:
        q = q.filter(models.Dock.warehouse_id == warehouse_id)
    if active_only:
        q = q.filter(models.Dock.is_active.is_(True))
    return q.order_by(models.Dock.id).all()


def get_dock(db: Session, dock_id: int) -> models.Dock | None:
    return db.query(models.Dock).filter(models.Dock.id == dock_id).first()


def create_dock(
    db: Session,
    *,
    warehouse_id: int,
    name: str,
    alias: str,
    is_active: bool = True,
) -> models.Dock:
    obj = models.Dock(
        warehouse_id=warehouse_id, name=name, alias=alias, is_active=is_active,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


# ---------------------------------------------------------------------------
# Slots
# ---------------------------------------------------------------------------

def get_slots(
    db: Session,
    *,
    warehouse_id: int | None = None,
    dock_id: int | None = None,
    status: models.SlotStatus | None = None,
    slot_type: models.SlotType | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    reserved_by_user_id: int | None = None,
) -> list[models.Slot]:
    q = db.query(models.Slot)
    if warehouse_id is not None:
        q = q.filter(models.Slot.warehouse_id == warehouse_id)
    if dock_id is not None:
        q = q.filter(models.Slot.dock_id == dock_id)
    if status is not None:
        q = q.filter(models.Slot.status == status)
    if slot_type is not None:
        q = q.filter(models.Slot.slot_type == slot_type)
    if date_from is not None:
        q = q.filter(models.Slot.start_dt >= date_from)
    if date_to is not None:
        q = q.filter(models.Slot.start_dt <= date_to)
    if reserved_by_user_id is not None:
        q = q.filter(models.Slot.reserved_by_user_id == reserved_by_user_id)
    return q.order_by(models.Slot.start_dt).all()


def get_slot(db: Session, slot_id: int) -> models.Slot | None:
    return db.query(models.Slot).filter(models.Slot.id == slot_id).first()


def create_slot(
    db: Session,
    *,
    warehouse_id: int,
    start_dt: datetime,
    end_dt: datetime,
    slot_type: models.SlotType,
    dock_id: int | None = None,
    status: models.SlotStatus = models.SlotStatus.AVAILABLE,
) -> models.Slot:
    obj = models.Slot(
        warehouse_id=warehouse_id,
        dock_id=dock_id,
        start_dt=start_dt,
        end_dt=end_dt,
        slot_type=slot_type,
        original_slot_type=slot_type,
        status=status,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


# ---------------------------------------------------------------------------
# SlotNotices
# ---------------------------------------------------------------------------

def get_slot_notices(
    db: Session,
    *,
    slot_id: int | None = None,
) -> list[models.SlotNotice]:
    q = db.query(models.SlotNotice)
    if slot_id is not None:
        q = q.filter(models.SlotNotice.slot_id == slot_id)
    return q.order_by(models.SlotNotice.id).all()


def get_slot_notice(db: Session, slot_id: int) -> models.SlotNotice | None:
    return (
        db.query(models.SlotNotice)
        .filter(models.SlotNotice.slot_id == slot_id)
        .first()
    )


def create_slot_notice(
    db: Session,
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
) -> models.SlotNotice:
    obj = models.SlotNotice(
        slot_id=slot_id,
        numer_zlecenia=numer_zlecenia,
        referencja=referencja,
        rejestracja_auta=rejestracja_auta,
        rejestracja_naczepy=rejestracja_naczepy,
        ilosc_palet=ilosc_palet,
        kierowca_imie_nazwisko=kierowca_imie_nazwisko,
        kierowca_tel=kierowca_tel,
        uwagi=uwagi,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


# ---------------------------------------------------------------------------
# DayCapacities
# ---------------------------------------------------------------------------

def get_day_capacities(
    db: Session,
    *,
    warehouse_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    slot_type: models.SlotType | None = None,
) -> list[models.DayCapacity]:
    q = db.query(models.DayCapacity)
    if warehouse_id is not None:
        q = q.filter(models.DayCapacity.warehouse_id == warehouse_id)
    if date_from is not None:
        q = q.filter(models.DayCapacity.date >= date_from)
    if date_to is not None:
        q = q.filter(models.DayCapacity.date <= date_to)
    if slot_type is not None:
        q = q.filter(models.DayCapacity.slot_type == slot_type)
    return q.order_by(models.DayCapacity.date).all()


def get_day_capacity(
    db: Session, warehouse_id: int, cap_date: date, slot_type: models.SlotType
) -> models.DayCapacity | None:
    return (
        db.query(models.DayCapacity)
        .filter(
            models.DayCapacity.warehouse_id == warehouse_id,
            models.DayCapacity.date == cap_date,
            models.DayCapacity.slot_type == slot_type,
        )
        .first()
    )


def create_day_capacity(
    db: Session,
    *,
    warehouse_id: int,
    cap_date: date,
    slot_type: models.SlotType,
    capacity: int,
) -> models.DayCapacity:
    obj = models.DayCapacity(
        warehouse_id=warehouse_id,
        date=cap_date,
        slot_type=slot_type,
        capacity=capacity,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


# ---------------------------------------------------------------------------
# SlotTemplates
# ---------------------------------------------------------------------------

def get_slot_templates(
    db: Session,
    *,
    warehouse_id: int | None = None,
    active_only: bool = False,
) -> list[models.SlotTemplate]:
    q = db.query(models.SlotTemplate)
    if warehouse_id is not None:
        q = q.filter(models.SlotTemplate.warehouse_id == warehouse_id)
    if active_only:
        q = q.filter(models.SlotTemplate.is_active.is_(True))
    return q.order_by(models.SlotTemplate.id).all()


def get_slot_template(db: Session, template_id: int) -> models.SlotTemplate | None:
    return (
        db.query(models.SlotTemplate)
        .filter(models.SlotTemplate.id == template_id)
        .first()
    )


def create_slot_template(
    db: Session,
    *,
    warehouse_id: int,
    name: str,
    start_hour: int,
    end_hour: int,
    slot_minutes: int,
    slot_type: models.SlotType,
    is_active: bool = True,
) -> models.SlotTemplate:
    obj = models.SlotTemplate(
        warehouse_id=warehouse_id,
        name=name,
        start_hour=start_hour,
        end_hour=end_hour,
        slot_minutes=slot_minutes,
        slot_type=slot_type,
        is_active=is_active,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj
