import enum


class Role(str, enum.Enum):
    superadmin = "superadmin"
    admin = "admin"
    client = "client"


class CodePurpose(str, enum.Enum):
    PASSWORD_RESET = "password_reset"
    EMAIL_VERIFY = "email_verify"


class SlotType(str, enum.Enum):
    INBOUND = "INBOUND"
    OUTBOUND = "OUTBOUND"
    ANY = "ANY"


class SlotStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    PENDING_CONFIRMATION = "PENDING_CONFIRMATION"
    CONFIRMED = "CONFIRMED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    CANCEL_PENDING = "CANCEL_PENDING"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"
    NO_SHOW = "NO_SHOW"
    CANCEL_REJECTED = "CANCEL_REJECTED"
    # Legacy — wartości historyczne sprzed Etapu A, zachowane dla kompatybilności
    # z niezmigrowanymi danymi (zapobiega 503 przy walidacji SlotOut).
    # Mapowanie docelowe: migration_etap_a.sql.
    BOOKED = "BOOKED"  # -> PENDING_CONFIRMATION
    RESERVED_CONFIRMED = "RESERVED_CONFIRMED"  # -> CONFIRMED
    APPROVED_WAITING_DETAILS = "APPROVED_WAITING_DETAILS"  # -> CONFIRMED
