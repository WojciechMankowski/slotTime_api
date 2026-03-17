from __future__ import annotations
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship

from ..db import Base
from .slot import SlotType

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
