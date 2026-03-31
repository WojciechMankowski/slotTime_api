from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client
from datetime import date, datetime, time as dtime
from typing import Optional

from ..supabase_client import get_supabase
from ..deps import get_current_user, require_role, get_context_warehouse
from ..schemas import SlotNoticeOut, SlotNoticeCreate, SlotWithNoticeOut, UserRow, WarehouseRow
from ..enums import Role, SlotStatus

router = APIRouter(prefix="/api/slots", tags=["notices"])

REQUIRED_FIELDS = ["numer_zlecenia", "referencja", "rejestracja_auta", "rejestracja_naczepy", "ilosc_palet"]


# =========================================================
# LIST ALL NOTICES (admin view)
# =========================================================

@router.get(
    "/notices",
    response_model=list[SlotWithNoticeOut],
    dependencies=[Depends(require_role(Role.admin, Role.superadmin))],
)
def list_notices(
    date_from: date = Query(...),
    date_to: date = Query(...),
    status: Optional[str] = Query(None),
    company_alias: Optional[str] = Query(None),
    user: UserRow = Depends(get_current_user),
    wh: WarehouseRow = Depends(get_context_warehouse),
    supa: Client = Depends(get_supabase),
):
    start = datetime.combine(date_from, dtime.min).isoformat()
    end = datetime.combine(date_to, dtime.max).isoformat()

    q = (
        supa.table("slots").select("*")
        .eq("warehouse_id", wh.id)
        .gte("start_dt", start)
        .lte("start_dt", end)
    )
    if status:
        try:
            SlotStatus(status)
        except ValueError:
            raise HTTPException(status_code=400, detail={"error_code": "INVALID_STATUS_FILTER"})
        q = q.eq("status", status)

    slots = q.order("start_dt").execute().data

    if not slots:
        return []

    slot_ids = [s["id"] for s in slots]
    notices_data = supa.table("slot_notices").select("*").in_("slot_id", slot_ids).execute().data
    notices_by_slot = {n["slot_id"]: n for n in notices_data}

    # Only slots that have a notice
    slots_with_notices = [s for s in slots if s["id"] in notices_by_slot]

    results = []
    for slot in slots_with_notices:
        reserved_by_alias = None
        reserved_by_company_alias = None
        if slot.get("reserved_by_user_id"):
            user_rows = supa.table("users").select("alias,company_id").eq("id", slot["reserved_by_user_id"]).execute().data
            if user_rows:
                u = user_rows[0]
                reserved_by_alias = u["alias"]
                if u.get("company_id"):
                    comp_rows = supa.table("companies").select("alias").eq("id", u["company_id"]).execute().data
                    if comp_rows:
                        reserved_by_company_alias = comp_rows[0]["alias"]

        if company_alias and reserved_by_company_alias != company_alias:
            continue

        dock_alias = None
        if slot.get("dock_id"):
            dock_rows = supa.table("docks").select("alias").eq("id", slot["dock_id"]).execute().data
            dock_alias = dock_rows[0]["alias"] if dock_rows else None

        n = notices_by_slot[slot["id"]]
        results.append(SlotWithNoticeOut(
            id=slot["id"],
            start_dt=slot["start_dt"],
            end_dt=slot["end_dt"],
            slot_type=slot["slot_type"],
            original_slot_type=slot["original_slot_type"],
            status=slot["status"],
            dock_id=slot.get("dock_id"),
            dock_alias=dock_alias,
            reserved_by_user_id=slot.get("reserved_by_user_id"),
            reserved_by_alias=reserved_by_alias,
            reserved_by_company_alias=reserved_by_company_alias,
            notice=SlotNoticeOut(
                numer_zlecenia=n["numer_zlecenia"],
                referencja=n["referencja"],
                rejestracja_auta=n["rejestracja_auta"],
                rejestracja_naczepy=n["rejestracja_naczepy"],
                ilosc_palet=n["ilosc_palet"],
                kierowca_imie_nazwisko=n.get("kierowca_imie_nazwisko"),
                kierowca_tel=n.get("kierowca_tel"),
                uwagi=n.get("uwagi"),
            ),
        ))

    return results


# =========================================================
# SINGLE NOTICE
# =========================================================

@router.get("/{slot_id}/notice", response_model=SlotNoticeOut, dependencies=[Depends(require_role(Role.admin, Role.client))])
def get_notice(
    slot_id: int,
    user: UserRow = Depends(get_current_user),
    wh: WarehouseRow = Depends(get_context_warehouse),
    supa: Client = Depends(get_supabase),
):
    slot_rows = supa.table("slots").select("*").eq("id", slot_id).execute().data
    slot = slot_rows[0] if slot_rows else None
    if not slot or slot["warehouse_id"] != wh.id:
        raise HTTPException(status_code=404, detail={"error_code": "SLOT_NOT_FOUND"})
    if user.role == Role.client and slot.get("reserved_by_user_id") != user.id:
        raise HTTPException(status_code=403, detail={"error_code": "FORBIDDEN"})
    notice_rows = supa.table("slot_notices").select("*").eq("slot_id", slot_id).execute().data
    if not notice_rows:
        raise HTTPException(status_code=404, detail={"error_code": "NOTICE_NOT_FOUND"})
    n = notice_rows[0]
    return SlotNoticeOut(
        numer_zlecenia=n["numer_zlecenia"], referencja=n["referencja"],
        rejestracja_auta=n["rejestracja_auta"], rejestracja_naczepy=n["rejestracja_naczepy"],
        ilosc_palet=n["ilosc_palet"],
        kierowca_imie_nazwisko=n.get("kierowca_imie_nazwisko"),
        kierowca_tel=n.get("kierowca_tel"),
        uwagi=n.get("uwagi"),
    )


@router.post("/{slot_id}/notice", response_model=SlotNoticeOut, dependencies=[Depends(require_role(Role.client))])
def post_notice(
    slot_id: int,
    data: SlotNoticeCreate,
    user: UserRow = Depends(get_current_user),
    wh: WarehouseRow = Depends(get_context_warehouse),
    supa: Client = Depends(get_supabase),
):
    slot_rows = supa.table("slots").select("*").eq("id", slot_id).execute().data
    slot = slot_rows[0] if slot_rows else None
    if not slot or slot["warehouse_id"] != wh.id:
        raise HTTPException(status_code=404, detail={"error_code": "SLOT_NOT_FOUND"})
    if slot.get("reserved_by_user_id") != user.id:
        raise HTTPException(status_code=403, detail={"error_code": "FORBIDDEN"})
    if slot["status"] != "APPROVED_WAITING_DETAILS":
        raise HTTPException(status_code=409, detail={"error_code": "INVALID_STATUS"})

    payload = data.model_dump()
    for f in REQUIRED_FIELDS:
        v = payload.get(f)
        if v is None or (isinstance(v, str) and not v.strip()):
            raise HTTPException(status_code=400, detail={"error_code": "FIELD_REQUIRED", "field": f})
    if payload["ilosc_palet"] <= 0:
        raise HTTPException(status_code=400, detail={"error_code": "FIELD_INVALID", "field": "ilosc_palet"})

    notice_rows = supa.table("slot_notices").select("id").eq("slot_id", slot_id).execute().data
    if notice_rows:
        supa.table("slot_notices").update(payload).eq("slot_id", slot_id).execute()
    else:
        supa.table("slot_notices").insert({"slot_id": slot_id, **payload}).execute()

    supa.table("slots").update({"status": "RESERVED_CONFIRMED"}).eq("id", slot_id).execute()
    return SlotNoticeOut(**payload)
