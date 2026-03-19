from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from datetime import date, datetime, time as dtime
from typing import Optional

from ..db import get_db
from .. import models
from ..deps import get_current_user, require_role, get_context_warehouse
from ..schemas import SlotNoticeOut, SlotNoticeCreate, SlotWithNoticeOut

router = APIRouter(prefix="/api/slots", tags=["notices"])

REQUIRED_FIELDS = ["numer_zlecenia", "referencja", "rejestracja_auta", "rejestracja_naczepy", "ilosc_palet"]


# =========================================================
# LIST ALL NOTICES (admin view)
# =========================================================

@router.get(
    "/notices",
    response_model=list[SlotWithNoticeOut],
    dependencies=[Depends(require_role(models.Role.admin, models.Role.superadmin))],
)
def list_notices(
    date_from: date = Query(...),
    date_to: date = Query(...),
    status: Optional[str] = Query(None, description="Filter by slot status, e.g. RESERVED_CONFIRMED"),
    company_alias: Optional[str] = Query(None, description="Filter by company alias"),
    user: models.User = Depends(get_current_user),
    wh: models.Warehouse = Depends(get_context_warehouse),
    db: Session = Depends(get_db),
):
    """
    Returns slots that have a notice attached, with full notice data.
    Filterable by date range, slot status, and company alias.
    """
    start = datetime.combine(date_from, dtime.min)
    end = datetime.combine(date_to, dtime.max)

    q = (
        db.query(models.Slot)
        .options(joinedload(models.Slot.notice))
        .filter(
            models.Slot.warehouse_id == wh.id,
            models.Slot.start_dt >= start,
            models.Slot.start_dt <= end,
            models.Slot.notice != None,  # noqa: E711 - only slots WITH notice
        )
    )

    if status:
        try:
            status_enum = models.SlotStatus(status)
            q = q.filter(models.Slot.status == status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail={"error_code": "INVALID_STATUS_FILTER"})

    slots = q.order_by(models.Slot.start_dt).all()

    results = []
    for slot in slots:
        # resolve aliases
        reserved_by_alias = None
        reserved_by_company_alias = None
        if slot.reserved_by_user_id:
            u = db.get(models.User, slot.reserved_by_user_id)
            if u:
                reserved_by_alias = u.alias
                if u.company_id:
                    c = db.get(models.Company, u.company_id)
                    if c:
                        reserved_by_company_alias = c.alias

        # filter by company alias if requested
        if company_alias and reserved_by_company_alias != company_alias:
            continue

        dock_alias = slot.dock.alias if slot.dock else None
        n = slot.notice

        results.append(SlotWithNoticeOut(
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
            notice=SlotNoticeOut(
                numer_zlecenia=n.numer_zlecenia,
                referencja=n.referencja,
                rejestracja_auta=n.rejestracja_auta,
                rejestracja_naczepy=n.rejestracja_naczepy,
                ilosc_palet=n.ilosc_palet,
                kierowca_imie_nazwisko=n.kierowca_imie_nazwisko,
                kierowca_tel=n.kierowca_tel,
                uwagi=n.uwagi,
            ),
        ))

    return results


# =========================================================
# SINGLE NOTICE (existing endpoints)
# =========================================================

@router.get("/{slot_id}/notice", response_model=SlotNoticeOut, dependencies=[Depends(require_role(models.Role.admin, models.Role.client))])
def get_notice(
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
    if not slot.notice:
        raise HTTPException(status_code=404, detail={"error_code": "NOTICE_NOT_FOUND"})
    n = slot.notice
    return SlotNoticeOut(
        numer_zlecenia=n.numer_zlecenia, referencja=n.referencja,
        rejestracja_auta=n.rejestracja_auta, rejestracja_naczepy=n.rejestracja_naczepy,
        ilosc_palet=n.ilosc_palet,
        kierowca_imie_nazwisko=n.kierowca_imie_nazwisko, kierowca_tel=n.kierowca_tel, uwagi=n.uwagi
    )


@router.post("/{slot_id}/notice", response_model=SlotNoticeOut, dependencies=[Depends(require_role(models.Role.client))])
def post_notice(
    slot_id: int,
    data: SlotNoticeCreate,
    user: models.User = Depends(get_current_user),
    wh: models.Warehouse = Depends(get_context_warehouse),
    db: Session = Depends(get_db),
):
    slot = db.get(models.Slot, slot_id)
    if not slot or slot.warehouse_id != wh.id:
        raise HTTPException(status_code=404, detail={"error_code": "SLOT_NOT_FOUND"})
    if slot.reserved_by_user_id != user.id:
        raise HTTPException(status_code=403, detail={"error_code": "FORBIDDEN"})
    if slot.status != models.SlotStatus.APPROVED_WAITING_DETAILS:
        raise HTTPException(status_code=409, detail={"error_code": "INVALID_STATUS"})

    payload = data.model_dump()
    for f in REQUIRED_FIELDS:
        v = payload.get(f)
        if v is None or (isinstance(v, str) and not v.strip()):
            raise HTTPException(status_code=400, detail={"error_code": "FIELD_REQUIRED", "field": f})
    if payload["ilosc_palet"] <= 0:
        raise HTTPException(status_code=400, detail={"error_code": "FIELD_INVALID", "field": "ilosc_palet"})

    if slot.notice:
        n = slot.notice
        for k, v in payload.items():
            setattr(n, k, v)
    else:
        n = models.SlotNotice(slot_id=slot.id, **payload)
        db.add(n)

    slot.status = models.SlotStatus.RESERVED_CONFIRMED
    db.commit()
    db.refresh(n)
    return SlotNoticeOut(**payload)