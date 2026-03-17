from __future__ import annotations
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from ..db import Base

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
