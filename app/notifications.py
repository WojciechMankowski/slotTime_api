import httpx
import logging
from datetime import datetime, timezone
from supabase import Client

from .schemas import UserRow, WarehouseRow
from .enums import Role
from .config import settings

logger = logging.getLogger(__name__)


def send_slot_event(
    supa: Client,
    event: str,
    slot: dict,
    triggered_by: UserRow,
    wh: WarehouseRow,
) -> None:
    """Buduje payload i wysyła GET do Power Automate. Wywoływana z BackgroundTasks."""
    logger.error('SEMD DO POWER AAUTOMATE')
    try:
        reserved_by_id = slot.get("reserved_by_user_id")
        email_user = None
        reserved_by_company_alias = None

        if reserved_by_id:
            user_rows = supa.table("users").select("email, company_id").eq("id", reserved_by_id).execute().data
            if user_rows:
                email_user = user_rows[0].get("email")
                c_id = user_rows[0].get("company_id")
                if c_id:
                    comp_rows = supa.table("companies").select("alias").eq("id", c_id).execute().data
                    if comp_rows:
                        reserved_by_company_alias = comp_rows[0].get("alias")

        if triggered_by.role in (Role.admin, Role.superadmin):
            email_admin = triggered_by.email
        else:
            email_admin = None
            admin_rows = (
                supa.table("users").select("email")
                .eq("warehouse_id", wh.id)
                .eq("role", "admin")
                .limit(1)
                .execute().data
            )
            if admin_rows:
                email_admin = admin_rows[0].get("email")

        payload = {
            "event": event,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "id": slot.get("id"),
            "start_dt": slot.get("start_dt"),
            "end_dt": slot.get("end_dt"),
            "slot_type": slot.get("slot_type"),
            "original_slot_type": slot.get("original_slot_type"),
            "status": slot.get("status"),
            "reserved_by_user_id": reserved_by_id,
            "reserved_by_company_alias": reserved_by_company_alias,
            "user_id": triggered_by.id,
            "name_warehouse": wh.name,
            "username": triggered_by.username,
            "role": triggered_by.role.value,
            "email_user": email_user,
            "email_admin": email_admin,
        }

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
