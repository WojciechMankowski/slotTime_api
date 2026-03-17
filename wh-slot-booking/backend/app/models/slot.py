from __future__ import annotations
from sqlalchemy import Column, Integer, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from ..db import Base

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
    reserved_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    warehouse = relationship("Warehouse", back_populates="slots")
    dock = relationship("Dock", back_populates="slots")
    reserved_by = relationship("User")
    notice = relationship("SlotNotice", back_populates="slot", uselist=False, cascade="all,delete-orphan")
