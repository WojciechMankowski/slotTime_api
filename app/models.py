import enum
from typing import Dict, Any

# ==========================================
# 1. ENUMY (Wymagane przez większość plików)
# ==========================================

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
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"
    NO_SHOW = "NO_SHOW"
    CANCEL_REJECTED = "CANCEL_REJECTED"


# ==========================================d
# 2. ALIASY TYPÓW (Dla kompatybilności wstecznej)
# ==========================================
# Dzięki temu kod typu `def get_data(wh: models.Warehouse)` 
# nie wyrzuci błędu o braku klasy Warehouse, dopóki w pełni
# nie przepniesz całego projektu na schematy Pydantic (WarehouseRow)
# i obiekty słownikowe zwracane z Supabase.

Warehouse = Dict[str, Any]
Company = Dict[str, Any]
User = Dict[str, Any]
Dock = Dict[str, Any]
Slot = Dict[str, Any]
SlotNotice = Dict[str, Any]
DayCapacity = Dict[str, Any]
SlotTemplate = Dict[str, Any]