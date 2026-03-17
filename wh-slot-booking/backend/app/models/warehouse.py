from __future__ import annotations
from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship

from ..db import Base

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
