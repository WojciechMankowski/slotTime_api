from fastapi import Depends, HTTPException, Query, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client
from typing import Optional

from .supabase_client import get_supabase
from .security import decode_token
from .schemas import UserRow, WarehouseRow
from .enums import Role

security = HTTPBearer(auto_error=False)


def get_current_user(
    cred: Optional[HTTPAuthorizationCredentials] = Depends(security),
    supa: Client = Depends(get_supabase),
) -> UserRow:
    if not cred:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error_code": "INVALID_TOKEN"})
    payload = decode_token(cred.credentials)
    user_id = int(payload.get("sub"))
    rows = supa.table("users").select("*").eq("id", user_id).execute().data
    if not rows:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error_code": "INVALID_TOKEN"})
    return UserRow(**rows[0])


def require_role(*roles: Role):
    def _guard(user: UserRow = Depends(get_current_user)) -> UserRow:
        if user.role == Role.superadmin:
            return user  # superadmin bypasses all role checks
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"error_code": "FORBIDDEN"})
        return user
    return _guard


def warehouse_context(user: UserRow, supa: Client) -> WarehouseRow:
    if user.role == Role.superadmin:
        raise HTTPException(status_code=400, detail={"error_code": "WAREHOUSE_CONTEXT_REQUIRED"})
    if user.role == Role.admin:
        if not user.warehouse_id:
            raise HTTPException(status_code=400, detail={"error_code": "USER_WAREHOUSE_MISSING"})
        rows = supa.table("warehouses").select("*").eq("id", user.warehouse_id).execute().data
        if not rows:
            raise HTTPException(status_code=400, detail={"error_code": "WAREHOUSE_NOT_FOUND"})
        return WarehouseRow(**rows[0])
    # client: derive via company.warehouse
    if not user.company_id:
        raise HTTPException(status_code=400, detail={"error_code": "USER_COMPANY_MISSING"})
    company_rows = supa.table("companies").select("*").eq("id", user.company_id).execute().data
    if not company_rows:
        raise HTTPException(status_code=400, detail={"error_code": "COMPANY_NOT_FOUND"})
    company = company_rows[0]
    wh_rows = supa.table("warehouses").select("*").eq("id", company["warehouse_id"]).execute().data
    if not wh_rows:
        raise HTTPException(status_code=400, detail={"error_code": "WAREHOUSE_NOT_FOUND"})
    return WarehouseRow(**wh_rows[0])


def get_context_warehouse(
    warehouse_id: Optional[int] = Query(None),
    user: UserRow = Depends(get_current_user),
    supa: Client = Depends(get_supabase),
) -> WarehouseRow:
    if user.role == Role.superadmin:
        if warehouse_id is None:
            raise HTTPException(status_code=400, detail={"error_code": "WAREHOUSE_CONTEXT_REQUIRED"})
        rows = supa.table("warehouses").select("*").eq("id", warehouse_id).execute().data
        if not rows:
            raise HTTPException(status_code=404, detail={"error_code": "WAREHOUSE_NOT_FOUND"})
        return WarehouseRow(**rows[0])
    return warehouse_context(user, supa)
