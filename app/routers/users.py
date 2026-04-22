from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from ..supabase_client import get_supabase
from ..deps import get_current_user, require_role
from ..schemas import UserOut, UserCreate, UserPatch, UserRow
from ..security import get_password_hash
from ..enums import Role

router = APIRouter(prefix="/api/users", tags=["users"])


# =========================================================
# Helpers
# =========================================================

def _enrich_single_user(user: dict, supa: Client) -> UserOut:
    """Mapuje pojedynczego użytkownika odpytując bazę o jego powiązania."""
    company_alias = None
    warehouse_alias = None
    
    c_id = user.get("company_id")
    if c_id:
        company_rows = supa.table("companies").select("alias,warehouse_id").eq("id", c_id).execute().data
        if company_rows:
            c = company_rows[0]
            company_alias = c.get("alias")
            c_wh_id = c.get("warehouse_id")
            if c_wh_id:
                wh_rows = supa.table("warehouses").select("alias").eq("id", c_wh_id).execute().data
                warehouse_alias = wh_rows[0].get("alias") if wh_rows else None
                
    w_id = user.get("warehouse_id")
    if w_id:
        wh_rows = supa.table("warehouses").select("alias").eq("id", w_id).execute().data
        if wh_rows:
            warehouse_alias = wh_rows[0].get("alias")
            
    return UserOut(
        id=user["id"], 
        username=user.get("username"), 
        email=user.get("email"),
        alias=user.get("alias"), 
        role=user.get("role"),
        warehouse_id=w_id, 
        company_id=c_id,
        company_alias=company_alias, 
        warehouse_alias=warehouse_alias,
    )


def _format_user_from_maps(user: dict, companies_map: dict, warehouses_map: dict) -> UserOut:
    """Mapuje użytkownika korzystając z wcześniej pobranych słowników, unikając zapytań N+1."""
    company_alias = None
    warehouse_alias = None
    
    c_id = user.get("company_id")
    if c_id and c_id in companies_map:
        c_info = companies_map[c_id]
        company_alias = c_info.get("alias")
        c_wh_id = c_info.get("warehouse_id")
        if c_wh_id and c_wh_id in warehouses_map:
            warehouse_alias = warehouses_map[c_wh_id].get("alias")

    w_id = user.get("warehouse_id")
    if w_id and w_id in warehouses_map:
        warehouse_alias = warehouses_map[w_id].get("alias")

    return UserOut(
        id=user["id"], 
        username=user.get("username"), 
        email=user.get("email"),
        alias=user.get("alias"), 
        role=user.get("role"),
        warehouse_id=w_id, 
        company_id=c_id,
        company_alias=company_alias, 
        warehouse_alias=warehouse_alias,
    )


# =========================================================
# Endpoints
# =========================================================

@router.get("", response_model=list[UserOut], dependencies=[Depends(require_role(Role.admin, Role.superadmin))])
def list_users(
    actor: UserRow = Depends(get_current_user),
    supa: Client = Depends(get_supabase),
):
    try:
        if actor.role == Role.admin:
            if not actor.warehouse_id:
                return []
            wh_id = actor.warehouse_id
            company_rows = supa.table("companies").select("id").eq("warehouse_id", wh_id).execute().data
            company_ids = [str(c["id"]) for c in company_rows]
            
            if company_ids:
                or_filter = f"warehouse_id.eq.{wh_id},company_id.in.({','.join(company_ids)})"
                users_data = supa.table("users").select("*").or_(or_filter).order("id").execute().data
            else:
                users_data = supa.table("users").select("*").eq("warehouse_id", wh_id).order("id").execute().data
        else:
            users_data = supa.table("users").select("*").order("id").execute().data

        if not users_data:
            return []

        # Optymalizacja N+1: Zbiorcze pobieranie firm i magazynów
        company_ids = list({u["company_id"] for u in users_data if u.get("company_id")})
        warehouse_ids = list({u["warehouse_id"] for u in users_data if u.get("warehouse_id")})

        companies_map = {}
        if company_ids:
            c_data = supa.table("companies").select("id, alias, warehouse_id").in_("id", company_ids).execute().data
            companies_map = {c["id"]: c for c in c_data}
            # Dodanie magazynów powiązanych z firmami do listy pobierania
            warehouse_ids.extend([c.get("warehouse_id") for c in c_data if c.get("warehouse_id")])

        warehouses_map = {}
        warehouse_ids = list(set(warehouse_ids))
        if warehouse_ids:
            w_data = supa.table("warehouses").select("id, alias").in_("id", warehouse_ids).execute().data
            warehouses_map = {w["id"]: w for w in w_data}

        return [_format_user_from_maps(u, companies_map, warehouses_map) for u in users_data]
    except Exception:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"error_code": "DATABASE_ERROR"})


@router.get("/{user_id}", response_model=UserOut, dependencies=[Depends(require_role(Role.admin, Role.superadmin))])
def get_user(
    user_id: int,
    actor: UserRow = Depends(get_current_user),
    supa: Client = Depends(get_supabase),
):
    try:
        rows = supa.table("users").select("*").eq("id", user_id).execute().data
        if not rows:
            raise HTTPException(status_code=404, detail={"error_code": "USER_NOT_FOUND"})

        user = rows[0]

        if actor.role == Role.admin:
            wh_id = actor.warehouse_id
            user_wh_id = user.get("warehouse_id")
            if user.get("company_id"):
                company_rows = supa.table("companies").select("warehouse_id").eq("id", user["company_id"]).execute().data
                user_wh_id = company_rows[0].get("warehouse_id") if company_rows else None
            if user_wh_id != wh_id:
                raise HTTPException(status_code=403, detail={"error_code": "FORBIDDEN"})

        return _enrich_single_user(user, supa)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"error_code": "DATABASE_ERROR"})


@router.post("", response_model=UserOut, dependencies=[Depends(require_role(Role.admin, Role.superadmin))])
def create_user(
    data: UserCreate,
    actor: UserRow = Depends(get_current_user),
    supa: Client = Depends(get_supabase),
):
    try:
        username_exists = supa.table("users").select("id", count="exact").eq("username", data.username).limit(0).execute()
        if username_exists.count and username_exists.count > 0:
            raise HTTPException(status_code=400, detail={"error_code": "USERNAME_TAKEN", "field": "username"})
            
        if data.email:
            email_exists = supa.table("users").select("id", count="exact").eq("email", data.email).limit(0).execute()
            if email_exists.count and email_exists.count > 0:
                raise HTTPException(status_code=400, detail={"error_code": "EMAIL_TAKEN", "field": "email"})

        payload = {
            "username": data.username,
            "password_hash": get_password_hash(data.password),
            "alias": data.alias,
            "email": data.email,
        }

        if actor.role == Role.admin:
            if data.role == Role.client:
                if not data.company_id:
                    raise HTTPException(status_code=400, detail={"error_code": "COMPANY_REQUIRED", "field": "company_id"})
                company_rows = supa.table("companies").select("*").eq("id", data.company_id).execute().data
                company = company_rows[0] if company_rows else None
                if not company:
                    raise HTTPException(status_code=404, detail={"error_code": "COMPANY_NOT_FOUND"})
                if company.get("warehouse_id") != actor.warehouse_id:
                    raise HTTPException(status_code=403, detail={"error_code": "FORBIDDEN"})
                
                payload["role"] = Role.client.value
                payload["company_id"] = company["id"]
                
            elif data.role == Role.admin:
                if not actor.warehouse_id:
                    raise HTTPException(status_code=400, detail={"error_code": "USER_WAREHOUSE_MISSING"})
                
                payload["role"] = Role.admin.value
                payload["warehouse_id"] = actor.warehouse_id
            else:
                raise HTTPException(status_code=403, detail={"error_code": "FORBIDDEN"})
        else:
            # Prawa superadmina
            if data.role != Role.admin:
                raise HTTPException(status_code=400, detail={"error_code": "ROLE_NOT_ALLOWED"})
            if not data.warehouse_id:
                raise HTTPException(status_code=400, detail={"error_code": "WAREHOUSE_REQUIRED", "field": "warehouse_id"})
            
            wh_rows = supa.table("warehouses").select("id").eq("id", data.warehouse_id).execute().data
            if not wh_rows:
                raise HTTPException(status_code=404, detail={"error_code": "WAREHOUSE_NOT_FOUND"})
                
            payload["role"] = Role.admin.value
            payload["warehouse_id"] = wh_rows[0]["id"]

        response = supa.table("users").insert(payload).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error_code": "INSERT_FAILED"})
            
        return _enrich_single_user(response.data[0], supa)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"error_code": "DATABASE_ERROR"})


@router.delete("/{user_id}", status_code=204, dependencies=[Depends(require_role(Role.superadmin))])
def delete_user(
    user_id: int,
    actor: UserRow = Depends(get_current_user),
    supa: Client = Depends(get_supabase),
):
    try:
        if user_id == actor.id:
            raise HTTPException(status_code=400, detail={"error_code": "CANNOT_DELETE_SELF"})
            
        user_rows = supa.table("users").select("id").eq("id", user_id).limit(1).execute().data
        if not user_rows:
            raise HTTPException(status_code=404, detail={"error_code": "USER_NOT_FOUND"})
            
        supa.table("users").delete().eq("id", user_id).execute()
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"error_code": "DATABASE_ERROR"})


@router.patch("/{user_id}", response_model=UserOut, dependencies=[Depends(require_role(Role.admin, Role.superadmin))])
def patch_user(
    user_id: int,
    data: UserPatch,
    actor: UserRow = Depends(get_current_user),
    supa: Client = Depends(get_supabase),
):
    try:
        user_rows = supa.table("users").select("*").eq("id", user_id).execute().data
        user = user_rows[0] if user_rows else None
        if not user:
            raise HTTPException(status_code=404, detail={"error_code": "USER_NOT_FOUND"})

        # Sprawdzenie uprawnień admina do edycji usera z tego samego magazynu
        if actor.role == Role.admin:
            wh_id = actor.warehouse_id
            user_wh_id = user.get("warehouse_id")
            if user.get("company_id"):
                company_rows = supa.table("companies").select("warehouse_id").eq("id", user["company_id"]).execute().data
                user_wh_id = company_rows[0].get("warehouse_id") if company_rows else None
            if user_wh_id != wh_id:
                raise HTTPException(status_code=403, detail={"error_code": "FORBIDDEN"})

        payload = data.model_dump(exclude_unset=True)
        if not payload:
            return _enrich_single_user(user, supa)

        if "username" in payload:
            taken = (
                supa.table("users").select("id", count="exact")
                .eq("username", payload["username"])
                .neq("id", user_id)
                .limit(0)
                .execute()
            )
            if taken.count and taken.count > 0:
                raise HTTPException(status_code=400, detail={"error_code": "USERNAME_TAKEN", "field": "username"})
                
        if "email" in payload and payload["email"]:
            taken = (
                supa.table("users").select("id", count="exact")
                .eq("email", payload["email"])
                .neq("id", user_id)
                .limit(0)
                .execute()
            )
            if taken.count and taken.count > 0:
                raise HTTPException(status_code=400, detail={"error_code": "EMAIL_TAKEN", "field": "email"})

        if "role" in payload:
            if actor.role == Role.admin and payload["role"] == Role.superadmin:
                raise HTTPException(status_code=403, detail={"error_code": "FORBIDDEN"})
            payload["role"] = payload["role"].value if hasattr(payload["role"], "value") else payload["role"]

        new_password_hash = None
        if "password" in payload:
            new_password_hash = get_password_hash(payload.pop("password"))

        if "company_id" in payload and payload["company_id"] is not None:
            company_rows = supa.table("companies").select("*").eq("id", payload["company_id"]).execute().data
            company = company_rows[0] if company_rows else None
            if not company:
                raise HTTPException(status_code=404, detail={"error_code": "COMPANY_NOT_FOUND"})
            if actor.role == Role.admin and company.get("warehouse_id") != actor.warehouse_id:
                raise HTTPException(status_code=403, detail={"error_code": "FORBIDDEN"})

        response = supa.table("users").update(payload).eq("id", user_id).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error_code": "UPDATE_FAILED"})

        if new_password_hash:
            pw_response = supa.table("users").update({"password_hash": new_password_hash}).eq("id", user_id).execute()
            if not pw_response.data:
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error_code": "PASSWORD_UPDATE_FAILED"})

        return _enrich_single_user(response.data[0], supa)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"error_code": "DATABASE_ERROR"})