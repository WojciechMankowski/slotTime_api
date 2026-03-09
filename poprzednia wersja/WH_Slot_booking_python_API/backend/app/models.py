
from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    users = relationship("User", back_populates="company")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="client")  # client / admin
    company_id = Column(Integer, ForeignKey("companies.id"))

    company = relationship("Company", back_populates="users")


class Slot(Base):
    __tablename__ = "slots"

    id = Column(Integer, primary_key=True, index=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    slot_type = Column(String, default="ANY")  # INBOUND / OUTBOUND / ANY
    status = Column(String, default="OPEN")    # OPEN, RESERVED_PENDING, APPROVED_WAITING_DETAILS, RESERVED_CONFIRMED, CANCEL_PENDING, CLOSED
    reserved_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # wspólne doki magazynowe (opcjonalnie przypisywane przez admina)
    dock_id = Column(Integer, ForeignKey("docks.id"), nullable=True)

    reserved_by = relationship("User")
    dock = relationship("Dock")
    notice = relationship("SlotNotice", back_populates="slot", uselist=False)


class Dock(Base):
    __tablename__ = "docks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)


class SlotNotice(Base):
    __tablename__ = "slot_notices"

    id = Column(Integer, primary_key=True, index=True)
    slot_id = Column(Integer, ForeignKey("slots.id"), unique=True, nullable=False)

    order_number = Column(String, nullable=False)         # numer zlecenia
    reference = Column(String, nullable=False)            # referencja
    vehicle_registration = Column(String, nullable=False) # rejestracja auta
    trailer_registration = Column(String, nullable=False) # rejestracja naczepy
    driver_name = Column(String, nullable=False)          # dane kierowcy
    driver_phone = Column(String, nullable=False)         # telefon kierowcy
    pallet_count = Column(Integer, nullable=False)        # ilość palet
    remarks = Column(Text, nullable=True)                 # uwagi

    slot = relationship("Slot", back_populates="notice")


class SlotTemplate(Base):
    __tablename__ = "slot_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slot_type = Column(String, default="ANY")        # INBOUND / OUTBOUND / ANY
    start_time = Column(String, nullable=False)      # HH:MM
    end_time = Column(String, nullable=False)        # HH:MM
    interval_minutes = Column(Integer, default=30)   # krok w minutach
    capacity = Column(Integer, default=1)            # ile równoległych slotów na przedział czasu


class DayCapacity(Base):
    __tablename__ = "day_capacity"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, unique=True, nullable=False)
    inbound_limit = Column(Integer, default=0)
    outbound_limit = Column(Integer, default=0)
