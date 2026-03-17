from __future__ import annotations
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from ..db import Base

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
