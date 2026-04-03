from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from ..supabase_client import get_supabase
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
    try:
        q = supa.table("docks").select("*").eq("warehouse_id", wh.id)
        if user.role == Role.client:
            q = q.eq("is_active", True)
        return q.order("id").execute().data
    except Exception as e:
        print(f"[DB ERROR list_docks] {type(e).__name__}: {e}")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"error_code": "DATABASE_ERROR"})


@router.post("", response_model=DockOut, dependencies=[Depends(require_role(Role.admin))])
def create_dock(
    data: DockCreate,
    wh: WarehouseRow = Depends(get_context_warehouse),
    supa: Client = Depends(get_supabase),
):
    try:
        # Optymalizacja sprawdzenia istnienia rekordu
        exists = (
            supa.table("docks").select("id", count="exact")
            .eq("warehouse_id", wh.id)
            .eq("alias", data.alias)
            .limit(0)
            .execute()
        )
        if exists.count and exists.count > 0:
            raise HTTPException(status_code=400, detail={"error_code": "ALIAS_TAKEN", "field": "alias"})
            
        # Zastępuje crud.create_dock
        payload = {
            "warehouse_id": wh.id,
            "name": data.name,
            "alias": data.alias,
            "is_active": data.is_active
        }
        response = supa.table("docks").insert(payload).execute()
        
        if not response.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error_code": "INSERT_FAILED"})
            
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        print(f"[DB ERROR create_dock] {type(e).__name__}: {e}")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"error_code": "DATABASE_ERROR"})


@router.delete("/{dock_id}", status_code=204, dependencies=[Depends(require_role(Role.superadmin))])
def delete_dock(
    dock_id: int,
    wh: WarehouseRow = Depends(get_context_warehouse),
    supa: Client = Depends(get_supabase),
):
    try:
        # Zastępuje crud.get_dock, pobierając tylko warehouse_id dla optymalizacji
        dock_rows = supa.table("docks").select("warehouse_id").eq("id", dock_id).limit(1).execute().data
        if not dock_rows or dock_rows[0].get("warehouse_id") != wh.id:
            raise HTTPException(status_code=404, detail={"error_code": "DOCK_NOT_FOUND"})
            
        # Zoptymalizowane sprawdzanie powiązań (zwraca tylko samą liczbę)
        has_active = (
            supa.table("slots").select("id", count="exact")
            .eq("dock_id", dock_id)
            .in_("status", _ACTIVE_STATUSES)
            .limit(0)
            .execute()
        )
        if has_active.count and has_active.count > 0:
            raise HTTPException(status_code=409, detail={"error_code": "DOCK_HAS_ACTIVE_SLOTS"})
            
        supa.table("docks").delete().eq("id", dock_id).execute()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[DB ERROR delete_dock] {type(e).__name__}: {e}")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"error_code": "DATABASE_ERROR"})


@router.patch("/{dock_id}", response_model=DockOut, dependencies=[Depends(require_role(Role.admin))])
def patch_dock(
    dock_id: int,
    data: DockPatch,
    wh: WarehouseRow = Depends(get_context_warehouse),
    supa: Client = Depends(get_supabase),
):
    try:
        # Zastępuje crud.get_dock
        dock_rows = supa.table("docks").select("*").eq("id", dock_id).limit(1).execute().data
        dock = dock_rows[0] if dock_rows else None
        
        if not dock or dock.get("warehouse_id") != wh.id:
            raise HTTPException(status_code=404, detail={"error_code": "DOCK_NOT_FOUND"})
            
        payload = data.model_dump(exclude_unset=True)
        
        # Zabezpieczenie przed błędem z pustym payloadem (np. przy wysłaniu {})
        if not payload:
            return dock
            
        if "alias" in payload:
            exists = (
                supa.table("docks").select("id", count="exact")
                .eq("warehouse_id", wh.id)
                .eq("alias", payload["alias"])
                .neq("id", dock_id)
                .limit(0)
                .execute()
            )
            if exists.count and exists.count > 0:
                raise HTTPException(status_code=400, detail={"error_code": "ALIAS_TAKEN", "field": "alias"})
                
        # Zwracanie od razu zaktualizowanego rekordu z operacji update
        response = supa.table("docks").update(payload).eq("id", dock_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error_code": "UPDATE_FAILED"})
            
        return response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[DB ERROR patch_dock] {type(e).__name__}: {e}")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"error_code": "DATABASE_ERROR"})