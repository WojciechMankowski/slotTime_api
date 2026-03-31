from __future__ import annotations

from collections import defaultdict
from datetime import date as date_type, datetime, time as dtime
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from supabase import Client

from ..supabase_client import get_supabase
from ..deps import require_role, get_context_warehouse
from ..schemas import WarehouseRow
from ..enums import Role

router = APIRouter(prefix="/api/reports", tags=["reports"])


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------

def _parse_date(value: str, field: str) -> date_type:
    try:
        return date_type.fromisoformat(value)
    except ValueError:
        raise HTTPException(status_code=400, detail={"error_code": "INVALID_DATE_RANGE", "field": field})


def _fetch_slots(supa: Client, warehouse_id: Optional[int], dt_from: date_type, dt_to: date_type) -> List[Dict[str, Any]]:
    """Pobiera sloty w określonym przedziale czasowym. Opcjonalnie filtruje po ID magazynu."""
    start = datetime.combine(dt_from, dtime.min).isoformat()
    end = datetime.combine(dt_to, dtime.max).isoformat()
    
    q = supa.table("slots").select("*").gte("start_dt", start).lte("start_dt", end)
    if warehouse_id is not None:
        q = q.eq("warehouse_id", warehouse_id)
        
    return q.execute().data


def _status_counts(slots: List[Dict[str, Any]]) -> dict:
    counts: dict[str, int] = defaultdict(int)
    for s in slots:
        status = s.get("status")
        if status:
            counts[status] += 1
    return counts


def _type_counts(slots: List[Dict[str, Any]]) -> dict:
    counts: dict[str, int] = defaultdict(int)
    for s in slots:
        slot_type = s.get("original_slot_type")
        if slot_type:
            counts[slot_type] += 1
    return counts


def _utilization(total: int, available: int) -> float:
    if total == 0:
        return 0.0
    return round((total - available) / total * 100, 1)


def _build_summary(slots: List[Dict[str, Any]]) -> dict:
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

@router.get("/summary", dependencies=[Depends(require_role(Role.admin))])
def report_summary(
    date_from: str = Query(...),
    date_to: str = Query(...),
    wh: WarehouseRow = Depends(get_context_warehouse),
    supa: Client = Depends(get_supabase),
):
    try:
        dt_from = _parse_date(date_from, "date_from")
        dt_to = _parse_date(date_to, "date_to")
        slots = _fetch_slots(supa, wh.id, dt_from, dt_to)
        return _build_summary(slots)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"error_code": "DATABASE_ERROR"})


@router.get("/daily", dependencies=[Depends(require_role(Role.admin))])
def report_daily(
    date_from: str = Query(...),
    date_to: str = Query(...),
    wh: WarehouseRow = Depends(get_context_warehouse),
    supa: Client = Depends(get_supabase),
):
    try:
        dt_from = _parse_date(date_from, "date_from")
        dt_to = _parse_date(date_to, "date_to")
        slots = _fetch_slots(supa, wh.id, dt_from, dt_to)

        by_date: dict[str, list] = defaultdict(list)
        for slot in slots:
            dt_str = slot.get("start_dt")
            if dt_str:
                # Bezpieczne parsowanie daty ISO z Supabase do formatu YYYY-MM-DD
                dt_obj = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
                day_iso = dt_obj.date().isoformat()
                by_date[day_iso].append(slot)

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
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"error_code": "DATABASE_ERROR"})


@router.get("/by-warehouse", dependencies=[Depends(require_role(Role.superadmin))])
def report_by_warehouse(
    date_from: str = Query(...),
    date_to: str = Query(...),
    supa: Client = Depends(get_supabase),
):
    try:
        dt_from = _parse_date(date_from, "date_from")
        dt_to = _parse_date(date_to, "date_to")

        wh_data = supa.table("warehouses").select("id, name, alias").order("id").execute().data
        if not wh_data:
            return []

        # Pobieramy zbiorczo wszystkie sloty dla całego systemu bez podziału na zapytania
        slots = _fetch_slots(supa, None, dt_from, dt_to)
        
        # Grupowanie po ID magazynu w pamięci (znacznie wydajniejsze)
        by_wh: dict[int, list] = defaultdict(list)
        for s in slots:
            wh_id = s.get("warehouse_id")
            if wh_id is not None:
                by_wh[wh_id].append(s)

        rows = []
        for wh in wh_data:
            wh_slots = by_wh.get(wh["id"], [])
            if not wh_slots:
                continue
                
            sc = _status_counts(wh_slots)
            tc = _type_counts(wh_slots)
            total = len(wh_slots)
            available = sc.get("AVAILABLE", 0)
            rows.append({
                "warehouse_id": wh["id"],
                "warehouse_name": wh.get("name"),
                "warehouse_alias": wh.get("alias"),
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
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"error_code": "DATABASE_ERROR"})


@router.get("/by-company", dependencies=[Depends(require_role(Role.admin))])
def report_by_company(
    date_from: str = Query(...),
    date_to: str = Query(...),
    wh: WarehouseRow = Depends(get_context_warehouse),
    supa: Client = Depends(get_supabase),
):
    try:
        dt_from = _parse_date(date_from, "date_from")
        dt_to = _parse_date(date_to, "date_to")
        slots = _fetch_slots(supa, wh.id, dt_from, dt_to)

        user_ids = list({s["reserved_by_user_id"] for s in slots if s.get("reserved_by_user_id")})
        if not user_ids:
            return []

        # Pobieranie powiązanych danych grupowo (eliminacja zapytań w pętli)
        users_data = supa.table("users").select("id, company_id").in_("id", user_ids).execute().data
        users_map = {u["id"]: u for u in users_data}

        company_ids = list({u["company_id"] for u in users_data if u.get("company_id")})
        companies_map = {}
        if company_ids:
            companies_data = supa.table("companies").select("id, name, alias").in_("id", company_ids).execute().data
            companies_map = {c["id"]: c for c in companies_data}

        by_company: dict[int, list] = defaultdict(list)
        for slot in slots:
            u_id = slot.get("reserved_by_user_id")
            if not u_id or u_id not in users_map:
                continue
                
            c_id = users_map[u_id].get("company_id")
            if not c_id:
                continue
                
            by_company[c_id].append(slot)

        rows = []
        for company_id, c_slots in by_company.items():
            company = companies_map.get(company_id)
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
                "company_name": company.get("name"),
                "company_alias": company.get("alias"),
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
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"error_code": "DATABASE_ERROR"})