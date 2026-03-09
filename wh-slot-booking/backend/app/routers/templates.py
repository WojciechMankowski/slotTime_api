from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from .. import models
from ..deps import require_role, get_context_warehouse
from ..schemas import SlotTemplateOut, SlotTemplateCreate, SlotTemplatePatch

router = APIRouter(prefix="/api/templates", tags=["templates"], dependencies=[Depends(require_role(models.Role.admin))])

@router.get("", response_model=list[SlotTemplateOut])
def list_templates(
    wh: models.Warehouse = Depends(get_context_warehouse),
    db: Session = Depends(get_db),
):
    return db.query(models.SlotTemplate).filter(models.SlotTemplate.warehouse_id==wh.id).order_by(models.SlotTemplate.id).all()

@router.post("", response_model=SlotTemplateOut)
def create_template(
    data: SlotTemplateCreate,
    wh: models.Warehouse = Depends(get_context_warehouse),
    db: Session = Depends(get_db),
):
    t = models.SlotTemplate(warehouse_id=wh.id, **data.model_dump())
    db.add(t)
    db.commit()
    db.refresh(t)
    return t

@router.patch("/{template_id}", response_model=SlotTemplateOut)
def patch_template(
    template_id: int,
    data: SlotTemplatePatch,
    wh: models.Warehouse = Depends(get_context_warehouse),
    db: Session = Depends(get_db),
):
    t = db.get(models.SlotTemplate, template_id)
    if not t or t.warehouse_id != wh.id:
        raise HTTPException(status_code=404, detail={"error_code":"TEMPLATE_NOT_FOUND"})
    payload = data.model_dump(exclude_unset=True)
    for k,v in payload.items():
        setattr(t,k,v)
    db.commit()
    db.refresh(t)
    return t
