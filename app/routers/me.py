from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import get_db
from .. import models
from ..deps import get_current_user
from ..schemas import MeOut, CompanyOut, WarehouseOut

router = APIRouter(prefix="/api", tags=["me"])

@router.get("/me", response_model=MeOut)
def me(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    company_out = None
    warehouse = None
    if user.role == models.Role.client:
        company = db.get(models.Company, user.company_id) if user.company_id else None
        if company:
            company_out = CompanyOut(id=company.id, name=company.name, alias=company.alias, is_active=company.is_active)
            warehouse = db.get(models.Warehouse, company.warehouse_id)
    elif user.role == models.Role.admin:
        warehouse = db.get(models.Warehouse, user.warehouse_id) if user.warehouse_id else None

    # For superadmin, warehouse is not fixed; return a placeholder.
    if user.role == models.Role.superadmin:
        # minimal stable shape: warehouse always present
        warehouse = WarehouseOut(id=0, name="GLOBAL", alias="GLOBAL", location=None, is_active=True, logo_path="/static/app_logo.png")
        return MeOut(id=user.id, username=user.username, alias=user.alias, role=user.role, company=None, warehouse=warehouse)

    wh = warehouse
    wh_out = WarehouseOut(
        id=wh.id, name=wh.name, alias=wh.alias, location=wh.location, is_active=wh.is_active, logo_path=wh.logo_path
    )
    return MeOut(id=user.id, username=user.username, alias=user.alias, role=user.role, company=company_out, warehouse=wh_out)
