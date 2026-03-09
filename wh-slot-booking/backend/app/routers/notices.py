from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from .. import models
from ..deps import get_current_user, require_role, get_context_warehouse
from ..schemas import SlotNoticeOut, SlotNoticeCreate

router = APIRouter(prefix="/api/slots", tags=["notices"])

REQUIRED_FIELDS = ["numer_zlecenia", "referencja", "rejestracja_auta", "rejestracja_naczepy", "ilosc_palet"]

@router.get("/{slot_id}/notice", response_model=SlotNoticeOut, dependencies=[Depends(require_role(models.Role.admin, models.Role.client))])
def get_notice(
    slot_id: int,
    user: models.User = Depends(get_current_user),
    wh: models.Warehouse = Depends(get_context_warehouse),
    db: Session = Depends(get_db),
):
    slot = db.get(models.Slot, slot_id)
    if not slot or slot.warehouse_id != wh.id:
        raise HTTPException(status_code=404, detail={"error_code":"SLOT_NOT_FOUND"})
    if user.role == models.Role.client and slot.reserved_by_user_id != user.id:
        raise HTTPException(status_code=403, detail={"error_code":"FORBIDDEN"})
    if not slot.notice:
        raise HTTPException(status_code=404, detail={"error_code":"NOTICE_NOT_FOUND"})
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
        raise HTTPException(status_code=404, detail={"error_code":"SLOT_NOT_FOUND"})
    if slot.reserved_by_user_id != user.id:
        raise HTTPException(status_code=403, detail={"error_code":"FORBIDDEN"})
    if slot.status != models.SlotStatus.APPROVED_WAITING_DETAILS:
        raise HTTPException(status_code=409, detail={"error_code":"INVALID_STATUS"})

    # validate required fields (backend truth)
    payload = data.model_dump()
    for f in REQUIRED_FIELDS:
        v = payload.get(f)
        if v is None or (isinstance(v, str) and not v.strip()):
            raise HTTPException(status_code=400, detail={"error_code":"FIELD_REQUIRED", "field": f})
    if payload["ilosc_palet"] <= 0:
        raise HTTPException(status_code=400, detail={"error_code":"FIELD_INVALID", "field":"ilosc_palet"})

    if slot.notice:
        n = slot.notice
        for k,v in payload.items():
            setattr(n,k,v)
    else:
        n = models.SlotNotice(slot_id=slot.id, **payload)
        db.add(n)

    slot.status = models.SlotStatus.RESERVED_CONFIRMED
    db.commit()
    db.refresh(n)
    return SlotNoticeOut(**payload)
