from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date

from ..db import get_db
from .. import models
from ..deps import require_role, get_context_warehouse
from ..schemas import DayCapacityOut, DayCapacityUpsert

router = APIRouter(prefix="/api/day-capacity", tags=["day-capacity"], dependencies=[Depends(require_role(models.Role.admin))])

@router.get("", response_model=list[DayCapacityOut])
def list_caps(
    date_from: date,
    date_to: date,
    wh: models.Warehouse = Depends(get_context_warehouse),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.DayCapacity)
        .filter(models.DayCapacity.warehouse_id==wh.id, models.DayCapacity.date>=date_from, models.DayCapacity.date<=date_to)
        .order_by(models.DayCapacity.date)
        .all()
    )

@router.post("", response_model=DayCapacityOut)
def upsert_cap(
    data: DayCapacityUpsert,
    wh: models.Warehouse = Depends(get_context_warehouse),
    db: Session = Depends(get_db),
):
    cap = db.query(models.DayCapacity).filter(
        models.DayCapacity.warehouse_id==wh.id,
        models.DayCapacity.date==data.date,
        models.DayCapacity.slot_type==data.slot_type,
    ).first()
    if cap:
        cap.capacity = data.capacity
    else:
        cap = models.DayCapacity(warehouse_id=wh.id, date=data.date, slot_type=data.slot_type, capacity=data.capacity)
        db.add(cap)
    db.commit()
    db.refresh(cap)
    return cap
