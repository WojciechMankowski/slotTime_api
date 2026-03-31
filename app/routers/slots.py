from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client
from datetime import datetime, date, timedelta, time as dtime
from typing import List, Optional, Tuple

from ..supabase_client import get_supabase
from ..deps import get_current_user, require_role, get_context_warehouse
from ..schemas import (
    SlotOut,
    SlotPatch,
    SlotReserveIn,
    SlotAssignDockIn,
    SlotGenerateIn,
    SlotGenerateOut,
    SlotGenerateDayReport,
    SlotStatusPatch,
    UserRow,
    WarehouseRow,
)
from ..enums import Role, SlotType, SlotStatus

router = APIRouter(prefix="/api/slots", tags=["slots"])


# =========================================================
# Helpers
# =========================================================

def _slot_to_out(slot: dict, supa: Client) -> SlotOut:
    dock_alias = None
    if slot.get("dock_id"):
        dock_rows = supa.table("docks").select("alias").eq("id", slot["dock_id"]).execute().data
        dock_alias = dock_rows[0]["alias"] if dock_rows else None

    reserved_by_alias = None
    reserved_by_company_alias = None
    if slot.get("reserved_by_user_id"):
        user_rows = supa.table("users").select("alias,company_id").eq("id", slot["reserved_by_user_id"]).execute().data
        if user_rows:
            u = user_rows[0]
            reserved_by_alias = u["alias"]
            if u.get("company_id"):
                company_rows = supa.table("companies").select("alias").eq("id", u["company_id"]).execute().data
                reserved_by_company_alias = company_rows[0]["alias"] if company_rows else None

    return SlotOut(
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
    )


def _parse_time(value: Optional[object], field_name: str) -> Optional[dtime]:
    if value is None:
        return None
    if isinstance(value, dtime):
        return value
    if isinstance(value, str):
        try:
            return dtime.fromisoformat(value)
        except Exception:
            raise HTTPException(status_code=400, detail={"error_code": "INVALID_TIME", "field": field_name})
    raise HTTPException(status_code=400, detail={"error_code": "INVALID_TIME", "field": field_name})


def _resolve_generate_params(
    data: SlotGenerateIn,
    wh: WarehouseRow,
    supa: Client,
) -> Tuple[dtime, dtime, int, SlotType, int, Optional[int], Optional[str]]:
    template_id = data.template_id
    template_name = None

    start_time = _parse_time(data.start_time, "start_time")
    end_time = _parse_time(data.end_time, "end_time")
    interval = data.interval_minutes
    slot_type = data.slot_type
    parallel_slots = data.parallel_slots if data.parallel_slots is not None else 1

    if template_id is not None:
        tmpl_rows = supa.table("slot_templates").select("*").eq("id", template_id).execute().data
        t = tmpl_rows[0] if tmpl_rows else None
        if not t or t["warehouse_id"] != wh.id:
            raise HTTPException(status_code=404, detail={"error_code": "TEMPLATE_NOT_FOUND"})
        if not t.get("is_active", True):
            raise HTTPException(status_code=409, detail={"error_code": "TEMPLATE_INACTIVE"})

        template_name = t.get("name")
        tpl_start = dtime(hour=int(t["start_hour"]), minute=0)
        tpl_end_hour = int(t["end_hour"])
        tpl_end = dtime(hour=23, minute=59) if tpl_end_hour >= 24 else dtime(hour=tpl_end_hour, minute=0)
        tpl_interval = int(t["slot_minutes"])
        tpl_type = SlotType(t["slot_type"])

        if start_time is None:
            start_time = tpl_start
        if end_time is None:
            end_time = tpl_end
        if interval is None:
            interval = tpl_interval
        if slot_type is None:
            slot_type = tpl_type

    if start_time is None:
        raise HTTPException(status_code=400, detail={"error_code": "FIELD_REQUIRED", "field": "start_time"})
    if end_time is None:
        raise HTTPException(status_code=400, detail={"error_code": "FIELD_REQUIRED", "field": "end_time"})
    if interval is None:
        raise HTTPException(status_code=400, detail={"error_code": "FIELD_REQUIRED", "field": "interval_minutes"})
    if slot_type is None:
        raise HTTPException(status_code=400, detail={"error_code": "FIELD_REQUIRED", "field": "slot_type"})

    if parallel_slots is None:
        parallel_slots = 1

    if interval <= 0:
        raise HTTPException(status_code=400, detail={"error_code": "INVALID_INTERVAL"})
    if parallel_slots <= 0:
        raise HTTPException(status_code=400, detail={"error_code": "INVALID_PARALLEL_SLOTS"})
    if start_time >= end_time:
        raise HTTPException(status_code=400, detail={"error_code": "INVALID_TIME_RANGE"})

    return start_time, end_time, interval, slot_type, parallel_slots, template_id, template_name


# =========================================================
# LIST
# =========================================================

@router.get(
    "",
    response_model=list[SlotOut],
    dependencies=[Depends(require_role(Role.admin, Role.superadmin, Role.client))],
)
def list_slots(
    date_from: date,
    date_to: date,
    status: Optional[str] = Query(None),
    user: UserRow = Depends(get_current_user),
    wh: WarehouseRow = Depends(get_context_warehouse),
    supa: Client = Depends(get_supabase),
):
    start = datetime.combine(date_from, dtime.min)
    end = datetime.combine(date_to, dtime.max)

    q = (
        supa.table("slots").select("*")
        .eq("warehouse_id", wh.id)
        .gte("start_dt", start.isoformat())
        .lte("start_dt", end.isoformat())
    )

    if status:
        try:
            SlotStatus[status.upper()]
        except KeyError:
            raise HTTPException(status_code=400, detail={"error_code": "INVALID_STATUS_FILTER"})
        q = q.eq("status", status.upper())

    slots = q.order("start_dt").execute().data

    if user.role == Role.client:
        company_rows = supa.table("companies").select("is_active").eq("id", user.company_id).execute().data if user.company_id else []
        if not company_rows or not company_rows[0]["is_active"]:
            raise HTTPException(status_code=403, detail={"error_code": "COMPANY_INACTIVE"})

    return [_slot_to_out(s, supa) for s in slots]


# =========================================================
# ARCHIVE
# =========================================================

@router.get(
    "/archive",
    response_model=List[SlotOut],
    dependencies=[Depends(require_role(Role.admin, Role.superadmin, Role.client))],
)
def list_archive(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    status: Optional[str] = Query(None),
    user: UserRow = Depends(get_current_user),
    wh: WarehouseRow = Depends(get_context_warehouse),
    supa: Client = Depends(get_supabase),
):
    ARCHIVE_STATUSES = {"COMPLETED", "CANCELLED"}

    if status and status.upper() == "ALL":
        filter_statuses = list(ARCHIVE_STATUSES)
    elif status:
        s = status.upper()
        if s not in ARCHIVE_STATUSES:
            raise HTTPException(status_code=400, detail={"error_code": "INVALID_STATUS"})
        filter_statuses = [s]
    else:
        filter_statuses = ["COMPLETED"]

    q = (
        supa.table("slots").select("*")
        .eq("warehouse_id", wh.id)
        .in_("status", filter_statuses)
    )

    if date_from:
        q = q.gte("start_dt", datetime.combine(date_from, dtime.min).isoformat())
    if date_to:
        q = q.lte("start_dt", datetime.combine(date_to, dtime.max).isoformat())

    if user.role == Role.client:
        q = q.eq("reserved_by_user_id", user.id)

    slots = q.order("start_dt", desc=True).execute().data
    return [_slot_to_out(s, supa) for s in slots]


# =========================================================
# GENERATE
# =========================================================

@router.post(
    "/generate",
    response_model=SlotGenerateOut,
    dependencies=[Depends(require_role(Role.admin, Role.superadmin))],
)
def generate_slots(
    data: SlotGenerateIn,
    wh: WarehouseRow = Depends(get_context_warehouse),
    supa: Client = Depends(get_supabase),
):
    if data.date_from > data.date_to:
        raise HTTPException(status_code=400, detail={"error_code": "INVALID_DATE_RANGE"})

    start_time, end_time, interval_minutes, slot_type, parallel_slots, template_id, template_name = _resolve_generate_params(
        data, wh, supa
    )

    total_generated = 0
    total_skipped = 0
    day_reports: list[SlotGenerateDayReport] = []

    delta = timedelta(minutes=int(interval_minutes))

    d = data.date_from
    while d <= data.date_to:
        day_start = datetime.combine(d, start_time)
        day_end = datetime.combine(d, end_time)

        requested = 0
        generated = 0
        skipped = 0

        # optional daily capacity
        cap_rows = (
            supa.table("day_capacities").select("capacity")
            .eq("warehouse_id", wh.id)
            .eq("date", d.isoformat())
            .eq("slot_type", slot_type.value)
            .execute().data
        )
        cap_val: Optional[int] = int(cap_rows[0]["capacity"]) if cap_rows else None

        # existing slots for that day+type (no dock) -> counts against capacity
        day_start_iso = datetime.combine(d, dtime.min).isoformat()
        day_end_iso = datetime.combine(d, dtime.max).isoformat()
        existing_day_result = (
            supa.table("slots").select("id", count="exact")
            .eq("warehouse_id", wh.id)
            .filter("dock_id", "is", "null")
            .eq("slot_type", slot_type.value)
            .gte("start_dt", day_start_iso)
            .lte("start_dt", day_end_iso)
            .execute()
        )
        existing_day_count = existing_day_result.count or 0

        remaining_capacity = None if cap_val is None else max(0, cap_val - existing_day_count)

        cur = day_start
        batch: list[dict] = []

        while cur + delta <= day_end:
            requested += parallel_slots

            existing_interval_result = (
                supa.table("slots").select("id", count="exact")
                .eq("warehouse_id", wh.id)
                .filter("dock_id", "is", "null")
                .eq("start_dt", cur.isoformat())
                .eq("end_dt", (cur + delta).isoformat())
                .eq("slot_type", slot_type.value)
                .execute()
            )
            existing_interval_count = existing_interval_result.count or 0

            to_create = max(0, parallel_slots - existing_interval_count)

            if remaining_capacity is not None:
                if remaining_capacity <= 0:
                    skipped += to_create
                    cur += delta
                    continue
                if to_create > remaining_capacity:
                    skipped += (to_create - remaining_capacity)
                    to_create = remaining_capacity

            for _ in range(to_create):
                batch.append({
                    "warehouse_id": wh.id,
                    "dock_id": None,
                    "start_dt": cur.isoformat(),
                    "end_dt": (cur + delta).isoformat(),
                    "slot_type": slot_type.value,
                    "original_slot_type": slot_type.value,
                    "status": "AVAILABLE",
                    "reserved_by_user_id": None,
                })
                generated += 1
                if remaining_capacity is not None:
                    remaining_capacity -= 1

            skipped += max(0, parallel_slots - existing_interval_count - to_create)
            cur += delta

        if batch:
            supa.table("slots").insert(batch).execute()

        total_generated += generated
        total_skipped += skipped

        day_reports.append(
            SlotGenerateDayReport(
                date=d,
                requested=requested,
                generated=generated,
                skipped_due_to_capacity=skipped,
                capacity=cap_val,
            )
        )

        d += timedelta(days=1)

    return SlotGenerateOut(
        generated_count=total_generated,
        skipped_due_to_capacity=total_skipped,
        days=day_reports,
    )


# =========================================================
# ACTIONS
# =========================================================

@router.post(
    "/{slot_id}/reserve",
    response_model=SlotOut,
    dependencies=[Depends(require_role(Role.client))],
)
def reserve_slot(
    slot_id: int,
    data: SlotReserveIn,
    user: UserRow = Depends(get_current_user),
    wh: WarehouseRow = Depends(get_context_warehouse),
    supa: Client = Depends(get_supabase),
):
    slot_rows = supa.table("slots").select("*").eq("id", slot_id).execute().data
    slot = slot_rows[0] if slot_rows else None
    if not slot or slot["warehouse_id"] != wh.id:
        raise HTTPException(status_code=404, detail={"error_code": "SLOT_NOT_FOUND"})

    if user.company_id:
        company_rows = supa.table("companies").select("is_active").eq("id", user.company_id).execute().data
        if not company_rows or not company_rows[0]["is_active"]:
            raise HTTPException(status_code=403, detail={"error_code": "COMPANY_INACTIVE"})
    else:
        raise HTTPException(status_code=403, detail={"error_code": "COMPANY_INACTIVE"})

    if slot["status"] != "AVAILABLE":
        raise HTTPException(status_code=409, detail={"error_code": "SLOT_NOT_AVAILABLE"})

    update = {"status": "BOOKED", "reserved_by_user_id": user.id}
    if slot["slot_type"] == "ANY":
        if not data.requested_type:
            raise HTTPException(status_code=400, detail={"error_code": "TYPE_REQUIRED"})
        update["slot_type"] = data.requested_type

    supa.table("slots").update(update).eq("id", slot_id).execute()
    updated = supa.table("slots").select("*").eq("id", slot_id).execute().data
    return _slot_to_out(updated[0], supa)


@router.post(
    "/{slot_id}/approve",
    response_model=SlotOut,
    dependencies=[Depends(require_role(Role.admin, Role.superadmin))],
)
def approve_slot(
    slot_id: int,
    wh: WarehouseRow = Depends(get_context_warehouse),
    supa: Client = Depends(get_supabase),
):
    slot_rows = supa.table("slots").select("*").eq("id", slot_id).execute().data
    slot = slot_rows[0] if slot_rows else None
    if not slot or slot["warehouse_id"] != wh.id:
        raise HTTPException(status_code=404, detail={"error_code": "SLOT_NOT_FOUND"})
    if slot["status"] != "BOOKED":
        raise HTTPException(status_code=409, detail={"error_code": "INVALID_STATUS"})

    supa.table("slots").update({"status": "APPROVED_WAITING_DETAILS"}).eq("id", slot_id).execute()
    updated = supa.table("slots").select("*").eq("id", slot_id).execute().data
    return _slot_to_out(updated[0], supa)


@router.post(
    "/{slot_id}/assign-dock",
    response_model=SlotOut,
    dependencies=[Depends(require_role(Role.admin, Role.superadmin))],
)
def assign_dock(
    slot_id: int,
    data: SlotAssignDockIn,
    wh: WarehouseRow = Depends(get_context_warehouse),
    supa: Client = Depends(get_supabase),
):
    slot_rows = supa.table("slots").select("*").eq("id", slot_id).execute().data
    slot = slot_rows[0] if slot_rows else None
    if not slot or slot["warehouse_id"] != wh.id:
        raise HTTPException(status_code=404, detail={"error_code": "SLOT_NOT_FOUND"})

    dock_rows = supa.table("docks").select("*").eq("id", data.dock_id).execute().data
    dock = dock_rows[0] if dock_rows else None
    if not dock or dock["warehouse_id"] != wh.id:
        raise HTTPException(status_code=404, detail={"error_code": "DOCK_NOT_FOUND"})

    conflict = (
        supa.table("slots").select("id")
        .eq("warehouse_id", wh.id)
        .eq("dock_id", data.dock_id)
        .neq("id", slot_id)
        .in_("status", ["BOOKED", "APPROVED_WAITING_DETAILS", "RESERVED_CONFIRMED"])
        .lt("start_dt", slot["end_dt"])
        .gt("end_dt", slot["start_dt"])
        .execute().data
    )
    if conflict:
        raise HTTPException(status_code=409, detail={"error_code": "DOCK_CONFLICT"})

    supa.table("slots").update({"dock_id": data.dock_id}).eq("id", slot_id).execute()
    updated = supa.table("slots").select("*").eq("id", slot_id).execute().data
    return _slot_to_out(updated[0], supa)


@router.post(
    "/{slot_id}/request-cancel",
    response_model=SlotOut,
    dependencies=[Depends(require_role(Role.client))],
)
def request_cancel_slot(
    slot_id: int,
    user: UserRow = Depends(get_current_user),
    wh: WarehouseRow = Depends(get_context_warehouse),
    supa: Client = Depends(get_supabase),
):
    slot_rows = supa.table("slots").select("*").eq("id", slot_id).execute().data
    slot = slot_rows[0] if slot_rows else None
    if not slot or slot["warehouse_id"] != wh.id:
        raise HTTPException(status_code=404, detail={"error_code": "SLOT_NOT_FOUND"})
    if slot["reserved_by_user_id"] != user.id:
        raise HTTPException(status_code=403, detail={"error_code": "FORBIDDEN"})

    CANCELLABLE = {"BOOKED", "APPROVED_WAITING_DETAILS", "RESERVED_CONFIRMED"}
    if slot["status"] not in CANCELLABLE:
        raise HTTPException(status_code=409, detail={"error_code": "INVALID_STATUS"})

    supa.table("slots").update({"previous_status": slot["status"], "status": "CANCEL_PENDING"}).eq("id", slot_id).execute()
    updated = supa.table("slots").select("*").eq("id", slot_id).execute().data
    return _slot_to_out(updated[0], supa)


@router.post(
    "/{slot_id}/reject-cancel",
    response_model=SlotOut,
    dependencies=[Depends(require_role(Role.admin, Role.superadmin))],
)
def reject_cancel_slot(
    slot_id: int,
    wh: WarehouseRow = Depends(get_context_warehouse),
    supa: Client = Depends(get_supabase),
):
    slot_rows = supa.table("slots").select("*").eq("id", slot_id).execute().data
    slot = slot_rows[0] if slot_rows else None
    if not slot or slot["warehouse_id"] != wh.id:
        raise HTTPException(status_code=404, detail={"error_code": "SLOT_NOT_FOUND"})
    if slot["status"] != "CANCEL_PENDING":
        raise HTTPException(status_code=409, detail={"error_code": "INVALID_STATUS"})
    if not slot.get("previous_status"):
        raise HTTPException(status_code=409, detail={"error_code": "NO_PREVIOUS_STATUS"})

    supa.table("slots").update({"status": slot["previous_status"], "previous_status": None}).eq("id", slot_id).execute()
    updated = supa.table("slots").select("*").eq("id", slot_id).execute().data
    return _slot_to_out(updated[0], supa)


@router.post(
    "/{slot_id}/cancel",
    response_model=SlotOut,
    dependencies=[Depends(require_role(Role.admin, Role.superadmin, Role.client))],
)
def cancel_slot(
    slot_id: int,
    user: UserRow = Depends(get_current_user),
    wh: WarehouseRow = Depends(get_context_warehouse),
    supa: Client = Depends(get_supabase),
):
    slot_rows = supa.table("slots").select("*").eq("id", slot_id).execute().data
    slot = slot_rows[0] if slot_rows else None
    if not slot or slot["warehouse_id"] != wh.id:
        raise HTTPException(status_code=404, detail={"error_code": "SLOT_NOT_FOUND"})
    if user.role == Role.client and slot["reserved_by_user_id"] != user.id:
        raise HTTPException(status_code=403, detail={"error_code": "FORBIDDEN"})

    supa.table("slots").update({"status": "CANCELLED", "previous_status": None}).eq("id", slot_id).execute()
    updated = supa.table("slots").select("*").eq("id", slot_id).execute().data
    return _slot_to_out(updated[0], supa)


@router.patch(
    "/{slot_id}",
    response_model=SlotOut,
    dependencies=[Depends(require_role(Role.admin, Role.superadmin))],
)
def patch_slot(
    slot_id: int,
    data: SlotPatch,
    wh: WarehouseRow = Depends(get_context_warehouse),
    supa: Client = Depends(get_supabase),
):
    slot_rows = supa.table("slots").select("*").eq("id", slot_id).execute().data
    slot = slot_rows[0] if slot_rows else None
    if not slot or slot["warehouse_id"] != wh.id:
        raise HTTPException(status_code=404, detail={"error_code": "SLOT_NOT_FOUND"})

    if slot["status"] != "AVAILABLE":
        raise HTTPException(status_code=409, detail={"error_code": "SLOT_NOT_EDITABLE"})

    start_dt = datetime.fromisoformat(slot["start_dt"])
    if start_dt.date() < date.today():
        raise HTTPException(status_code=409, detail={"error_code": "SLOT_IN_PAST"})

    payload = data.model_dump(exclude_unset=True)

    if "start_dt" in payload and "end_dt" in payload:
        if payload["start_dt"] >= payload["end_dt"]:
            raise HTTPException(status_code=400, detail={"error_code": "INVALID_TIME_RANGE"})

    # serialize enums and datetimes for Supabase
    if "slot_type" in payload and hasattr(payload["slot_type"], "value"):
        payload["slot_type"] = payload["slot_type"].value
    if "start_dt" in payload and isinstance(payload["start_dt"], datetime):
        payload["start_dt"] = payload["start_dt"].isoformat()
    if "end_dt" in payload and isinstance(payload["end_dt"], datetime):
        payload["end_dt"] = payload["end_dt"].isoformat()

    supa.table("slots").update(payload).eq("id", slot_id).execute()
    updated = supa.table("slots").select("*").eq("id", slot_id).execute().data
    return _slot_to_out(updated[0], supa)


@router.patch(
    "/{slot_id}/status",
    response_model=SlotOut,
    dependencies=[Depends(require_role(Role.admin, Role.superadmin))],
)
def change_slot_status(
    slot_id: int,
    data: SlotStatusPatch,
    wh: WarehouseRow = Depends(get_context_warehouse),
    supa: Client = Depends(get_supabase),
):
    slot_rows = supa.table("slots").select("*").eq("id", slot_id).execute().data
    slot = slot_rows[0] if slot_rows else None
    if not slot or slot["warehouse_id"] != wh.id:
        raise HTTPException(status_code=404, detail={"error_code": "SLOT_NOT_FOUND"})

    if data.status == SlotStatus.CANCEL_PENDING:
        raise HTTPException(status_code=400, detail={"error_code": "USE_REQUEST_CANCEL_ENDPOINT"})

    update: dict = {"status": data.status.value}
    if data.status == SlotStatus.AVAILABLE:
        update["reserved_by_user_id"] = None
        update["dock_id"] = None

    supa.table("slots").update(update).eq("id", slot_id).execute()
    updated = supa.table("slots").select("*").eq("id", slot_id).execute().data
    return _slot_to_out(updated[0], supa)


@router.delete(
    "",
    status_code=200,
    dependencies=[Depends(require_role(Role.superadmin))],
)
def bulk_delete_slots(
    date_from: str = Query(...),
    date_to: str = Query(...),
    slot_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    wh: WarehouseRow = Depends(get_context_warehouse),
    supa: Client = Depends(get_supabase),
):
    try:
        dt_from = date.fromisoformat(date_from)
        dt_to = date.fromisoformat(date_to)
    except ValueError:
        raise HTTPException(400, detail={"error_code": "INVALID_DATE_RANGE"})

    start_iso = datetime.combine(dt_from, dtime.min).isoformat()
    end_iso = datetime.combine(dt_to, dtime.max).isoformat()

    q = (
        supa.table("slots").select("id")
        .eq("warehouse_id", wh.id)
        .gte("start_dt", start_iso)
        .lte("start_dt", end_iso)
    )
    if slot_type:
        q = q.eq("slot_type", slot_type)
    q = q.eq("status", status if status else "AVAILABLE")

    slot_ids = [s["id"] for s in q.execute().data]
    if slot_ids:
        supa.table("slots").delete().in_("id", slot_ids).execute()
    return {"deleted": len(slot_ids)}


@router.delete(
    "/{slot_id}",
    status_code=204,
    dependencies=[Depends(require_role(Role.superadmin))],
)
def delete_slot(
    slot_id: int,
    wh: WarehouseRow = Depends(get_context_warehouse),
    supa: Client = Depends(get_supabase),
):
    slot_rows = supa.table("slots").select("*").eq("id", slot_id).execute().data
    slot = slot_rows[0] if slot_rows else None
    if not slot or slot["warehouse_id"] != wh.id:
        raise HTTPException(status_code=404, detail={"error_code": "SLOT_NOT_FOUND"})
    if slot["status"] != "AVAILABLE":
        raise HTTPException(status_code=409, detail={"error_code": "SLOT_NOT_AVAILABLE"})
    supa.table("slots").delete().eq("id", slot_id).execute()
