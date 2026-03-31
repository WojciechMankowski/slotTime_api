from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from ..supabase_client import get_supabase
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
    try:
        q = supa.table("companies").select("*").eq("warehouse_id", wh.id)
        if user.role == Role.client:
            q = q.eq("is_active", True)
        return q.order("id").execute().data
    except Exception:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"error_code": "DATABASE_ERROR"})


@router.post("", response_model=CompanyOut, dependencies=[Depends(require_role(Role.admin))])
def create_company(
    data: CompanyCreate,
    wh: WarehouseRow = Depends(get_context_warehouse),
    supa: Client = Depends(get_supabase),
):
    try:
        alias = data.alias or next_company_alias(supa, wh.id, data.name)
        
        # Zastępuje crud.get_company_by_alias - zoptymalizowane sprawdzenie istnienia
        exists = supa.table("companies").select("id", count="exact").eq("warehouse_id", wh.id).eq("alias", alias).limit(0).execute()
        if exists.count and exists.count > 0:
            raise HTTPException(status_code=400, detail={"error_code": "ALIAS_TAKEN", "field": "alias"})
            
        # Zastępuje crud.create_company
        payload = {
            "warehouse_id": wh.id,
            "name": data.name,
            "alias": alias,
            "is_active": data.is_active
        }
        response = supa.table("companies").insert(payload).execute()
        
        if not response.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error_code": "INSERT_FAILED"})
            
        return response.data[0]
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"error_code": "DATABASE_ERROR"})


@router.delete("/{company_id}", status_code=204, dependencies=[Depends(require_role(Role.superadmin))])
def delete_company(
    company_id: int,
    supa: Client = Depends(get_supabase),
):
    try:
        # Zastępuje crud.get_company - pobieramy tylko ID do weryfikacji
        company_rows = supa.table("companies").select("id").eq("id", company_id).limit(1).execute().data
        if not company_rows:
            raise HTTPException(status_code=404, detail={"error_code": "COMPANY_NOT_FOUND"})
        
        # Zoptymalizowane sprawdzanie powiązań (zwraca tylko samą liczbę)
        has_users = supa.table("users").select("id", count="exact").eq("company_id", company_id).limit(0).execute()
        if has_users.count and has_users.count > 0:
            raise HTTPException(status_code=409, detail={"error_code": "COMPANY_HAS_USERS"})
            
        supa.table("companies").delete().eq("id", company_id).execute()
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"error_code": "DATABASE_ERROR"})


@router.patch("/{company_id}", response_model=CompanyOut, dependencies=[Depends(require_role(Role.admin))])
def patch_company(
    company_id: int,
    data: CompanyPatch,
    wh: WarehouseRow = Depends(get_context_warehouse),
    supa: Client = Depends(get_supabase),
):
    try:
        # Zastępuje crud.get_company
        company_rows = supa.table("companies").select("*").eq("id", company_id).execute().data
        company = company_rows[0] if company_rows else None
        
        if not company or company.get("warehouse_id") != wh.id:
            raise HTTPException(status_code=404, detail={"error_code": "COMPANY_NOT_FOUND"})

        payload = data.model_dump(exclude_unset=True)
        
        # Zabezpieczenie przed pustym payloadem
        if not payload:
            return company

        if "alias" in payload:
            exists = (
                supa.table("companies").select("id", count="exact")
                .eq("warehouse_id", wh.id)
                .eq("alias", payload["alias"])
                .neq("id", company_id)
                .limit(0)
                .execute()
            )
            if exists.count and exists.count > 0:
                raise HTTPException(status_code=400, detail={"error_code": "ALIAS_TAKEN", "field": "alias"})

        # Metoda update w Supabase zwraca zmodyfikowane wiersze
        response = supa.table("companies").update(payload).eq("id", company_id).execute()
        
        if not response.data:
             raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error_code": "UPDATE_FAILED"})
             
        return response.data[0]

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"error_code": "DATABASE_ERROR"})