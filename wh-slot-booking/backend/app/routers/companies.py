from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..db import get_db
from .. import models
from ..deps import require_role, get_current_user, get_context_warehouse
from ..schemas import CompanyOut, CompanyCreate
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
    exists = db.query(models.Company).filter(models.Company.warehouse_id==wh.id, models.Company.alias==alias).first()
    if exists:
        raise HTTPException(status_code=400, detail={"error_code":"ALIAS_TAKEN", "field":"alias"})
    company = models.Company(warehouse_id=wh.id, name=data.name, alias=alias, is_active=data.is_active)
    db.add(company)
    db.commit()
    db.refresh(company)
    return company
