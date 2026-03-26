from __future__ import annotations
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey, UniqueConstraint, Enum, Date
)
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from .db import Base

class Role(str, enum.Enum):
    superadmin = "superadmin"
    admin = "admin"
    client = "client"

class SlotType(str, enum.Enum):
    INBOUND = "INBOUND"
    OUTBOUND = "OUTBOUND"
    ANY = "ANY"

class SlotStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    BOOKED = "BOOKED"
    APPROVED_WAITING_DETAILS = "APPROVED_WAITING_DETAILS"
    RESERVED_CONFIRMED = "RESERVED_CONFIRMED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    CANCEL_PENDING = "CANCEL_PENDING"

class Warehouse(Base):
    __tablename__ = "warehouses"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    alias = Column(String, nullable=False, unique=True, index=True)
    location = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    logo_path = Column(String, nullable=True)

    companies = relationship("Company", back_populates="warehouse", cascade="all,delete-orphan")
    docks = relationship("Dock", back_populates="warehouse", cascade="all,delete-orphan")
    slots = relationship("Slot", back_populates="warehouse", cascade="all,delete-orphan")
    day_caps = relationship("DayCapacity", back_populates="warehouse", cascade="all,delete-orphan")
    templates = relationship("SlotTemplate", back_populates="warehouse", cascade="all,delete-orphan")

class Company(Base):
    __tablename__ = "companies"
    __table_args__ = (UniqueConstraint("warehouse_id", "alias", name="uq_company_alias_per_wh"),)
    id = Column(Integer, primary_key=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    alias = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    warehouse = relationship("Warehouse", back_populates="companies")
    users = relationship("User", back_populates="company")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, nullable=False, unique=True, index=True)
    password_hash = Column(String, nullable=False)
    alias = Column(String, nullable=False)
    role = Column(Enum(Role), nullable=False)

    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)

    warehouse = relationship("Warehouse")
    company = relationship("Company", back_populates="users")

class Dock(Base):
    __tablename__ = "docks"
    __table_args__ = (UniqueConstraint("warehouse_id", "alias", name="uq_dock_alias_per_wh"),)
    id = Column(Integer, primary_key=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    alias = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    warehouse = relationship("Warehouse", back_populates="docks")
    slots = relationship("Slot", back_populates="dock")

class Slot(Base):
    __tablename__ = "slots"
    id = Column(Integer, primary_key=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False, index=True)
    dock_id = Column(Integer, ForeignKey("docks.id"), nullable=True, index=True)

    start_dt = Column(DateTime, nullable=False, index=True)
    end_dt = Column(DateTime, nullable=False, index=True)

    slot_type = Column(Enum(SlotType), nullable=False)
    original_slot_type = Column(Enum(SlotType), nullable=False)

    status = Column(Enum(SlotStatus), nullable=False, default=SlotStatus.AVAILABLE)
    previous_status = Column(Enum(SlotStatus), nullable=True)
    reserved_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    warehouse = relationship("Warehouse", back_populates="slots")
    dock = relationship("Dock", back_populates="slots")
    reserved_by = relationship("User")
    notice = relationship("SlotNotice", back_populates="slot", uselist=False, cascade="all,delete-orphan")

class SlotNotice(Base):
    __tablename__ = "slot_notices"
    id = Column(Integer, primary_key=True)
    slot_id = Column(Integer, ForeignKey("slots.id"), nullable=False, unique=True, index=True)

    numer_zlecenia = Column(String, nullable=False)
    referencja = Column(String, nullable=False)
    rejestracja_auta = Column(String, nullable=False)
    rejestracja_naczepy = Column(String, nullable=False)
    ilosc_palet = Column(Integer, nullable=False)

    kierowca_imie_nazwisko = Column(String, nullable=True)
    kierowca_tel = Column(String, nullable=True)
    uwagi = Column(String, nullable=True)

    slot = relationship("Slot", back_populates="notice")

class DayCapacity(Base):
    __tablename__ = "day_capacities"
    __table_args__ = (UniqueConstraint("warehouse_id", "date", "slot_type", name="uq_daycap"),)
    id = Column(Integer, primary_key=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    slot_type = Column(Enum(SlotType), nullable=False)
    capacity = Column(Integer, nullable=False)

    warehouse = relationship("Warehouse", back_populates="day_caps")

class SlotTemplate(Base):
    __tablename__ = "slot_templates"
    id = Column(Integer, primary_key=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    # simple template: start hour, end hour, slot duration minutes, type
    start_hour = Column(Integer, nullable=False, default=6)
    end_hour = Column(Integer, nullable=False, default=18)
    slot_minutes = Column(Integer, nullable=False, default=30)
    slot_type = Column(Enum(SlotType), nullable=False, default=SlotType.ANY)
    is_active = Column(Boolean, default=True, nullable=False)

    warehouse = relationship("Warehouse", back_populates="templates")
