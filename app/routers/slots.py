from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from datetime import datetime, date, timedelta, time as dtime
from typing import List, Optional, Tuple

from ..db import get_db
from .. import models
from ..deps import get_current_user, require_role, get_context_warehouse
from ..schemas import (
    SlotOut,
    SlotPatch,
    SlotReserveIn,
    SlotAssignDockIn,
    SlotGenerateIn,
    SlotGenerateOut,
    SlotGenerateDayReport, SlotStatusPatch,
)

router = APIRouter(prefix="/api/slots", tags=["slots"])


# =========================================================
# Helpers
# =========================================================

def slot_to_out(slot: models.Slot, db: Session) -> SlotOut:
    dock_alias = slot.dock.alias if slot.dock else None

    reserved_by_alias = None
    reserved_by_company_alias = None
    if slot.reserved_by_user_id:
        u = db.get(models.User, slot.reserved_by_user_id)
        if u:
            reserved_by_alias = u.alias
            if u.company_id:
                c = db.get(models.Company, u.company_id)
                reserved_by_company_alias = c.alias if c else None

    return SlotOut(
        id=slot.id,
        start_dt=slot.start_dt,
        end_dt=slot.end_dt,
        slot_type=slot.slot_type,
        original_slot_type=slot.original_slot_type,
        status=slot.status,
        dock_id=slot.dock_id,
        dock_alias=dock_alias,
        reserved_by_user_id=slot.reserved_by_user_id,
        reserved_by_alias=reserved_by_alias,
        reserved_by_company_alias=reserved_by_company_alias,
    )


def _parse_time(value: Optional[object], field_name: str) -> Optional[dtime]:
    """
    We accept:
    - None
    - string "HH:MM" or "HH:MM:SS"
    - datetime.time (if pydantic ever gives you that)
    """
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
    wh: models.Warehouse,
    db: Session,
) -> Tuple[dtime, dtime, int, models.SlotType, int, Optional[int], Optional[str]]:
    """
    Returns:
      start_time, end_time, interval_minutes, slot_type, parallel_slots, template_id, template_name
    Logic:
      - If template_id provided -> base params from template
      - Manual fields override template fields (if provided)
    """
    template_id = data.template_id
    template_name = None

    start_time = _parse_time(data.start_time, "start_time")
    end_time = _parse_time(data.end_time, "end_time")
    interval = data.interval_minutes
    slot_type = data.slot_type
    parallel_slots = data.parallel_slots if data.parallel_slots is not None else 1

    if template_id is not None:
        t = db.get(models.SlotTemplate, template_id)
        if not t or t.warehouse_id != wh.id:
            raise HTTPException(status_code=404, detail={"error_code": "TEMPLATE_NOT_FOUND"})
        if hasattr(t, "is_active") and not t.is_active:
            raise HTTPException(status_code=409, detail={"error_code": "TEMPLATE_INACTIVE"})

        template_name = getattr(t, "name", None)

        # template base
        tpl_start = dtime(hour=int(t.start_hour), minute=0)
        tpl_end_hour = int(t.end_hour)
        tpl_end = dtime(hour=23, minute=59) if tpl_end_hour >= 24 else dtime(hour=tpl_end_hour, minute=0)

        tpl_interval = int(t.slot_minutes)
        tpl_type = t.slot_type  # SlotType enum

        # apply base if manual not provided
        if start_time is None:
            start_time = tpl_start
        if end_time is None:
            end_time = tpl_end
        if interval is None:
            interval = tpl_interval
        if slot_type is None:
            slot_type = tpl_type

    # If still missing -> manual mode requires them
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

    # validate
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
    dependencies=[Depends(require_role(models.Role.admin, getattr(models.Role, "superadmin", models.Role.admin), models.Role.client))],
)
def list_slots(
    date_from: date,
    date_to: date,
    status: Optional[str] = Query(None),
    user: models.User = Depends(get_current_user),
    wh: models.Warehouse = Depends(get_context_warehouse),
    db: Session = Depends(get_db),
):
    start = datetime.combine(date_from, dtime.min)
    end = datetime.combine(date_to, dtime.max)

    query = db.query(models.Slot).filter(
        models.Slot.warehouse_id == wh.id,
        models.Slot.start_dt >= start,
        models.Slot.start_dt <= end,
    )

    if status:
        try:
            parsed_status = models.SlotStatus[status.upper()]
        except KeyError:
            raise HTTPException(status_code=400, detail={"error_code": "INVALID_STATUS_FILTER"})
        query = query.filter(models.Slot.status == parsed_status)

    slots = query.order_by(models.Slot.start_dt).all()

    if user.role == models.Role.client:
        company = db.get(models.Company, user.company_id) if user.company_id else None
        if not company or not company.is_active:
            raise HTTPException(status_code=403, detail={"error_code": "COMPANY_INACTIVE"})

    return [slot_to_out(s, db) for s in slots]


# =========================================================
# ARCHIVE (COMPLETED / CANCELLED)
# =========================================================

@router.get(
    "/archive",
    response_model=List[SlotOut],
    dependencies=[Depends(require_role(models.Role.admin, models.Role.superadmin, models.Role.client))],
)
def list_archive(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    status: Optional[str] = Query(None, description="COMPLETED | CANCELLED | ALL (domyślnie COMPLETED)"),
    user: models.User = Depends(get_current_user),
    wh: models.Warehouse = Depends(get_context_warehouse),
    db: Session = Depends(get_db),
):
    # dozwolone statusy archiwum
    ARCHIVE_STATUSES = {models.SlotStatus.COMPLETED, models.SlotStatus.CANCELLED}

    if status and status.upper() == "ALL":
        filter_statuses = list(ARCHIVE_STATUSES)
    elif status:
        try:
            parsed = models.SlotStatus[status.upper()]
        except KeyError:
            raise HTTPException(status_code=400, detail={"error_code": "INVALID_STATUS"})
        if parsed not in ARCHIVE_STATUSES:
            raise HTTPException(status_code=400, detail={"error_code": "INVALID_STATUS"})
        filter_statuses = [parsed]
    else:
        filter_statuses = [models.SlotStatus.COMPLETED]

    filters = [
        models.Slot.warehouse_id == wh.id,
        models.Slot.status.in_(filter_statuses),
    ]

    if date_from:
        filters.append(models.Slot.start_dt >= datetime.combine(date_from, dtime.min))
    if date_to:
        filters.append(models.Slot.start_dt <= datetime.combine(date_to, dtime.max))

    # klient widzi tylko swoje sloty
    if user.role == models.Role.client:
        filters.append(models.Slot.reserved_by_user_id == user.id)

    slots = (
        db.query(models.Slot)
        .filter(*filters)
        .order_by(models.Slot.start_dt.desc())
        .all()
    )

    return [slot_to_out(s, db) for s in slots]


# =========================================================
# GENERATE (MANUAL + TEMPLATE, NO DUPLICATES)
# =========================================================

@router.post(
    "/generate",
    response_model=SlotGenerateOut,
    dependencies=[Depends(require_role(models.Role.admin, getattr(models.Role, "superadmin", models.Role.admin)))],
)
def generate_slots(
    data: SlotGenerateIn,
    wh: models.Warehouse = Depends(get_context_warehouse),
    db: Session = Depends(get_db),
):
    # date validation
    if data.date_from > data.date_to:
        raise HTTPException(status_code=400, detail={"error_code": "INVALID_DATE_RANGE"})

    start_time, end_time, interval_minutes, slot_type, parallel_slots, template_id, template_name = _resolve_generate_params(
        data, wh, db
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

        # optional daily capacity per (date, slot_type)
        cap_val: Optional[int] = None
        cap_obj = None
        if hasattr(models, "DayCapacity"):
            cap_obj = (
                db.query(models.DayCapacity)
                .filter(
                    models.DayCapacity.warehouse_id == wh.id,
                    models.DayCapacity.date == d,
                    models.DayCapacity.slot_type == slot_type,
                )
                .first()
            )
            cap_val = int(cap_obj.capacity) if cap_obj else None

        # how many already exist for that day+type (dock NULL) -> counts against capacity
        existing_day_count = (
            db.query(models.Slot)
            .filter(
                models.Slot.warehouse_id == wh.id,
                models.Slot.dock_id.is_(None),
                models.Slot.slot_type == slot_type,
                models.Slot.start_dt >= datetime.combine(d, dtime.min),
                models.Slot.start_dt <= datetime.combine(d, dtime.max),
            )
            .count()
        )

        remaining_capacity = None if cap_val is None else max(0, cap_val - existing_day_count)

        cur = day_start
        while cur + delta <= day_end:
            # user "requests" parallel_slots for each interval
            requested += parallel_slots

            # duplicates check: how many already exist for this exact interval/type (dock NULL)
            existing_interval_count = (
                db.query(models.Slot)
                .filter(
                    models.Slot.warehouse_id == wh.id,
                    models.Slot.dock_id.is_(None),
                    models.Slot.start_dt == cur,
                    models.Slot.end_dt == cur + delta,
                    models.Slot.slot_type == slot_type,
                )
                .count()
            )

            to_create = max(0, parallel_slots - existing_interval_count)

            # capacity clamp
            if remaining_capacity is not None:
                if remaining_capacity <= 0:
                    # no capacity left => skip all requested in this interval
                    skipped += to_create
                    cur += delta
                    continue
                if to_create > remaining_capacity:
                    # create only part
                    skipped += (to_create - remaining_capacity)
                    to_create = remaining_capacity

            # create
            for _ in range(to_create):
                slot = models.Slot(
                    warehouse_id=wh.id,
                    dock_id=None,
                    start_dt=cur,
                    end_dt=cur + delta,
                    slot_type=slot_type,
                    original_slot_type=slot_type,
                    status=models.SlotStatus.AVAILABLE,
                    reserved_by_user_id=None,
                )
                db.add(slot)
                generated += 1
                if remaining_capacity is not None:
                    remaining_capacity -= 1

            skipped += max(0, parallel_slots - existing_interval_count - to_create)

            cur += delta

        db.commit()

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
    dependencies=[Depends(require_role(models.Role.client))],
)
def reserve_slot(
    slot_id: int,
    data: SlotReserveIn,
    user: models.User = Depends(get_current_user),
    wh: models.Warehouse = Depends(get_context_warehouse),
    db: Session = Depends(get_db),
):
    slot = db.get(models.Slot, slot_id)
    if not slot or slot.warehouse_id != wh.id:
        raise HTTPException(status_code=404, detail={"error_code": "SLOT_NOT_FOUND"})

    company = db.get(models.Company, user.company_id) if user.company_id else None
    if not company or not company.is_active:
        raise HTTPException(status_code=403, detail={"error_code": "COMPANY_INACTIVE"})

    if slot.status != models.SlotStatus.AVAILABLE:
        raise HTTPException(status_code=409, detail={"error_code": "SLOT_NOT_AVAILABLE"})

    # ANY needs requested_type
    if slot.slot_type == models.SlotType.ANY:
        if not data.requested_type:
            raise HTTPException(status_code=400, detail={"error_code": "TYPE_REQUIRED"})
        slot.slot_type = models.SlotType[data.requested_type]

    slot.status = models.SlotStatus.BOOKED
    slot.reserved_by_user_id = user.id
    db.commit()
    db.refresh(slot)
    return slot_to_out(slot, db)


@router.post(
    "/{slot_id}/approve",
    response_model=SlotOut,
    dependencies=[Depends(require_role(models.Role.admin, getattr(models.Role, "superadmin", models.Role.admin)))],
)
def approve_slot(
    slot_id: int,
    wh: models.Warehouse = Depends(get_context_warehouse),
    db: Session = Depends(get_db),
):
    slot = db.get(models.Slot, slot_id)
    if not slot or slot.warehouse_id != wh.id:
        raise HTTPException(status_code=404, detail={"error_code": "SLOT_NOT_FOUND"})
    if slot.status != models.SlotStatus.BOOKED:
        raise HTTPException(status_code=409, detail={"error_code": "INVALID_STATUS"})

    slot.status = models.SlotStatus.APPROVED_WAITING_DETAILS
    db.commit()
    db.refresh(slot)
    return slot_to_out(slot, db)


@router.post(
    "/{slot_id}/assign-dock",
    response_model=SlotOut,
    dependencies=[Depends(require_role(models.Role.admin, getattr(models.Role, "superadmin", models.Role.admin)))],
)
def assign_dock(
    slot_id: int,
    data: SlotAssignDockIn,
    wh: models.Warehouse = Depends(get_context_warehouse),
    db: Session = Depends(get_db),
):
    slot = db.get(models.Slot, slot_id)
    if not slot or slot.warehouse_id != wh.id:
        raise HTTPException(status_code=404, detail={"error_code": "SLOT_NOT_FOUND"})

    dock = db.get(models.Dock, data.dock_id)
    if not dock or dock.warehouse_id != wh.id:
        raise HTTPException(status_code=404, detail={"error_code": "DOCK_NOT_FOUND"})

    # block conflicts for "active" statuses
    conflict = (
        db.query(models.Slot)
        .filter(
            models.Slot.warehouse_id == wh.id,
            models.Slot.dock_id == dock.id,
            models.Slot.id != slot.id,
            models.Slot.status.in_(
                [
                    models.SlotStatus.BOOKED,
                    models.SlotStatus.APPROVED_WAITING_DETAILS,
                    getattr(models.SlotStatus, "RESERVED_CONFIRMED", models.SlotStatus.BOOKED),
                ]
            ),
            or_(
                and_(models.Slot.start_dt < slot.end_dt, models.Slot.end_dt > slot.start_dt),
            ),
        )
        .first()
    )
    if conflict:
        raise HTTPException(status_code=409, detail={"error_code": "DOCK_CONFLICT"})

    slot.dock_id = dock.id
    db.commit()
    db.refresh(slot)
    return slot_to_out(slot, db)


@router.post(
    "/{slot_id}/request-cancel",
    response_model=SlotOut,
    dependencies=[Depends(require_role(models.Role.client))],
)
def request_cancel_slot(
    slot_id: int,
    user: models.User = Depends(get_current_user),
    wh: models.Warehouse = Depends(get_context_warehouse),
    db: Session = Depends(get_db),
):
    slot = db.get(models.Slot, slot_id)
    if not slot or slot.warehouse_id != wh.id:
        raise HTTPException(status_code=404, detail={"error_code": "SLOT_NOT_FOUND"})
    if slot.reserved_by_user_id != user.id:
        raise HTTPException(status_code=403, detail={"error_code": "FORBIDDEN"})

    CANCELLABLE = {
        models.SlotStatus.BOOKED,
        models.SlotStatus.APPROVED_WAITING_DETAILS,
        models.SlotStatus.RESERVED_CONFIRMED,
    }
    if slot.status not in CANCELLABLE:
        raise HTTPException(status_code=409, detail={"error_code": "INVALID_STATUS"})

    slot.previous_status = slot.status
    slot.status = models.SlotStatus.CANCEL_PENDING
    db.commit()
    db.refresh(slot)
    return slot_to_out(slot, db)


@router.post(
    "/{slot_id}/reject-cancel",
    response_model=SlotOut,
    dependencies=[Depends(require_role(models.Role.admin, models.Role.superadmin))],
)
def reject_cancel_slot(
    slot_id: int,
    wh: models.Warehouse = Depends(get_context_warehouse),
    db: Session = Depends(get_db),
):
    slot = db.get(models.Slot, slot_id)
    if not slot or slot.warehouse_id != wh.id:
        raise HTTPException(status_code=404, detail={"error_code": "SLOT_NOT_FOUND"})
    if slot.status != models.SlotStatus.CANCEL_PENDING:
        raise HTTPException(status_code=409, detail={"error_code": "INVALID_STATUS"})
    if not slot.previous_status:
        raise HTTPException(status_code=409, detail={"error_code": "NO_PREVIOUS_STATUS"})

    slot.status = slot.previous_status
    slot.previous_status = None
    db.commit()
    db.refresh(slot)
    return slot_to_out(slot, db)


@router.post(
    "/{slot_id}/cancel",
    response_model=SlotOut,
    dependencies=[Depends(require_role(models.Role.admin, getattr(models.Role, "superadmin", models.Role.admin), models.Role.client))],
)
def cancel_slot(
    slot_id: int,
    user: models.User = Depends(get_current_user),
    wh: models.Warehouse = Depends(get_context_warehouse),
    db: Session = Depends(get_db),
):
    slot = db.get(models.Slot, slot_id)
    if not slot or slot.warehouse_id != wh.id:
        raise HTTPException(status_code=404, detail={"error_code": "SLOT_NOT_FOUND"})
    if user.role == models.Role.client and slot.reserved_by_user_id != user.id:
        raise HTTPException(status_code=403, detail={"error_code": "FORBIDDEN"})

    slot.status = models.SlotStatus.CANCELLED
    slot.previous_status = None
    db.commit()
    db.refresh(slot)
    return slot_to_out(slot, db)



@router.patch(
    "/{slot_id}",
    response_model=SlotOut,
    dependencies=[Depends(require_role(models.Role.admin, models.Role.superadmin))],
)
def patch_slot(
    slot_id: int,
    data: SlotPatch,
    wh: models.Warehouse = Depends(get_context_warehouse),
    db: Session = Depends(get_db),
):
    slot = db.get(models.Slot, slot_id)
    if not slot or slot.warehouse_id != wh.id:
        raise HTTPException(status_code=404, detail={"error_code": "SLOT_NOT_FOUND"})

    # tylko AVAILABLE sloty można edytować
    if slot.status != models.SlotStatus.AVAILABLE:
        raise HTTPException(status_code=409, detail={"error_code": "SLOT_NOT_EDITABLE"})

    # tylko dzisiaj i w przyszłości
    if slot.start_dt.date() < date.today():
        raise HTTPException(status_code=409, detail={"error_code": "SLOT_IN_PAST"})

    payload = data.model_dump(exclude_unset=True)

    if "start_dt" in payload and "end_dt" in payload:
        if payload["start_dt"] >= payload["end_dt"]:
            raise HTTPException(status_code=400, detail={"error_code": "INVALID_TIME_RANGE"})

    for k, v in payload.items():
        setattr(slot, k, v)

    db.commit()
    db.refresh(slot)
    return slot_to_out(slot, db)

@router.patch(
    "/{slot_id}/status",
    response_model=SlotOut,
    dependencies=[Depends(require_role(models.Role.admin, models.Role.superadmin))],
)
def change_slot_status(
    slot_id: int,
    data: SlotStatusPatch,
    wh: models.Warehouse = Depends(get_context_warehouse),
    db: Session = Depends(get_db),
):
    slot = db.get(models.Slot, slot_id)
    if not slot or slot.warehouse_id != wh.id:
        raise HTTPException(status_code=404, detail={"error_code": "SLOT_NOT_FOUND"})

    if data.status == models.SlotStatus.CANCEL_PENDING:
        raise HTTPException(status_code=400, detail={"error_code": "USE_REQUEST_CANCEL_ENDPOINT"})

    slot.status = data.status

    # jeśli cofamy do AVAILABLE, czyścimy rezerwację
    if data.status == models.SlotStatus.AVAILABLE:
        slot.reserved_by_user_id = None
        slot.reserved_by_company_id = None
        slot.dock_id = None

    db.commit()
    db.refresh(slot)
    return slot_to_out(slot, db)


@router.delete(
    "",
    status_code=200,
    dependencies=[Depends(require_role(models.Role.superadmin))],
)
def bulk_delete_slots(
    date_from: str = Query(...),
    date_to: str = Query(...),
    slot_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    wh: models.Warehouse = Depends(get_context_warehouse),
    db: Session = Depends(get_db),
):
    try:
        dt_from = date.fromisoformat(date_from)
        dt_to = date.fromisoformat(date_to)
    except ValueError:
        raise HTTPException(400, detail={"error_code": "INVALID_DATE_RANGE"})

    q = db.query(models.Slot).filter(
        models.Slot.warehouse_id == wh.id,
        func.date(models.Slot.start_dt) >= dt_from,
        func.date(models.Slot.start_dt) <= dt_to,
    )
    if slot_type:
        q = q.filter(models.Slot.slot_type == slot_type)
    if status:
        q = q.filter(models.Slot.status == status)
    else:
        q = q.filter(models.Slot.status == models.SlotStatus.AVAILABLE)

    slots_to_delete = q.all()
    count = len(slots_to_delete)
    for slot in slots_to_delete:
        db.delete(slot)
    db.commit()
    return {"deleted": count}


@router.delete(
    "/{slot_id}",
    status_code=204,
    dependencies=[Depends(require_role(models.Role.superadmin))],
)
def delete_slot(
    slot_id: int,
    wh: models.Warehouse = Depends(get_context_warehouse),
    db: Session = Depends(get_db),
):
    slot = db.get(models.Slot, slot_id)
    if not slot or slot.warehouse_id != wh.id:
        raise HTTPException(status_code=404, detail={"error_code": "SLOT_NOT_FOUND"})
    if slot.status != models.SlotStatus.AVAILABLE:
        raise HTTPException(status_code=409, detail={"error_code": "SLOT_NOT_AVAILABLE"})
    db.delete(slot)
    db.commit()