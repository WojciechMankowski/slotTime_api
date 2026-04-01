from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from supabase import Client
from datetime import date, datetime, time as dtime
from typing import Optional

from ..supabase_client import get_supabase
from ..deps import get_current_user, require_role, get_context_warehouse
from ..schemas import SlotNoticeOut, SlotNoticeCreate, SlotWithNoticeOut, UserRow, WarehouseRow
from ..enums import Role, SlotStatus
from ..notifications import send_slot_event

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

    try:
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

        # Filtrujemy sloty, które mają przypisane awizacje
        slots_with_notices = [s for s in slots if s["id"] in notices_by_slot]
        if not slots_with_notices:
            return []

        # ELIMINACJA PROBLEMU N+1: Zbieramy unikalne ID do pobrania hurtowego
        user_ids = list({s["reserved_by_user_id"] for s in slots_with_notices if s.get("reserved_by_user_id")})
        dock_ids = list({s["dock_id"] for s in slots_with_notices if s.get("dock_id")})

        users_map = {}
        companies_map = {}
        if user_ids:
            users_data = supa.table("users").select("id, alias, company_id").in_("id", user_ids).execute().data
            users_map = {u["id"]: u for u in users_data}
            
            company_ids = list({u["company_id"] for u in users_data if u.get("company_id")})
            if company_ids:
                comp_data = supa.table("companies").select("id, alias").in_("id", company_ids).execute().data
                companies_map = {c["id"]: c.get("alias") for c in comp_data}

        docks_map = {}
        if dock_ids:
            docks_data = supa.table("docks").select("id, alias").in_("id", dock_ids).execute().data
            docks_map = {d["id"]: d.get("alias") for d in docks_data}

        results = []
        for slot in slots_with_notices:
            reserved_by_alias = None
            reserved_by_company_alias = None
            
            u_id = slot.get("reserved_by_user_id")
            if u_id and u_id in users_map:
                user_info = users_map[u_id]
                reserved_by_alias = user_info.get("alias")
                c_id = user_info.get("company_id")
                if c_id and c_id in companies_map:
                    reserved_by_company_alias = companies_map[c_id]

            if company_alias and reserved_by_company_alias != company_alias:
                continue

            dock_alias = docks_map.get(slot.get("dock_id")) if slot.get("dock_id") else None

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
        
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"error_code": "DATABASE_ERROR"})


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
    try:
        slot_rows = supa.table("slots").select("*").eq("id", slot_id).execute().data
        slot = slot_rows[0] if slot_rows else None
        
        if not slot or slot.get("warehouse_id") != wh.id:
            raise HTTPException(status_code=404, detail={"error_code": "SLOT_NOT_FOUND"})
        if user.role == Role.client and slot.get("reserved_by_user_id") != user.id:
            raise HTTPException(status_code=403, detail={"error_code": "FORBIDDEN"})
            
        notice_rows = supa.table("slot_notices").select("*").eq("slot_id", slot_id).execute().data
        if not notice_rows:
            raise HTTPException(status_code=404, detail={"error_code": "NOTICE_NOT_FOUND"})
            
        n = notice_rows[0]
        return SlotNoticeOut(
            numer_zlecenia=n["numer_zlecenia"], 
            referencja=n["referencja"],
            rejestracja_auta=n["rejestracja_auta"], 
            rejestracja_naczepy=n["rejestracja_naczepy"],
            ilosc_palet=n["ilosc_palet"],
            kierowca_imie_nazwisko=n.get("kierowca_imie_nazwisko"),
            kierowca_tel=n.get("kierowca_tel"),
            uwagi=n.get("uwagi"),
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"error_code": "DATABASE_ERROR"})


@router.post("/{slot_id}/notice", response_model=SlotNoticeOut, dependencies=[Depends(require_role(Role.client))])
def post_notice(
    slot_id: int,
    data: SlotNoticeCreate,
    background_tasks: BackgroundTasks,
    user: UserRow = Depends(get_current_user),
    wh: WarehouseRow = Depends(get_context_warehouse),
    supa: Client = Depends(get_supabase),
):
    try:
        slot_rows = supa.table("slots").select("*").eq("id", slot_id).execute().data
        slot = slot_rows[0] if slot_rows else None
        
        if not slot or slot.get("warehouse_id") != wh.id:
            raise HTTPException(status_code=404, detail={"error_code": "SLOT_NOT_FOUND"})
        if slot.get("reserved_by_user_id") != user.id:
            raise HTTPException(status_code=403, detail={"error_code": "FORBIDDEN"})
        if slot.get("status") != "APPROVED_WAITING_DETAILS":
            raise HTTPException(status_code=409, detail={"error_code": "INVALID_STATUS"})

        payload = data.model_dump()
        for f in REQUIRED_FIELDS:
            v = payload.get(f)
            if v is None or (isinstance(v, str) and not v.strip()):
                raise HTTPException(status_code=400, detail={"error_code": "FIELD_REQUIRED", "field": f})
        if payload.get("ilosc_palet", 0) <= 0:
            raise HTTPException(status_code=400, detail={"error_code": "FIELD_INVALID", "field": "ilosc_palet"})

        # Aktualizacja lub wstawianie danych (Upsert) z zabezpieczeniem bazy
        notice_rows = supa.table("slot_notices").select("id", count="exact").eq("slot_id", slot_id).limit(0).execute()
        if notice_rows.count and notice_rows.count > 0:
            supa.table("slot_notices").update(payload).eq("slot_id", slot_id).execute()
        else:
            supa.table("slot_notices").insert({"slot_id": slot_id, **payload}).execute()

        supa.table("slots").update({"status": "RESERVED_CONFIRMED"}).eq("id", slot_id).execute()
        background_tasks.add_task(send_slot_event, supa, "RESERVED_CONFIRMED", {**slot, "status": "RESERVED_CONFIRMED"}, user, wh)
        return SlotNoticeOut(**payload)
        
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"error_code": "DATABASE_ERROR"})