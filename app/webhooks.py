import httpx
from datetime import datetime, timezone
from typing import Optional
from supabase import Client

from .config import settings


def send_slot_webhook(
    event: str,
    slot: dict,
    triggered_by: dict,
    supa: Client,
) -> None:
    """
    Wysyła płaski payload do Power Automate webhook.
    Błędy są logowane, ale nie przerywają odpowiedzi API.
    """
    if not settings.POWER_AUTOMATE_WEBHOOK_URL:
        return

    # email klienta który zarezerwował slot
    email_user = ""
    reserved_user_id = slot.get("reserved_by_user_id")
    if reserved_user_id:
        try:
            user_rows = supa.table("users").select("email").eq("id", reserved_user_id).execute().data
            if user_rows:
                email_user = user_rows[0].get("email") or ""
        except Exception:
            pass

    # email admina magazynu
    email_admin = ""
    warehouse_id = slot.get("warehouse_id")
    if warehouse_id:
        try:
            admin_rows = (
                supa.table("users")
                .select("email")
                .eq("role", "admin")
                .eq("warehouse_id", warehouse_id)
                .limit(1)
                .execute()
                .data
            )
            if admin_rows:
                email_admin = admin_rows[0].get("email") or ""
        except Exception:
            pass

    payload = {
        "event": event,
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "id": slot.get("id"),
        "start_dt": slot.get("start_dt"),
        "end_dt": slot.get("end_dt"),
        "slot_type": slot.get("slot_type"),
        "original_slot_type": slot.get("original_slot_type"),
        "status": slot.get("status"),
        "reserved_by_user_id": slot.get("reserved_by_user_id"),
        "reserved_by_company_alias": _get_company_alias(slot, supa),
        "user_id": triggered_by.get("id"),
        "username": triggered_by.get("username"),
        "role": triggered_by.get("role"),
        "email_user": email_user,
        "email_admin": email_admin,
    }

    try:
        with httpx.Client(timeout=5.0) as client:
            client.post(settings.POWER_AUTOMATE_WEBHOOK_URL, json=payload)
    except Exception as e:
        print(f"[WEBHOOK ERROR] {type(e).__name__}: {e}")


def _get_company_alias(slot: dict, supa: Client) -> str:
    reserved_user_id = slot.get("reserved_by_user_id")
    if not reserved_user_id:
        return ""
    try:
        user_rows = supa.table("users").select("company_id").eq("id", reserved_user_id).execute().data
        if not user_rows or not user_rows[0].get("company_id"):
            return ""
        company_id = user_rows[0]["company_id"]
        company_rows = supa.table("companies").select("alias").eq("id", company_id).execute().data
        return company_rows[0].get("alias") or "" if company_rows else ""
    except Exception:
        return ""
