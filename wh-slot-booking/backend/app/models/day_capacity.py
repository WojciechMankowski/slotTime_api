from __future__ import annotations
from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint, Enum, Date
from sqlalchemy.orm import relationship
import enum

from ..db import Base
from .slot import SlotType

class DayCapacity(Base):
    __tablename__ = "day_capacities"
    __table_args__ = (UniqueConstraint("warehouse_id", "date", "slot_type", name="uq_daycap"),)
    id = Column(Integer, primary_key=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    slot_type = Column(Enum(SlotType), nullable=False)
    capacity = Column(Integer, nullable=False)

    warehouse = relationship("Warehouse", back_populates="day_caps")
