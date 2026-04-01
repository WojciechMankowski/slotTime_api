import enum


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
