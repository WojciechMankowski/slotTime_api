from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from ..supabase_client import get_supabase
from .. import crud
from ..deps import get_current_user, require_role
from ..schemas import UserOut, UserCreate, UserPatch, UserRow
from ..security import get_password_hash
from ..enums import Role

router = APIRouter(prefix="/api/users", tags=["users"])


def _user_to_out(user: dict, supa: Client) -> UserOut:
    company_alias = None
    warehouse_alias = None
    if user["company_id"]:
        company_rows = supa.table("companies").select("alias,warehouse_id").eq("id", user["company_id"]).execute().data
        if company_rows:
            c = company_rows[0]
            company_alias = c["alias"]
            wh_rows = supa.table("warehouses").select("alias").eq("id", c["warehouse_id"]).execute().data
            warehouse_alias = wh_rows[0]["alias"] if wh_rows else None
    if user["warehouse_id"]:
        wh_rows = supa.table("warehouses").select("alias").eq("id", user["warehouse_id"]).execute().data
        if wh_rows:
            warehouse_alias = wh_rows[0]["alias"]
    return UserOut(
        id=user["id"], username=user["username"], email=user.get("email"),
        alias=user["alias"], role=user["role"],
        warehouse_id=user["warehouse_id"], company_id=user["company_id"],
        company_alias=company_alias, warehouse_alias=warehouse_alias,
    )


@router.get("", response_model=list[UserOut], dependencies=[Depends(require_role(Role.admin, Role.superadmin))])
def list_users(
    actor: UserRow = Depends(get_current_user),
    supa: Client = Depends(get_supabase),
):
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

    return [_user_to_out(u, supa) for u in users_data]


@router.post("", response_model=UserOut, dependencies=[Depends(require_role(Role.admin, Role.superadmin))])
def create_user(
    data: UserCreate,
    actor: UserRow = Depends(get_current_user),
    supa: Client = Depends(get_supabase),
):
    if crud.get_user_by_username(supa, data.username):
        raise HTTPException(status_code=400, detail={"error_code": "USERNAME_TAKEN", "field": "username"})
    if data.email:
        email_taken = supa.table("users").select("id").eq("email", data.email).execute().data
        if email_taken:
            raise HTTPException(status_code=400, detail={"error_code": "EMAIL_TAKEN", "field": "email"})

    if actor.role == Role.admin:
        if data.role == Role.client:
            if not data.company_id:
                raise HTTPException(status_code=400, detail={"error_code": "COMPANY_REQUIRED", "field": "company_id"})
            company = crud.get_company(supa, data.company_id)
            if not company:
                raise HTTPException(status_code=404, detail={"error_code": "COMPANY_NOT_FOUND"})
            if company["warehouse_id"] != actor.warehouse_id:
                raise HTTPException(status_code=403, detail={"error_code": "FORBIDDEN"})
            user = crud.create_user(supa, username=data.username, password=data.password,
                alias=data.alias, role=Role.client,
                email=data.email, company_id=company["id"])
        elif data.role == Role.admin:
            if not actor.warehouse_id:
                raise HTTPException(status_code=400, detail={"error_code": "USER_WAREHOUSE_MISSING"})
            user = crud.create_user(supa, username=data.username, password=data.password,
                alias=data.alias, role=Role.admin,
                email=data.email, warehouse_id=actor.warehouse_id)
        else:
            raise HTTPException(status_code=403, detail={"error_code": "FORBIDDEN"})
    else:
        # superadmin can create admin for warehouse
        if data.role != Role.admin:
            raise HTTPException(status_code=400, detail={"error_code": "ROLE_NOT_ALLOWED"})
        if not data.warehouse_id:
            raise HTTPException(status_code=400, detail={"error_code": "WAREHOUSE_REQUIRED", "field": "warehouse_id"})
        wh = crud.get_warehouse(supa, data.warehouse_id)
        if not wh:
            raise HTTPException(status_code=404, detail={"error_code": "WAREHOUSE_NOT_FOUND"})
        user = crud.create_user(supa, username=data.username, password=data.password,
            alias=data.alias, role=Role.admin,
            email=data.email, warehouse_id=wh["id"])

    return _user_to_out(user, supa)


@router.delete("/{user_id}", status_code=204, dependencies=[Depends(require_role(Role.superadmin))])
def delete_user(
    user_id: int,
    actor: UserRow = Depends(get_current_user),
    supa: Client = Depends(get_supabase),
):
    if user_id == actor.id:
        raise HTTPException(status_code=400, detail={"error_code": "CANNOT_DELETE_SELF"})
    user = crud.get_user(supa, user_id)
    if not user:
        raise HTTPException(status_code=404, detail={"error_code": "USER_NOT_FOUND"})
    supa.table("users").delete().eq("id", user_id).execute()


@router.patch("/{user_id}", response_model=UserOut, dependencies=[Depends(require_role(Role.admin, Role.superadmin))])
def patch_user(
    user_id: int,
    data: UserPatch,
    actor: UserRow = Depends(get_current_user),
    supa: Client = Depends(get_supabase),
):
    user = crud.get_user(supa, user_id)
    if not user:
        raise HTTPException(status_code=404, detail={"error_code": "USER_NOT_FOUND"})

    # admin może edytować tylko userów ze swojego warehouse
    if actor.role == Role.admin:
        wh_id = actor.warehouse_id
        user_wh_id = user["warehouse_id"]
        if user["company_id"]:
            company_rows = supa.table("companies").select("warehouse_id").eq("id", user["company_id"]).execute().data
            user_wh_id = company_rows[0]["warehouse_id"] if company_rows else None
        if user_wh_id != wh_id:
            raise HTTPException(status_code=403, detail={"error_code": "FORBIDDEN"})

    payload = data.model_dump(exclude_unset=True)

    if "username" in payload:
        taken = (
            supa.table("users").select("id")
            .eq("username", payload["username"])
            .neq("id", user_id)
            .execute().data
        )
        if taken:
            raise HTTPException(status_code=400, detail={"error_code": "USERNAME_TAKEN", "field": "username"})
    if "email" in payload and payload["email"]:
        taken = (
            supa.table("users").select("id")
            .eq("email", payload["email"])
            .neq("id", user_id)
            .execute().data
        )
        if taken:
            raise HTTPException(status_code=400, detail={"error_code": "EMAIL_TAKEN", "field": "email"})

    if "role" in payload:
        if actor.role == Role.admin and payload["role"] == Role.superadmin:
            raise HTTPException(status_code=403, detail={"error_code": "FORBIDDEN"})
        payload["role"] = payload["role"].value if hasattr(payload["role"], "value") else payload["role"]

    if "password" in payload:
        payload["password_hash"] = get_password_hash(payload.pop("password"))

    if "company_id" in payload and payload["company_id"] is not None:
        company = crud.get_company(supa, payload["company_id"])
        if not company:
            raise HTTPException(status_code=404, detail={"error_code": "COMPANY_NOT_FOUND"})
        if actor.role == Role.admin and company["warehouse_id"] != actor.warehouse_id:
            raise HTTPException(status_code=403, detail={"error_code": "FORBIDDEN"})

    supa.table("users").update(payload).eq("id", user_id).execute()
    updated = supa.table("users").select("*").eq("id", user_id).execute().data
    return _user_to_out(updated[0], supa)
