from __future__ import annotations
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from ..db import Base

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
