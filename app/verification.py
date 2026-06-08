"""Generowanie i przechowywanie 6-cyfrowych kodów weryfikacyjnych.

W bazie trzymany jest wyłącznie hash kodu (pbkdf2 z `pwd_context`).
Plaintext zwracany jest tylko z `create_verification_code` — do przekazania
warstwie wysyłki — i nie jest nigdzie logowany.
"""
import secrets
from datetime import datetime, timedelta, timezone

from .security import pwd_context
from .supabase_client import get_supabase
from .config import settings
from .enums import CodePurpose

_TABLE = "verification_codes"


def generate_code() -> str:
    """Zwraca kryptograficznie bezpieczny 6-cyfrowy kod (z zerami wiodącymi)."""
    return f"{secrets.randbelow(1_000_000):06d}"


def create_verification_code(user_id: int, purpose: CodePurpose) -> str:
    """Tworzy nowy kod dla (user_id, purpose), unieważnia poprzednie aktywne
    i zapisuje hash w bazie. Zwraca plaintext kodu (do wysyłki)."""
    code = generate_code()
    code_hash = pwd_context.hash(code)
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=settings.VERIFICATION_CODE_EXPIRE_MINUTES)

    supa = get_supabase()

    # Unieważnij poprzednie aktywne kody tej samej pary (user_id, purpose).
    supa.table(_TABLE).update({"consumed_at": now.isoformat()}) \
        .eq("user_id", user_id) \
        .eq("purpose", purpose.value) \
        .is_("consumed_at", None) \
        .execute()

    supa.table(_TABLE).insert({
        "user_id": user_id,
        "code_hash": code_hash,
        "purpose": purpose.value,
        "expires_at": expires_at.isoformat(),
        "created_at": now.isoformat(),
    }).execute()

    return code
