from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from supabase import Client
from pathlib import Path
import shutil

from ..supabase_client import get_supabase
from ..deps import get_current_user, require_role
from ..schemas import WarehouseOut, WarehouseCreate, WarehousePatch, UserRow
from ..enums import Role

router = APIRouter(prefix="/api/warehouses", tags=["warehouses"])


@router.get("", response_model=list[WarehouseOut])
def list_warehouses(user: UserRow = Depends(get_current_user), supa: Client = Depends(get_supabase)):
    try:
        if user.role == Role.superadmin:
            return supa.table("warehouses").select("*").order("id").execute().data

        if user.role == Role.admin and user.warehouse_id:
            return supa.table("warehouses").select("*").eq("id", user.warehouse_id).execute().data

        if user.role == Role.client and user.company_id:
            company_rows = supa.table("companies").select("warehouse_id").eq("id", user.company_id).execute().data
            if company_rows:
                wh_id = company_rows[0].get("warehouse_id")
                if wh_id:
                    return supa.table("warehouses").select("*").eq("id", wh_id).execute().data
        return []
    except Exception:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"error_code": "DATABASE_ERROR"})


@router.post("", response_model=WarehouseOut, dependencies=[Depends(require_role(Role.superadmin))])
def create_warehouse(data: WarehouseCreate, supa: Client = Depends(get_supabase)):
    try:
        # Zoptymalizowane sprawdzenie aliasu
        exists = supa.table("warehouses").select("id", count="exact").eq("alias", data.alias).limit(0).execute()
        if exists.count and exists.count > 0:
            raise HTTPException(status_code=400, detail={"error_code": "ALIAS_TAKEN", "field": "alias"})

        payload = data.model_dump()
        response = supa.table("warehouses").insert(payload).execute()
        
        if not response.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error_code": "INSERT_FAILED"})
            
        return response.data[0]
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"error_code": "DATABASE_ERROR"})


@router.patch("/{warehouse_id}", response_model=WarehouseOut, dependencies=[Depends(require_role(Role.superadmin))])
def patch_warehouse(warehouse_id: int, data: WarehousePatch, supa: Client = Depends(get_supabase)):
    try:
        wh_rows = supa.table("warehouses").select("*").eq("id", warehouse_id).execute().data
        wh = wh_rows[0] if wh_rows else None
        if not wh:
            raise HTTPException(status_code=404, detail={"error_code": "WAREHOUSE_NOT_FOUND"})

        payload = data.model_dump(exclude_unset=True)
        
        # Ochrona przed pustym żądaniem
        if not payload:
            return wh

        if "alias" in payload:
            exists = (
                supa.table("warehouses").select("id", count="exact")
                .eq("alias", payload["alias"])
                .neq("id", warehouse_id)
                .limit(0)
                .execute()
            )
            if exists.count and exists.count > 0:
                raise HTTPException(status_code=400, detail={"error_code": "ALIAS_TAKEN", "field": "alias"})

        response = supa.table("warehouses").update(payload).eq("id", warehouse_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error_code": "UPDATE_FAILED"})
            
        return response.data[0]
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"error_code": "DATABASE_ERROR"})


@router.delete("/{warehouse_id}", status_code=204, dependencies=[Depends(require_role(Role.superadmin))])
def delete_warehouse(warehouse_id: int, supa: Client = Depends(get_supabase)):
    try:
        wh_rows = supa.table("warehouses").select("id").eq("id", warehouse_id).limit(1).execute().data
        if not wh_rows:
            raise HTTPException(status_code=404, detail={"error_code": "WAREHOUSE_NOT_FOUND"})

        # Zoptymalizowane sprawdzanie powiązań: zapytania count ograniczają zużycie pamięci operacyjnej
        companies = supa.table("companies").select("id", count="exact").eq("warehouse_id", warehouse_id).limit(0).execute()
        users = supa.table("users").select("id", count="exact").eq("warehouse_id", warehouse_id).limit(0).execute()
        docks = supa.table("docks").select("id", count="exact").eq("warehouse_id", warehouse_id).limit(0).execute()

        if (companies.count and companies.count > 0) or \
           (users.count and users.count > 0) or \
           (docks.count and docks.count > 0):
            raise HTTPException(status_code=400, detail={"error_code": "WAREHOUSE_HAS_DEPENDENCIES"})

        supa.table("warehouses").delete().eq("id", warehouse_id).execute()
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"error_code": "DATABASE_ERROR"})


@router.post("/{warehouse_id}/logo")
def upload_logo(
    warehouse_id: int,
    file: UploadFile = File(...),
    user: UserRow = Depends(get_current_user),
    supa: Client = Depends(get_supabase),
):
    try:
        if user.role == Role.client:
            raise HTTPException(status_code=403, detail={"error_code": "FORBIDDEN"})
        if user.role == Role.admin and user.warehouse_id != warehouse_id:
            raise HTTPException(status_code=403, detail={"error_code": "FORBIDDEN"})

        # Ograniczamy pobieranie do samego pola id
        wh_rows = supa.table("warehouses").select("id").eq("id", warehouse_id).limit(1).execute().data
        if not wh_rows:
            raise HTTPException(status_code=404, detail={"error_code": "WAREHOUSE_NOT_FOUND"})

        # Zapis lokalny (zależnie od środowiska produkcyjnego, można pomyśleć o Supabase Storage)
        static_dir = Path(__file__).resolve().parents[1] / "static" / "warehouses"
        static_dir.mkdir(parents=True, exist_ok=True)
        dest = static_dir / f"{warehouse_id}.png"
        
        with dest.open("wb") as f:
            shutil.copyfileobj(file.file, f)

        logo_path = f"/static/warehouses/{warehouse_id}.png"
        supa.table("warehouses").update({"logo_path": logo_path}).eq("id", warehouse_id).execute()
        
        return {"ok": True, "logo_path": logo_path}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"error_code": "DATABASE_ERROR"})