from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from ..supabase_client import get_supabase
from ..deps import require_role, get_context_warehouse
from ..schemas import SlotTemplateOut, SlotTemplateCreate, SlotTemplatePatch, WarehouseRow
from ..enums import Role

router = APIRouter(
    prefix="/api/templates", 
    tags=["templates"], 
    dependencies=[Depends(require_role(Role.admin))]
)

@router.get("", response_model=list[SlotTemplateOut])
def list_templates(
    wh: WarehouseRow = Depends(get_context_warehouse),
    supa: Client = Depends(get_supabase),
):
    try:
        response = supa.table("slot_templates").select("*").eq("warehouse_id", wh.id).order("id").execute()
        return response.data
    except Exception:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"error_code": "DATABASE_ERROR"})

@router.post("", response_model=SlotTemplateOut)
def create_template(
    data: SlotTemplateCreate,
    wh: WarehouseRow = Depends(get_context_warehouse),
    supa: Client = Depends(get_supabase),
):
    try:
        payload = data.model_dump()
        payload["warehouse_id"] = wh.id
        
        # Konwersja enuma na wartość tekstową dla Supabase (jeśli pole slot_type jest enumem)
        if "slot_type" in payload and hasattr(payload["slot_type"], "value"):
            payload["slot_type"] = payload["slot_type"].value

        response = supa.table("slot_templates").insert(payload).execute()
        
        if not response.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error_code": "INSERT_FAILED"})
            
        return response.data[0]
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"error_code": "DATABASE_ERROR"})

@router.patch("/{template_id}", response_model=SlotTemplateOut)
def patch_template(
    template_id: int,
    data: SlotTemplatePatch,
    wh: WarehouseRow = Depends(get_context_warehouse),
    supa: Client = Depends(get_supabase),
):
    try:
        tmpl_rows = supa.table("slot_templates").select("*").eq("id", template_id).execute().data
        t = tmpl_rows[0] if tmpl_rows else None
        
        # Zabezpieczenie przed błędem w przypadku braku rekordu
        if not t or t.get("warehouse_id") != wh.id:
            raise HTTPException(status_code=404, detail={"error_code": "TEMPLATE_NOT_FOUND"})
            
        payload = data.model_dump(exclude_unset=True)
        
        # Ochrona przed wysłaniem pustego obiektu, co spowodowałoby błąd w Supabase
        if not payload:
            return t
            
        if "slot_type" in payload and hasattr(payload["slot_type"], "value"):
            payload["slot_type"] = payload["slot_type"].value

        # Aktualizacja rekordu, Supabase automatycznie zwróci odświeżone dane
        response = supa.table("slot_templates").update(payload).eq("id", template_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error_code": "UPDATE_FAILED"})
            
        return response.data[0]
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"error_code": "DATABASE_ERROR"})