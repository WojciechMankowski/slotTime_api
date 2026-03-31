from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from ..supabase_client import get_supabase
from .. import crud
from ..deps import require_role, get_current_user, get_context_warehouse
from ..schemas import CompanyOut, CompanyCreate, CompanyPatch, UserRow, WarehouseRow
from ..enums import Role
from ..utils import next_company_alias

router = APIRouter(prefix="/api/companies", tags=["companies"])


@router.get("", response_model=list[CompanyOut], dependencies=[Depends(require_role(Role.admin, Role.client))])
def list_companies(
    user: UserRow = Depends(get_current_user),
    wh: WarehouseRow = Depends(get_context_warehouse),
    supa: Client = Depends(get_supabase),
):
    q = supa.table("companies").select("*").eq("warehouse_id", wh.id)
    if user.role == Role.client:
        q = q.eq("is_active", True)
    return q.order("id").execute().data


@router.post("", response_model=CompanyOut, dependencies=[Depends(require_role(Role.admin))])
def create_company(
    data: CompanyCreate,
    wh: WarehouseRow = Depends(get_context_warehouse),
    supa: Client = Depends(get_supabase),
):
    alias = data.alias or next_company_alias(supa, wh.id, data.name)
    if crud.get_company_by_alias(supa, wh.id, alias):
        raise HTTPException(status_code=400, detail={"error_code": "ALIAS_TAKEN", "field": "alias"})
    return crud.create_company(supa, warehouse_id=wh.id, name=data.name, alias=alias, is_active=data.is_active)


@router.delete("/{company_id}", status_code=204, dependencies=[Depends(require_role(Role.superadmin))])
def delete_company(
    company_id: int,
    supa: Client = Depends(get_supabase),
):
    company = crud.get_company(supa, company_id)
    if not company:
        raise HTTPException(status_code=404, detail={"error_code": "COMPANY_NOT_FOUND"})
    has_users = supa.table("users").select("id").eq("company_id", company_id).execute().data
    if has_users:
        raise HTTPException(status_code=409, detail={"error_code": "COMPANY_HAS_USERS"})
    supa.table("companies").delete().eq("id", company_id).execute()


@router.patch("/{company_id}", response_model=CompanyOut, dependencies=[Depends(require_role(Role.admin))])
def patch_company(
    company_id: int,
    data: CompanyPatch,
    wh: WarehouseRow = Depends(get_context_warehouse),
    supa: Client = Depends(get_supabase),
):
    company = crud.get_company(supa, company_id)
    if not company or company["warehouse_id"] != wh.id:
        raise HTTPException(status_code=404, detail={"error_code": "COMPANY_NOT_FOUND"})

    payload = data.model_dump(exclude_unset=True)

    if "alias" in payload:
        exists = (
            supa.table("companies").select("id")
            .eq("warehouse_id", wh.id)
            .eq("alias", payload["alias"])
            .neq("id", company_id)
            .execute().data
        )
        if exists:
            raise HTTPException(status_code=400, detail={"error_code": "ALIAS_TAKEN", "field": "alias"})

    supa.table("companies").update(payload).eq("id", company_id).execute()
    rows = supa.table("companies").select("*").eq("id", company_id).execute().data
    return rows[0]
