from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from supabase import Client
from pathlib import Path
import shutil

from ..supabase_client import get_supabase
from .. import crud
from ..deps import get_current_user, require_role
from ..schemas import WarehouseOut, WarehouseCreate, WarehousePatch, UserRow
from ..enums import Role

router = APIRouter(prefix="/api/warehouses", tags=["warehouses"])


@router.get("", response_model=list[WarehouseOut])
def list_warehouses(user: UserRow = Depends(get_current_user), supa: Client = Depends(get_supabase)):
    if user.role == Role.superadmin:
        rows = supa.table("warehouses").select("*").order("id").execute().data
        return rows
    if user.role == Role.admin and user.warehouse_id:
        rows = supa.table("warehouses").select("*").eq("id", user.warehouse_id).execute().data
        return rows
    if user.role == Role.client and user.company_id:
        company_rows = supa.table("companies").select("warehouse_id").eq("id", user.company_id).execute().data
        if company_rows:
            wh_rows = supa.table("warehouses").select("*").eq("id", company_rows[0]["warehouse_id"]).execute().data
            return wh_rows
    return []


@router.post("", response_model=WarehouseOut, dependencies=[Depends(require_role(Role.superadmin))])
def create_warehouse(data: WarehouseCreate, supa: Client = Depends(get_supabase)):
    if crud.get_warehouse_by_alias(supa, data.alias):
        raise HTTPException(status_code=400, detail={"error_code": "ALIAS_TAKEN", "field": "alias"})
    return crud.create_warehouse(supa, **data.model_dump())


@router.patch("/{warehouse_id}", response_model=WarehouseOut, dependencies=[Depends(require_role(Role.superadmin))])
def patch_warehouse(warehouse_id: int, data: WarehousePatch, supa: Client = Depends(get_supabase)):
    wh = crud.get_warehouse(supa, warehouse_id)
    if not wh:
        raise HTTPException(status_code=404, detail={"error_code": "WAREHOUSE_NOT_FOUND"})
    payload = data.model_dump(exclude_unset=True)
    if "alias" in payload:
        exists = (
            supa.table("warehouses").select("id")
            .eq("alias", payload["alias"])
            .neq("id", warehouse_id)
            .execute().data
        )
        if exists:
            raise HTTPException(status_code=400, detail={"error_code": "ALIAS_TAKEN", "field": "alias"})
    supa.table("warehouses").update(payload).eq("id", warehouse_id).execute()
    rows = supa.table("warehouses").select("*").eq("id", warehouse_id).execute().data
    return rows[0]


@router.delete("/{warehouse_id}", status_code=204, dependencies=[Depends(require_role(Role.superadmin))])
def delete_warehouse(warehouse_id: int, supa: Client = Depends(get_supabase)):
    wh = crud.get_warehouse(supa, warehouse_id)
    if not wh:
        raise HTTPException(status_code=404, detail={"error_code": "WAREHOUSE_NOT_FOUND"})
    has_deps = (
        supa.table("companies").select("id").eq("warehouse_id", warehouse_id).execute().data or
        supa.table("users").select("id").eq("warehouse_id", warehouse_id).execute().data or
        supa.table("docks").select("id").eq("warehouse_id", warehouse_id).execute().data
    )
    if has_deps:
        raise HTTPException(status_code=400, detail={"error_code": "WAREHOUSE_HAS_DEPENDENCIES"})
    supa.table("warehouses").delete().eq("id", warehouse_id).execute()


@router.post("/{warehouse_id}/logo")
def upload_logo(
    warehouse_id: int,
    file: UploadFile = File(...),
    user: UserRow = Depends(get_current_user),
    supa: Client = Depends(get_supabase),
):
    wh = crud.get_warehouse(supa, warehouse_id)
    if not wh:
        raise HTTPException(status_code=404, detail={"error_code": "WAREHOUSE_NOT_FOUND"})

    if user.role == Role.client:
        raise HTTPException(status_code=403, detail={"error_code": "FORBIDDEN"})
    if user.role == Role.admin and user.warehouse_id != warehouse_id:
        raise HTTPException(status_code=403, detail={"error_code": "FORBIDDEN"})

    static_dir = Path(__file__).resolve().parents[1] / "static" / "warehouses"
    static_dir.mkdir(parents=True, exist_ok=True)
    dest = static_dir / f"{warehouse_id}.png"
    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    logo_path = f"/static/warehouses/{warehouse_id}.png"
    supa.table("warehouses").update({"logo_path": logo_path}).eq("id", warehouse_id).execute()
    return {"ok": True, "logo_path": logo_path}
