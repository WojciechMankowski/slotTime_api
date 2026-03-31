from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from .. import models, crud
from ..deps import require_role, get_current_user, get_context_warehouse
from ..schemas import CompanyOut, CompanyCreate, CompanyPatch
from ..utils import next_company_alias

router = APIRouter(prefix="/api/companies", tags=["companies"])

@router.get("", response_model=list[CompanyOut], dependencies=[Depends(require_role(models.Role.admin, models.Role.client))])
def list_companies(
    user: models.User = Depends(get_current_user),
    wh: models.Warehouse = Depends(get_context_warehouse),
    db: Session = Depends(get_db),
):
    q = db.query(models.Company).filter(models.Company.warehouse_id == wh.id)
    if user.role == models.Role.client:
        q = q.filter(models.Company.is_active == True)
    return q.order_by(models.Company.id).all()

@router.post("", response_model=CompanyOut, dependencies=[Depends(require_role(models.Role.admin))])
def create_company(
    data: CompanyCreate,
    wh: models.Warehouse = Depends(get_context_warehouse),
    db: Session = Depends(get_db),
):
    alias = data.alias or next_company_alias(db, wh.id, data.name)
    if crud.get_company_by_alias(db, wh.id, alias):
        raise HTTPException(status_code=400, detail={"error_code":"ALIAS_TAKEN", "field":"alias"})
    return crud.create_company(db, warehouse_id=wh.id, name=data.name, alias=alias, is_active=data.is_active)

@router.delete("/{company_id}", status_code=204, dependencies=[Depends(require_role(models.Role.superadmin))])
def delete_company(
    company_id: int,
    db: Session = Depends(get_db),
):
    company = db.get(models.Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail={"error_code": "COMPANY_NOT_FOUND"})
    has_users = db.query(models.User).filter(models.User.company_id == company_id).first()
    if has_users:
        raise HTTPException(status_code=409, detail={"error_code": "COMPANY_HAS_USERS"})
    db.delete(company)
    db.commit()

@router.patch("/{company_id}", response_model=CompanyOut, dependencies=[Depends(require_role(models.Role.admin))])
def patch_company(
    company_id: int,
    data: CompanyPatch,
    wh: models.Warehouse = Depends(get_context_warehouse),
    db: Session = Depends(get_db),
):
    company = db.get(models.Company, company_id)
    if not company or company.warehouse_id != wh.id:
        raise HTTPException(status_code=404, detail={"error_code": "COMPANY_NOT_FOUND"})

    payload = data.model_dump(exclude_unset=True)

    if "alias" in payload:
        exists = db.query(models.Company).filter(
            models.Company.warehouse_id == wh.id,
            models.Company.alias == payload["alias"],
            models.Company.id != company.id,
        ).first()
        if exists:
            raise HTTPException(status_code=400, detail={"error_code": "ALIAS_TAKEN", "field": "alias"})

    for k, v in payload.items():
        setattr(company, k, v)

    db.commit()
    db.refresh(company)
    return company