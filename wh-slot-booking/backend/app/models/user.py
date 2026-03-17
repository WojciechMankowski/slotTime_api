from __future__ import annotations
from sqlalchemy import Column, Integer, String, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum

from ..db import Base

class Role(str, enum.Enum):
    superadmin = "superadmin"
    admin = "admin"
    client = "client"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String, nullable=False, unique=True, index=True)
    password_hash = Column(String, nullable=False)
    alias = Column(String, nullable=False)
    role = Column(Enum(Role), nullable=False)

    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)

    warehouse = relationship("Warehouse")
    company = relationship("Company", back_populates="users")
