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
    PENDING_CONFIRMATION = "PENDING_CONFIRMATION"
    CONFIRMED = "CONFIRMED"
    BOOKED = "BOOKED"  # Legacy
    APPROVED_WAITING_DETAILS = "APPROVED_WAITING_DETAILS"  # Legacy
    RESERVED_CONFIRMED = "RESERVED_CONFIRMED"  # Legacy
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    CANCEL_PENDING = "CANCEL_PENDING"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"
    NO_SHOW = "NO_SHOW"
    CANCEL_REJECTED = "CANCEL_REJECTED"
