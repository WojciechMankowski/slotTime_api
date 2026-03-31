from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from datetime import date

from ..supabase_client import get_supabase
from .. import models
from ..deps import require_role, get_context_warehouse
from ..schemas import DayCapacityOut, DayCapacityUpsert, WarehouseRow

# Używamy WarehouseRow zamiast models.Warehouse, jeśli całkowicie odchodzimy od modeli SQLAlchemy
router = APIRouter(
    prefix="/api/day-capacity", 
    tags=["day-capacity"], 
    dependencies=[Depends(require_role(models.Role.admin))]
)

@router.get("", response_model=list[DayCapacityOut])
def list_caps(
    date_from: date,
    date_to: date,
    wh: WarehouseRow = Depends(get_context_warehouse),
    supa: Client = Depends(get_supabase),
):
    try:
        response = (
            supa.table("day_capacity")
            .select("*")
            .eq("warehouse_id", wh.id)
            .gte("date", date_from.isoformat())
            .lte("date", date_to.isoformat())
            .order("date")
            .execute()
        )
        return response.data
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
            detail={"error_code": "DATABASE_ERROR"}
        )

@router.post("", response_model=DayCapacityOut)
def upsert_cap(
    data: DayCapacityUpsert,
    wh: WarehouseRow = Depends(get_context_warehouse),
    supa: Client = Depends(get_supabase),
):
    try:
        # Krok 1: Sprawdzenie, czy rekord dla danego dnia i typu slotu już istnieje
        existing = (
            supa.table("day_capacity")
            .select("id")
            .eq("warehouse_id", wh.id)
            .eq("date", data.date.isoformat())
            .eq("slot_type", data.slot_type)
            .execute()
        )

        if existing.data:
            # Krok 2a: Aktualizacja istniejącego rekordu
            cap_id = existing.data[0]["id"]
            response = (
                supa.table("day_capacity")
                .update({"capacity": data.capacity})
                .eq("id", cap_id)
                .execute()
            )
        else:
            # Krok 2b: Tworzenie nowego rekordu
            payload = {
                "warehouse_id": wh.id,
                "date": data.date.isoformat(),
                "slot_type": data.slot_type,
                "capacity": data.capacity
            }
            response = supa.table("day_capacity").insert(payload).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail={"error_code": "UPSERT_FAILED"}
            )

        return response.data[0]

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
            detail={"error_code": "DATABASE_ERROR"}
        )