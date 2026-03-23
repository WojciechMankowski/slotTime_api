from fastapi import Depends, HTTPException, Query, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Tuple, Optional
from .db import get_db
from .security import decode_token
from . import models

security = HTTPBearer()

def get_current_user(
    cred: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> models.User:
    payload = decode_token(cred.credentials)
    user_id = int(payload.get("sub"))
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error_code": "INVALID_TOKEN"})
    return user

def require_role(*roles: models.Role):
    def _guard(user: models.User = Depends(get_current_user)) -> models.User:
        if user.role == models.Role.superadmin:
            return user  # superadmin bypasses all role checks
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"error_code": "FORBIDDEN"})
        return user
    return _guard

def warehouse_context(user: models.User, db: Session) -> models.Warehouse:
    # C1 truth
    if user.role == models.Role.superadmin:
        raise HTTPException(status_code=400, detail={"error_code": "WAREHOUSE_CONTEXT_REQUIRED"})
    if user.role == models.Role.admin:
        if not user.warehouse_id:
            raise HTTPException(status_code=400, detail={"error_code": "USER_WAREHOUSE_MISSING"})
        wh = db.get(models.Warehouse, user.warehouse_id)
        if not wh:
            raise HTTPException(status_code=400, detail={"error_code": "WAREHOUSE_NOT_FOUND"})
        return wh
    # client: derive via company.warehouse
    if not user.company_id:
        raise HTTPException(status_code=400, detail={"error_code": "USER_COMPANY_MISSING"})
    company = db.get(models.Company, user.company_id)
    if not company:
        raise HTTPException(status_code=400, detail={"error_code": "COMPANY_NOT_FOUND"})
    wh = db.get(models.Warehouse, company.warehouse_id)
    if not wh:
        raise HTTPException(status_code=400, detail={"error_code": "WAREHOUSE_NOT_FOUND"})
    return wh

def get_context_warehouse(
    warehouse_id: Optional[int] = Query(None),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> models.Warehouse:
    if user.role == models.Role.superadmin:
        if warehouse_id is None:
            raise HTTPException(status_code=400, detail={"error_code": "WAREHOUSE_CONTEXT_REQUIRED"})
        wh = db.get(models.Warehouse, warehouse_id)
        if not wh:
            raise HTTPException(status_code=404, detail={"error_code": "WAREHOUSE_NOT_FOUND"})
        return wh
    return warehouse_context(user, db)
