import httpx
import logging
from datetime import datetime, timezone
from supabase import Client

from .schemas import UserRow, WarehouseRow
from .enums import Role, CodePurpose
from .config import settings

logger = logging.getLogger(__name__)

# URL flow Power Automate dla kodów weryfikacyjnych — używany bezpośrednio (nie z env).
POWER_AUTOMATE_CODE_URL = "https://default5fe04b4b7f7347cd93a86c5d873fb2.77.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/4e4fcb1bf00743a79dc47008c5935b35/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=GNa2RjoKCWlpEl3TZ71TESV_CVi26npRzJ1UZ6EDGEk"


def build_slot_event_payload(
    supa: Client,
    event: str,
    slot: dict,
    wh: WarehouseRow,
) -> dict:
    """Buduje payload zdarzenia slotu (format power_automat.json).

    Reużywane przez webhook (send_slot_event) i endpoint pull GET /api/slots/{id}/payload.
    """
    reserved_by_id = slot.get("reserved_by_user_id")
    email_user = None
    reserved_by_company_name = None

    if reserved_by_id:
        user_rows = supa.table("users").select("email, company_id").eq("id", reserved_by_id).execute().data
        if user_rows:
            email_user = user_rows[0].get("email")
            c_id = user_rows[0].get("company_id")
            if c_id:
                comp_rows = supa.table("companies").select("name").eq("id", c_id).execute().data
                if comp_rows:
                    reserved_by_company_name = comp_rows[0].get("name")

    numer_zlecenia = None
    referencja = None
    rejestracja_auta = None
    rejestracja_naczepy = None
    ilosc_palet = None
    kierowca_imie_nazwisko = None
    notice_rows = supa.table("slot_notices").select(
        "numer_zlecenia, referencja, rejestracja_auta, rejestracja_naczepy, ilosc_palet, kierowca_imie_nazwisko"
    ).eq("slot_id", slot.get("id")).limit(1).execute().data
    logger.info("build_slot_event_payload: slot_id=%s notice_rows=%s", slot.get("id"), notice_rows)
    if notice_rows:
        notice = notice_rows[0]
        numer_zlecenia = notice.get("numer_zlecenia")
        referencja = notice.get("referencja")
        rejestracja_auta = notice.get("rejestracja_auta")
        rejestracja_naczepy = notice.get("rejestracja_naczepy")
        ilosc_palet = notice.get("ilosc_palet")
        kierowca_imie_nazwisko = notice.get("kierowca_imie_nazwisko")

    admin_rows = (
        supa.table("users").select("email")
        .eq("warehouse_id", wh.id)
        .eq("role", "admin")
        .execute().data
    )
    emails = [r.get("email") for r in admin_rows if r.get("email")]
    email_admin = ";".join(emails) if emails else None

    return {
        "event": event,
        "start_dt": slot.get("start_dt"),
        "end_dt": slot.get("end_dt"),
        "status": slot.get("status"),
        "slot_type": slot.get("slot_type"),
        "reserved_by_company_name": reserved_by_company_name,
        "order_number": numer_zlecenia,
        "referencja": referencja,
        "rejestracja_auta": rejestracja_auta,
        "rejestracja_naczepy": rejestracja_naczepy,
        "ilosc_palet": ilosc_palet,
        "kierowca_imie_nazwisko": kierowca_imie_nazwisko,
        "email_user": email_user,
        "email_admin": email_admin,
    }


def send_slot_event(
    supa: Client,
    event: str,
    slot: dict,
    triggered_by: UserRow,
    wh: WarehouseRow,
) -> None:
    """Buduje payload i wysyła GET do Power Automate. Wywoływana z BackgroundTasks."""
    logger.info("send_slot_event: event=%s slot=%s", event, slot.get("id"))
    try:
        # Po zmianie do PA leci wyłącznie id slotu — pełne dane PA dociąga
        # przez GET /api/slots/{id}/payload (build_slot_event_payload).
        payload = {"id": slot.get("id")}

        with httpx.Client(timeout=10) as client:
            resp = client.post(settings.POWER_AUTOMATE_URL, json=payload)
            if resp.is_error:
                logger.warning(
                    "send_slot_event HTTP %s [event=%s slot=%s]: %s",
                    resp.status_code, event, slot.get("id"), resp.text,
                )
            resp.raise_for_status()

    except Exception as exc:
        logger.warning("send_slot_event failed [event=%s slot=%s]: %s", event, slot.get("id"), exc)


def send_verification_code(email: str, name: str, purpose: CodePurpose, code: str) -> None:
    """Wysyła kod weryfikacyjny do dedykowanego flow Power Automate.

    Bezpieczna do użycia w BackgroundTasks — błędy są logowane, nie podnoszone.
    Kod (plaintext) trafia wyłącznie do payloadu PA i nie jest logowany.
    """
    payload = {
        "event": purpose.value,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "email": email,
        "name": name,
        "purpose": purpose.value,
        "code": code,
    }

    try:
        with httpx.Client(timeout=10) as client:
            resp = client.post(POWER_AUTOMATE_CODE_URL, json=payload)
            if resp.is_error:
                logger.warning(
                    "send_verification_code HTTP %s [purpose=%s email=%s]: %s",
                    resp.status_code, purpose.value, email, resp.text,
                )
            resp.raise_for_status()

    except Exception as exc:
        logger.warning("send_verification_code failed [purpose=%s email=%s]: %s", purpose.value, email, exc)
