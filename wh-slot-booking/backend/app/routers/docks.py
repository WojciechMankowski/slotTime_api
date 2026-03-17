from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from .. import models
from ..deps import get_current_user, require_role, get_context_warehouse
from ..schemas import DockOut, DockCreate, DockPatch

router = APIRouter(prefix="/api/docks", tags=["docks"])

@router.get("", response_model=list[DockOut], dependencies=[Depends(require_role(models.Role.admin, models.Role.client))])
def list_docks(
    user: models.User = Depends(get_current_user),
    wh: models.Warehouse = Depends(get_context_warehouse),
    db: Session = Depends(get_db),
):
    q = db.query(models.Dock).filter(models.Dock.warehouse_id == wh.id)
    if user.role == models.Role.client:
        q = q.filter(models.Dock.is_active == True)
    return q.order_by(models.Dock.id).all()

@router.post("", response_model=DockOut, dependencies=[Depends(require_role(models.Role.admin))])
def create_dock(
    data: DockCreate,
    wh: models.Warehouse = Depends(get_context_warehouse),
    db: Session = Depends(get_db),
):
    exists = db.query(models.Dock).filter(models.Dock.warehouse_id==wh.id, models.Dock.alias==data.alias).first()
    if exists:
        raise HTTPException(status_code=400, detail={"error_code":"ALIAS_TAKEN", "field":"alias"})
    dock = models.Dock(warehouse_id=wh.id, name=data.name, alias=data.alias, is_active=data.is_active)
    db.add(dock)
    db.commit()
    db.refresh(dock)
    return dock

@router.patch("/{dock_id}", response_model=DockOut, dependencies=[Depends(require_role(models.Role.admin))])
def patch_dock(
    dock_id: int,
    data: DockPatch,
    wh: models.Warehouse = Depends(get_context_warehouse),
    db: Session = Depends(get_db),
):
    dock = db.get(models.Dock, dock_id)
    if not dock or dock.warehouse_id != wh.id:
        raise HTTPException(status_code=404, detail={"error_code":"DOCK_NOT_FOUND"})
    payload = data.model_dump(exclude_unset=True)
    if "alias" in payload:
        exists = db.query(models.Dock).filter(models.Dock.warehouse_id==wh.id, models.Dock.alias==payload["alias"], models.Dock.id!=dock.id).first()
        if exists:
            raise HTTPException(status_code=400, detail={"error_code":"ALIAS_TAKEN", "field":"alias"})
    for k,v in payload.items():
        setattr(dock, k, v)
    db.commit()
    db.refresh(dock)
    return dock

@router.patch("/{dock_id}", response_model=DockOut, dependencies=[Depends(require_role(models.Role.admin))])
def patch_dock(
    dock_id: int,
    data: DockPatch,
    wh: models.Warehouse = Depends(get_context_warehouse),
    db: Session = Depends(get_db),
):
    dock = db.get(models.Dock, dock_id)
    if not dock or dock.warehouse_id != wh.id:
        raise HTTPException(status_code=404, detail={"error_code": "DOCK_NOT_FOUND"})
    payload = data.model_dump(exclude_unset=True)
    if "alias" in payload:
        exists = db.query(models.Dock).filter(
            models.Dock.warehouse_id == wh.id,
            models.Dock.alias == payload["alias"],
            models.Dock.id != dock.id
        ).first()
        if exists:
            raise HTTPException(status_code=400, detail={"error_code": "ALIAS_TAKEN", "field": "alias"})
    for k, v in payload.items():
        setattr(dock, k, v)
    db.commit()
    db.refresh(dock)
    return dock
