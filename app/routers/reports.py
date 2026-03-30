from __future__ import annotations

from collections import defaultdict
from datetime import date as date_type
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..db import get_db
from .. import models
from ..deps import require_role, get_context_warehouse

router = APIRouter(prefix="/api/reports", tags=["reports"])

_REQUIRE_ADMIN = Depends(require_role(models.Role.admin, models.Role.client))


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------

def _parse_date(value: str, field: str) -> date_type:
    try:
        return date_type.fromisoformat(value)
    except ValueError:
        raise HTTPException(400, detail={"error_code": "INVALID_DATE_RANGE", "field": field})


def _fetch_slots(db: Session, warehouse_id: int, dt_from: date_type, dt_to: date_type) -> list[models.Slot]:
    from sqlalchemy import func
    return (
        db.query(models.Slot)
        .filter(
            models.Slot.warehouse_id == warehouse_id,
            func.date(models.Slot.start_dt) >= dt_from,
            func.date(models.Slot.start_dt) <= dt_to,
        )
        .all()
    )


def _status_counts(slots: list[models.Slot]) -> dict:
    counts: dict[str, int] = defaultdict(int)
    for s in slots:
        counts[s.status.value] += 1
    return counts


def _type_counts(slots: list[models.Slot]) -> dict:
    counts: dict[str, int] = defaultdict(int)
    for s in slots:
        counts[s.original_slot_type.value] += 1
    return counts


def _utilization(total: int, available: int) -> float:
    if total == 0:
        return 0.0
    return round((total - available) / total * 100, 1)


def _build_summary(slots: list[models.Slot]) -> dict:
    sc = _status_counts(slots)
    tc = _type_counts(slots)
    total = len(slots)
    available = sc.get("AVAILABLE", 0)
    return {
        "total": total,
        "available": available,
        "booked": sc.get("BOOKED", 0),
        "approved_waiting_details": sc.get("APPROVED_WAITING_DETAILS", 0),
        "reserved_confirmed": sc.get("RESERVED_CONFIRMED", 0),
        "completed": sc.get("COMPLETED", 0),
        "cancelled": sc.get("CANCELLED", 0),
        "cancel_pending": sc.get("CANCEL_PENDING", 0),
        "inbound": tc.get("INBOUND", 0),
        "outbound": tc.get("OUTBOUND", 0),
        "any": tc.get("ANY", 0),
        "utilization_pct": _utilization(total, available),
    }


# ---------------------------------------------------------------------------
# endpoints
# ---------------------------------------------------------------------------

@router.get("/summary", dependencies=[Depends(require_role(models.Role.admin))])
def report_summary(
    date_from: str = Query(...),
    date_to: str = Query(...),
    wh: models.Warehouse = Depends(get_context_warehouse),
    db: Session = Depends(get_db),
):
    dt_from = _parse_date(date_from, "date_from")
    dt_to = _parse_date(date_to, "date_to")
    slots = _fetch_slots(db, wh.id, dt_from, dt_to)
    return _build_summary(slots)


@router.get("/daily", dependencies=[Depends(require_role(models.Role.admin))])
def report_daily(
    date_from: str = Query(...),
    date_to: str = Query(...),
    wh: models.Warehouse = Depends(get_context_warehouse),
    db: Session = Depends(get_db),
):
    dt_from = _parse_date(date_from, "date_from")
    dt_to = _parse_date(date_to, "date_to")
    slots = _fetch_slots(db, wh.id, dt_from, dt_to)

    by_date: dict[str, list[models.Slot]] = defaultdict(list)
    for slot in slots:
        by_date[slot.start_dt.date().isoformat()].append(slot)

    rows = []
    for day in sorted(by_date.keys()):
        day_slots = by_date[day]
        sc = _status_counts(day_slots)
        tc = _type_counts(day_slots)
        total = len(day_slots)
        available = sc.get("AVAILABLE", 0)
        rows.append({
            "date": day,
            "total": total,
            "available": available,
            "booked": sc.get("BOOKED", 0),
            "approved_waiting_details": sc.get("APPROVED_WAITING_DETAILS", 0),
            "reserved_confirmed": sc.get("RESERVED_CONFIRMED", 0),
            "completed": sc.get("COMPLETED", 0),
            "cancelled": sc.get("CANCELLED", 0),
            "cancel_pending": sc.get("CANCEL_PENDING", 0),
            "inbound": tc.get("INBOUND", 0),
            "outbound": tc.get("OUTBOUND", 0),
            "any": tc.get("ANY", 0),
            "utilization_pct": _utilization(total, available),
        })
    return rows


@router.get("/by-warehouse", dependencies=[Depends(require_role(models.Role.superadmin))])
def report_by_warehouse(
    date_from: str = Query(...),
    date_to: str = Query(...),
    db: Session = Depends(get_db),
):
    from sqlalchemy import func
    dt_from = _parse_date(date_from, "date_from")
    dt_to = _parse_date(date_to, "date_to")

    warehouses = db.query(models.Warehouse).order_by(models.Warehouse.id).all()
    rows = []
    for wh in warehouses:
        slots = _fetch_slots(db, wh.id, dt_from, dt_to)
        if not slots:
            continue
        sc = _status_counts(slots)
        tc = _type_counts(slots)
        total = len(slots)
        available = sc.get("AVAILABLE", 0)
        rows.append({
            "warehouse_id": wh.id,
            "warehouse_name": wh.name,
            "warehouse_alias": wh.alias,
            "total": total,
            "available": available,
            "booked": sc.get("BOOKED", 0),
            "approved_waiting_details": sc.get("APPROVED_WAITING_DETAILS", 0),
            "reserved_confirmed": sc.get("RESERVED_CONFIRMED", 0),
            "completed": sc.get("COMPLETED", 0),
            "cancelled": sc.get("CANCELLED", 0),
            "cancel_pending": sc.get("CANCEL_PENDING", 0),
            "inbound": tc.get("INBOUND", 0),
            "outbound": tc.get("OUTBOUND", 0),
            "any": tc.get("ANY", 0),
            "utilization_pct": _utilization(total, available),
        })
    return rows


@router.get("/by-company", dependencies=[Depends(require_role(models.Role.admin))])
def report_by_company(
    date_from: str = Query(...),
    date_to: str = Query(...),
    wh: models.Warehouse = Depends(get_context_warehouse),
    db: Session = Depends(get_db),
):
    dt_from = _parse_date(date_from, "date_from")
    dt_to = _parse_date(date_to, "date_to")
    slots = _fetch_slots(db, wh.id, dt_from, dt_to)

    # collect user_ids that reserved slots
    user_ids = {s.reserved_by_user_id for s in slots if s.reserved_by_user_id}
    if not user_ids:
        return []

    # load users + companies in two queries
    users = {u.id: u for u in db.query(models.User).filter(models.User.id.in_(user_ids)).all()}
    company_ids = {u.company_id for u in users.values() if u.company_id}
    companies = {c.id: c for c in db.query(models.Company).filter(models.Company.id.in_(company_ids)).all()}

    # group slots by company
    by_company: dict[int, list[models.Slot]] = defaultdict(list)
    for slot in slots:
        if not slot.reserved_by_user_id:
            continue
        user = users.get(slot.reserved_by_user_id)
        if not user or not user.company_id:
            continue
        by_company[user.company_id].append(slot)

    rows = []
    for company_id, c_slots in by_company.items():
        company = companies.get(company_id)
        if not company:
            continue
        sc = _status_counts(c_slots)
        tc = _type_counts(c_slots)
        active = (
            sc.get("BOOKED", 0)
            + sc.get("APPROVED_WAITING_DETAILS", 0)
            + sc.get("RESERVED_CONFIRMED", 0)
            + sc.get("CANCEL_PENDING", 0)
        )
        rows.append({
            "company_id": company_id,
            "company_name": company.name,
            "company_alias": company.alias,
            "total_reservations": len(c_slots),
            "completed": sc.get("COMPLETED", 0),
            "cancelled": sc.get("CANCELLED", 0),
            "active": active,
            "inbound": tc.get("INBOUND", 0),
            "outbound": tc.get("OUTBOUND", 0),
            "any": tc.get("ANY", 0),
        })

    rows.sort(key=lambda r: r["total_reservations"], reverse=True)
    return rows
