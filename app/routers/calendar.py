from __future__ import annotations

from datetime import date, datetime, time as dtime, timedelta
from zoneinfo import ZoneInfo
from typing import List

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from supabase import Client

from ..supabase_client import get_supabase
from .. import models
from ..deps import require_role, get_context_warehouse

router = APIRouter(prefix="/api/calendar", tags=["calendar"])

WARSAW = ZoneInfo("Europe/Warsaw")


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
    supa: Client = Depends(get_supabase),
):
    start_dt = datetime.combine(date_from, dtime.min, tzinfo=WARSAW)
    end_dt = datetime.combine(date_to, dtime.max, tzinfo=WARSAW)

    # Pobieramy tylko potrzebne kolumny, aby zminimalizować transfer danych
    response = (
        supa.table("slots")
        .select("start_dt, status")
        .eq("warehouse_id", wh.id)
        .gte("start_dt", start_dt.isoformat())
        .lte("start_dt", end_dt.isoformat())
        .execute()
    )
    rows = response.data

    # Agregacja per dzień
    agg: dict[date, dict] = {}
    d = date_from
    while d <= date_to:
        agg[d] = {"total": 0, "available": 0, "booked": 0, "completed": 0, "cancelled": 0}
        d += timedelta(days=1)

    BOOKED_STATUSES = {
        models.SlotStatus.PENDING_CONFIRMATION,
        models.SlotStatus.CONFIRMED,
        models.SlotStatus.BOOKED,  # Legacy
        models.SlotStatus.APPROVED_WAITING_DETAILS,  # Legacy
        models.SlotStatus.RESERVED_CONFIRMED,  # Legacy
        models.SlotStatus.CANCEL_PENDING,
    }

    for row in rows:
        # Supabase zwraca daty jako stringi ISO (np. "2026-03-31T10:00:00+00:00")
        dt_str = row["start_dt"].replace("Z", "+00:00")
        dt_obj = datetime.fromisoformat(dt_str).astimezone(WARSAW)
        day = dt_obj.date()
        
        if day not in agg:
            continue
            
        try:
            status = models.SlotStatus(row["status"])
        except ValueError:
            continue  # Pomijamy w przypadku nieznanego statusu w bazie
            
        agg[day]["total"] += 1
        
        if status == models.SlotStatus.AVAILABLE:
            agg[day]["available"] += 1
        elif status in BOOKED_STATUSES:
            agg[day]["booked"] += 1
        elif status == models.SlotStatus.COMPLETED:
            agg[day]["completed"] += 1
        elif status == models.SlotStatus.CANCELLED:
            agg[day]["cancelled"] += 1

    return [
        CalendarDaySummary(date=d, **agg[d])
        for d in sorted(agg)
    ]