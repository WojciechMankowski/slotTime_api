from __future__ import annotations

from datetime import date, datetime, time as dtime, timedelta
from typing import List

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..db import get_db
from .. import models
from ..deps import get_current_user, require_role, get_context_warehouse

router = APIRouter(prefix="/api/calendar", tags=["calendar"])


class CalendarDaySummary(BaseModel):
    date: date
    total: int
    available: int
    booked: int          # BOOKED + APPROVED_WAITING_DETAILS + RESERVED_CONFIRMED + CANCEL_PENDING
    completed: int
    cancelled: int

    model_config = {"from_attributes": True}


@router.get(
    "/summary",
    response_model=List[CalendarDaySummary],
    dependencies=[Depends(require_role(models.Role.admin, models.Role.superadmin))],
)
def calendar_summary(
    date_from: date,
    date_to: date,
    wh: models.Warehouse = Depends(get_context_warehouse),
    db: Session = Depends(get_db),
):
    start_dt = datetime.combine(date_from, dtime.min)
    end_dt = datetime.combine(date_to, dtime.max)

    rows = (
        db.query(
            func.date(models.Slot.start_dt).label("day"),
            models.Slot.status,
            func.count(models.Slot.id).label("cnt"),
        )
        .filter(
            models.Slot.warehouse_id == wh.id,
            models.Slot.start_dt >= start_dt,
            models.Slot.start_dt <= end_dt,
        )
        .group_by(func.date(models.Slot.start_dt), models.Slot.status)
        .all()
    )

    # Aggregate per day
    agg: dict[date, dict] = {}
    d = date_from
    while d <= date_to:
        agg[d] = {"total": 0, "available": 0, "booked": 0, "completed": 0, "cancelled": 0}
        d += timedelta(days=1)

    BOOKED_STATUSES = {
        models.SlotStatus.BOOKED,
        models.SlotStatus.APPROVED_WAITING_DETAILS,
        models.SlotStatus.RESERVED_CONFIRMED,
        models.SlotStatus.CANCEL_PENDING,
    }

    for row in rows:
        day = row.day if isinstance(row.day, date) else date.fromisoformat(str(row.day))
        if day not in agg:
            continue
        cnt = row.cnt
        agg[day]["total"] += cnt
        if row.status == models.SlotStatus.AVAILABLE:
            agg[day]["available"] += cnt
        elif row.status in BOOKED_STATUSES:
            agg[day]["booked"] += cnt
        elif row.status == models.SlotStatus.COMPLETED:
            agg[day]["completed"] += cnt
        elif row.status == models.SlotStatus.CANCELLED:
            agg[day]["cancelled"] += cnt

    return [
        CalendarDaySummary(date=d, **agg[d])
        for d in sorted(agg)
    ]
