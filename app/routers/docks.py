from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from ..supabase_client import get_supabase
from .. import crud
from ..deps import get_current_user, require_role, get_context_warehouse
from ..schemas import DockOut, DockCreate, DockPatch, UserRow, WarehouseRow
from ..enums import Role

router = APIRouter(prefix="/api/docks", tags=["docks"])

_ACTIVE_STATUSES = ["AVAILABLE", "BOOKED", "APPROVED_WAITING_DETAILS", "RESERVED_CONFIRMED", "CANCEL_PENDING"]


@router.get("", response_model=list[DockOut], dependencies=[Depends(require_role(Role.admin, Role.client))])
def list_docks(
    user: UserRow = Depends(get_current_user),
    wh: WarehouseRow = Depends(get_context_warehouse),
    supa: Client = Depends(get_supabase),
):
    q = supa.table("docks").select("*").eq("warehouse_id", wh.id)
    if user.role == Role.client:
        q = q.eq("is_active", True)
    return q.order("id").execute().data


@router.post("", response_model=DockOut, dependencies=[Depends(require_role(Role.admin))])
def create_dock(
    data: DockCreate,
    wh: WarehouseRow = Depends(get_context_warehouse),
    supa: Client = Depends(get_supabase),
):
    exists = supa.table("docks").select("id").eq("warehouse_id", wh.id).eq("alias", data.alias).execute().data
    if exists:
        raise HTTPException(status_code=400, detail={"error_code": "ALIAS_TAKEN", "field": "alias"})
    return crud.create_dock(supa, warehouse_id=wh.id, name=data.name, alias=data.alias, is_active=data.is_active)


@router.delete("/{dock_id}", status_code=204, dependencies=[Depends(require_role(Role.superadmin))])
def delete_dock(
    dock_id: int,
    wh: WarehouseRow = Depends(get_context_warehouse),
    supa: Client = Depends(get_supabase),
):
    dock = crud.get_dock(supa, dock_id)
    if not dock or dock["warehouse_id"] != wh.id:
        raise HTTPException(status_code=404, detail={"error_code": "DOCK_NOT_FOUND"})
    has_active = (
        supa.table("slots").select("id")
        .eq("dock_id", dock_id)
        .in_("status", _ACTIVE_STATUSES)
        .execute().data
    )
    if has_active:
        raise HTTPException(status_code=409, detail={"error_code": "DOCK_HAS_ACTIVE_SLOTS"})
    supa.table("docks").delete().eq("id", dock_id).execute()


@router.patch("/{dock_id}", response_model=DockOut, dependencies=[Depends(require_role(Role.admin))])
def patch_dock(
    dock_id: int,
    data: DockPatch,
    wh: WarehouseRow = Depends(get_context_warehouse),
    supa: Client = Depends(get_supabase),
):
    dock = crud.get_dock(supa, dock_id)
    if not dock or dock["warehouse_id"] != wh.id:
        raise HTTPException(status_code=404, detail={"error_code": "DOCK_NOT_FOUND"})
    payload = data.model_dump(exclude_unset=True)
    if "alias" in payload:
        exists = (
            supa.table("docks").select("id")
            .eq("warehouse_id", wh.id)
            .eq("alias", payload["alias"])
            .neq("id", dock_id)
            .execute().data
        )
        if exists:
            raise HTTPException(status_code=400, detail={"error_code": "ALIAS_TAKEN", "field": "alias"})
    supa.table("docks").update(payload).eq("id", dock_id).execute()
    rows = supa.table("docks").select("*").eq("id", dock_id).execute().data
    return rows[0]
