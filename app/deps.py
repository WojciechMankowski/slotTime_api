import logging

from fastapi import Depends, HTTPException, Query, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client
from typing import Optional

from .supabase_client import get_supabase
from .security import decode_token
from .schemas import UserRow, WarehouseRow
from .enums import Role

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)


def get_current_user(
    cred: Optional[HTTPAuthorizationCredentials] = Depends(security),
    supa: Client = Depends(get_supabase),
) -> UserRow:
    if not cred:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error_code": "MISSING_TOKEN"})
    
    # Przechwytujemy ewentualne błędy przy nieprawidłowym lub wygasłym tokenie
    try:
        payload = decode_token(cred.credentials)
        user_id = int(payload.get("sub"))
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error_code": "INVALID_TOKEN"})

    try:
        rows = supa.table("users").select("*").eq("id", user_id).execute().data
    except Exception as e:
        logger.error("[DB ERROR get_current_user] %s: %s", type(e).__name__, e)
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"error_code": "DATABASE_ERROR"})

    if not rows:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error_code": "INVALID_TOKEN"})
        
    return UserRow(**rows[0])


def require_role(*roles: Role):
    def _guard(user: UserRow = Depends(get_current_user)) -> UserRow:
        if user.role == Role.superadmin:
            return user  # superadmin omija wszystkie sprawdzenia ról
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"error_code": "FORBIDDEN"})
        return user
    return _guard


def warehouse_context(user: UserRow, supa: Client) -> WarehouseRow:
    if user.role == Role.superadmin:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error_code": "WAREHOUSE_CONTEXT_REQUIRED"})

    try:
        if user.role == Role.admin:
            if not user.warehouse_id:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail={"error_code": "USER_WAREHOUSE_MISSING"})

            rows = supa.table("warehouses").select("*").eq("id", user.warehouse_id).execute().data
            if not rows:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error_code": "WAREHOUSE_NOT_FOUND"})
            return WarehouseRow(**rows[0])

        # logik dla klienta: pobieramy kontekst przez przypisaną firmę
        if not user.company_id:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail={"error_code": "USER_COMPANY_MISSING"})

        # Optymalizacja: pobieramy tylko kolumnę warehouse_id zamiast całego rekordu firmy
        company_rows = supa.table("companies").select("warehouse_id").eq("id", user.company_id).execute().data
        if not company_rows:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error_code": "COMPANY_NOT_FOUND"})

        wh_id = company_rows[0].get("warehouse_id")
        if not wh_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error_code": "WAREHOUSE_NOT_FOUND"})

        wh_rows = supa.table("warehouses").select("*").eq("id", wh_id).execute().data
        if not wh_rows:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error_code": "WAREHOUSE_NOT_FOUND"})

        return WarehouseRow(**wh_rows[0])

    except HTTPException:
        raise
    except Exception as e:
        logger.error("[DB ERROR warehouse_context] %s: %s", type(e).__name__, e)
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"error_code": "DATABASE_ERROR"})


def get_context_warehouse(
    warehouse_id: Optional[int] = Query(None),
    user: UserRow = Depends(get_current_user),
    supa: Client = Depends(get_supabase),
) -> WarehouseRow:
    if user.role == Role.superadmin:
        if warehouse_id is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error_code": "WAREHOUSE_CONTEXT_REQUIRED"})

        try:
            rows = supa.table("warehouses").select("*").eq("id", warehouse_id).execute().data
            if not rows:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error_code": "WAREHOUSE_NOT_FOUND"})
            return WarehouseRow(**rows[0])

        except HTTPException:
            raise
        except Exception as e:
            logger.error("[DB ERROR get_context_warehouse] %s: %s", type(e).__name__, e)
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"error_code": "DATABASE_ERROR"})

    return warehouse_context(user, supa)


def get_optional_warehouse(
    warehouse_id: Optional[int] = Query(None),
    user: UserRow = Depends(get_current_user),
    supa: Client = Depends(get_supabase),
) -> Optional[WarehouseRow]:
    """Jak get_context_warehouse, ale dla superadmina bez warehouse_id zwraca None (brak filtra magazynowego)."""
    if user.role == Role.superadmin:
        if warehouse_id is None:
            return None

        try:
            rows = supa.table("warehouses").select("*").eq("id", warehouse_id).execute().data
            if not rows:
                raise HTTPException(status_code=404, detail={"error_code": "WAREHOUSE_NOT_FOUND"})
            return WarehouseRow(**rows[0])

        except HTTPException:
            raise
        except Exception as e:
            logger.error("[DB ERROR get_optional_warehouse] %s: %s", type(e).__name__, e)
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"error_code": "DATABASE_ERROR"})

    return warehouse_context(user, supa)