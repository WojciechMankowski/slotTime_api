from fastapi import APIRouter, Depends
from supabase import Client

from ..supabase_client import get_supabase
from ..deps import get_current_user
from ..schemas import MeOut, CompanyOut, WarehouseOut, UserRow
from ..enums import Role

router = APIRouter(prefix="/api", tags=["me"])


@router.get("/me", response_model=MeOut)
def me(user: UserRow = Depends(get_current_user), supa: Client = Depends(get_supabase)):
    company_out = None
    wh_data = None

    if user.role == Role.client:
        if user.company_id:
            company_rows = supa.table("companies").select("*").eq("id", user.company_id).execute().data
            if company_rows:
                c = company_rows[0]
                company_out = CompanyOut(id=c["id"], name=c["name"], alias=c["alias"], is_active=c["is_active"])
                wh_rows = supa.table("warehouses").select("*").eq("id", c["warehouse_id"]).execute().data
                wh_data = wh_rows[0] if wh_rows else None
    elif user.role == Role.admin:
        if user.warehouse_id:
            wh_rows = supa.table("warehouses").select("*").eq("id", user.warehouse_id).execute().data
            wh_data = wh_rows[0] if wh_rows else None

    if user.role == Role.superadmin:
        warehouse = WarehouseOut(id=0, name="GLOBAL", alias="GLOBAL", location=None, is_active=True, logo_path="/static/app_logo.png")
        return MeOut(id=user.id, username=user.username, email=user.email, alias=user.alias, role=user.role, company=None, warehouse=warehouse)

    wh_out = WarehouseOut(
        id=wh_data["id"], name=wh_data["name"], alias=wh_data["alias"],
        location=wh_data.get("location"), is_active=wh_data["is_active"], logo_path=wh_data.get("logo_path"),
    )
    return MeOut(id=user.id, username=user.username, email=user.email, alias=user.alias, role=user.role, company=company_out, warehouse=wh_out)
