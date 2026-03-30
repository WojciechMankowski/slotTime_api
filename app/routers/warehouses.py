from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from pathlib import Path
import shutil

from ..db import get_db
from .. import models
from ..deps import get_current_user, require_role
from ..schemas import WarehouseOut, WarehouseCreate, WarehousePatch

router = APIRouter(prefix="/api/warehouses", tags=["warehouses"])

@router.get("", response_model=list[WarehouseOut])
def list_warehouses(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role == models.Role.superadmin:
        return db.query(models.Warehouse).order_by(models.Warehouse.id).all()
    # admin/client: only their warehouse via /me, but keep endpoint per spec W2
    if user.role == models.Role.admin and user.warehouse_id:
        wh = db.get(models.Warehouse, user.warehouse_id)
        return [wh] if wh else []
    if user.role == models.Role.client and user.company_id:
        company = db.get(models.Company, user.company_id)
        wh = db.get(models.Warehouse, company.warehouse_id) if company else None
        return [wh] if wh else []
    return []

@router.post("", response_model=WarehouseOut, dependencies=[Depends(require_role(models.Role.superadmin))])
def create_warehouse(data: WarehouseCreate, db: Session = Depends(get_db)):
    exists = db.query(models.Warehouse).filter(models.Warehouse.alias == data.alias).first()
    if exists:
        raise HTTPException(status_code=400, detail={"error_code": "ALIAS_TAKEN", "field": "alias"})
    wh = models.Warehouse(**data.model_dump())
    db.add(wh)
    db.commit()
    db.refresh(wh)
    return wh

@router.patch("/{warehouse_id}", response_model=WarehouseOut, dependencies=[Depends(require_role(models.Role.superadmin))])
def patch_warehouse(warehouse_id: int, data: WarehousePatch, db: Session = Depends(get_db)):
    wh = db.get(models.Warehouse, warehouse_id)
    if not wh:
        raise HTTPException(status_code=404, detail={"error_code": "WAREHOUSE_NOT_FOUND"})
    payload = data.model_dump(exclude_unset=True)
    if "alias" in payload:
        exists = db.query(models.Warehouse).filter(models.Warehouse.alias == payload["alias"], models.Warehouse.id != wh.id).first()
        if exists:
            raise HTTPException(status_code=400, detail={"error_code": "ALIAS_TAKEN", "field": "alias"})
    for k,v in payload.items():
        setattr(wh, k, v)
    db.commit()
    db.refresh(wh)
    return wh

@router.delete("/{warehouse_id}", status_code=204, dependencies=[Depends(require_role(models.Role.superadmin))])
def delete_warehouse(warehouse_id: int, db: Session = Depends(get_db)):
    wh = db.get(models.Warehouse, warehouse_id)
    if not wh:
        raise HTTPException(status_code=404, detail={"error_code": "WAREHOUSE_NOT_FOUND"})
    has_deps = (
        db.query(models.Company).filter(models.Company.warehouse_id == warehouse_id).first() or
        db.query(models.User).filter(models.User.warehouse_id == warehouse_id).first() or
        db.query(models.Dock).filter(models.Dock.warehouse_id == warehouse_id).first()
    )
    if has_deps:
        raise HTTPException(status_code=400, detail={"error_code": "WAREHOUSE_HAS_DEPENDENCIES"})
    db.delete(wh)
    db.commit()

@router.post("/{warehouse_id}/logo")
def upload_logo(
    warehouse_id: int,
    file: UploadFile = File(...),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    wh = db.get(models.Warehouse, warehouse_id)
    if not wh:
        raise HTTPException(status_code=404, detail={"error_code": "WAREHOUSE_NOT_FOUND"})

    if user.role == models.Role.client:
        raise HTTPException(status_code=403, detail={"error_code": "FORBIDDEN"})
    if user.role == models.Role.admin and user.warehouse_id != warehouse_id:
        raise HTTPException(status_code=403, detail={"error_code": "FORBIDDEN"})

    static_dir = Path(__file__).resolve().parents[1] / "static" / "warehouses"
    static_dir.mkdir(parents=True, exist_ok=True)
    dest = static_dir / f"{warehouse_id}.png"
    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    wh.logo_path = f"/static/warehouses/{warehouse_id}.png"
    db.commit()
    return {"ok": True, "logo_path": wh.logo_path}
