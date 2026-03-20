from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_db
from .. import models
from ..deps import get_current_user, require_role, get_context_warehouse
from ..schemas import UserOut, UserCreate, UserPatch
from ..security import get_password_hash

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("", response_model=list[UserOut], dependencies=[Depends(require_role(models.Role.admin, models.Role.superadmin))])
def list_users(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(models.User)
    if user.role == models.Role.admin:
        wh = db.get(models.Warehouse, user.warehouse_id) if user.warehouse_id else None
        if not wh:
            return []
        q = q.filter(
            (models.User.warehouse_id == wh.id) | (models.User.company_id.in_(
                db.query(models.Company.id).filter(models.Company.warehouse_id == wh.id)
            ))
        )
    users = q.order_by(models.User.id).all()

    out = []
    for u in users:
        company_alias = None
        warehouse_alias = None
        if u.company_id:
            c = db.get(models.Company, u.company_id)
            if c:
                company_alias = c.alias
                w = db.get(models.Warehouse, c.warehouse_id)
                warehouse_alias = w.alias if w else None
        if u.warehouse_id:
            w = db.get(models.Warehouse, u.warehouse_id)
            warehouse_alias = w.alias if w else warehouse_alias
        out.append(UserOut(
            id=u.id, username=u.username, alias=u.alias, role=u.role,
            warehouse_id=u.warehouse_id, company_id=u.company_id,
            company_alias=company_alias, warehouse_alias=warehouse_alias
        ))
    return out

@router.post("", response_model=UserOut, dependencies=[Depends(require_role(models.Role.admin, models.Role.superadmin))])
def create_user(
    data: UserCreate,
    actor: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if db.query(models.User).filter(models.User.username==data.username).first():
        raise HTTPException(status_code=400, detail={"error_code":"USERNAME_TAKEN", "field":"username"})

    if actor.role == models.Role.admin:
        # admin can create client in own warehouse, or admin (warehouse context)
        if data.role == models.Role.client:
            if not data.company_id:
                raise HTTPException(status_code=400, detail={"error_code":"COMPANY_REQUIRED", "field":"company_id"})
            company = db.get(models.Company, data.company_id)
            if not company:
                raise HTTPException(status_code=404, detail={"error_code":"COMPANY_NOT_FOUND"})
            if company.warehouse_id != actor.warehouse_id:
                raise HTTPException(status_code=403, detail={"error_code":"FORBIDDEN"})
            user = models.User(
                username=data.username, password_hash=get_password_hash(data.password),
                alias=data.alias, role=models.Role.client,
                company_id=company.id, warehouse_id=None
            )
        elif data.role == models.Role.admin:
            if not actor.warehouse_id:
                raise HTTPException(status_code=400, detail={"error_code":"USER_WAREHOUSE_MISSING"})
            user = models.User(
                username=data.username, password_hash=get_password_hash(data.password),
                alias=data.alias, role=models.Role.admin,
                warehouse_id=actor.warehouse_id, company_id=None
            )
        else:
            raise HTTPException(status_code=403, detail={"error_code":"FORBIDDEN"})
    else:
        # superadmin can create admin for warehouse
        if data.role != models.Role.admin:
            raise HTTPException(status_code=400, detail={"error_code":"ROLE_NOT_ALLOWED"})
        if not data.warehouse_id:
            raise HTTPException(status_code=400, detail={"error_code":"WAREHOUSE_REQUIRED", "field":"warehouse_id"})
        wh = db.get(models.Warehouse, data.warehouse_id)
        if not wh:
            raise HTTPException(status_code=404, detail={"error_code":"WAREHOUSE_NOT_FOUND"})
        user = models.User(
            username=data.username, password_hash=get_password_hash(data.password),
            alias=data.alias, role=models.Role.admin,
            warehouse_id=wh.id, company_id=None
        )

    db.add(user)
    db.commit()
    db.refresh(user)

    company_alias = None
    warehouse_alias = None
    if user.company_id:
        c = db.get(models.Company, user.company_id)
        company_alias = c.alias if c else None
        w = db.get(models.Warehouse, c.warehouse_id) if c else None
        warehouse_alias = w.alias if w else None
    if user.warehouse_id:
        w = db.get(models.Warehouse, user.warehouse_id)
        warehouse_alias = w.alias if w else warehouse_alias

    return UserOut(
        id=user.id, username=user.username, alias=user.alias, role=user.role,
        warehouse_id=user.warehouse_id, company_id=user.company_id,
        company_alias=company_alias, warehouse_alias=warehouse_alias
    )



@router.delete("/{user_id}", status_code=204, dependencies=[Depends(require_role(models.Role.superadmin))])
def delete_user(
    user_id: int,
    actor: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user_id == actor.id:
        raise HTTPException(status_code=400, detail={"error_code": "CANNOT_DELETE_SELF"})
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail={"error_code": "USER_NOT_FOUND"})
    db.delete(user)
    db.commit()

@router.patch("/{user_id}", response_model=UserOut, dependencies=[Depends(require_role(models.Role.admin, models.Role.superadmin))])
def patch_user(
    user_id: int,
    data: UserPatch,
    actor: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail={"error_code": "USER_NOT_FOUND"})

    # admin może edytować tylko userów ze swojego warehouse
    if actor.role == models.Role.admin:
        wh_id = actor.warehouse_id
        user_wh_id = user.warehouse_id
        if user.company_id:
            company = db.get(models.Company, user.company_id)
            user_wh_id = company.warehouse_id if company else None
        if user_wh_id != wh_id:
            raise HTTPException(status_code=403, detail={"error_code": "FORBIDDEN"})

    payload = data.model_dump(exclude_unset=True)

    # zmiana username -> sprawdzenie unikalności
    if "username" in payload:
        taken = db.query(models.User).filter(
            models.User.username == payload["username"],
            models.User.id != user_id
        ).first()
        if taken:
            raise HTTPException(status_code=400, detail={"error_code": "USERNAME_TAKEN", "field": "username"})

    # zmiana roli -> admin nie może ustawić superadmin
    if "role" in payload:
        if actor.role == models.Role.admin and payload["role"] == models.Role.superadmin:
            raise HTTPException(status_code=403, detail={"error_code": "FORBIDDEN"})

    # zmiana hasła -> hashowanie
    if "password" in payload:
        payload["password_hash"] = get_password_hash(payload.pop("password"))

    # zmiana company_id -> walidacja przynależności do warehouse
    if "company_id" in payload and payload["company_id"] is not None:
        company = db.get(models.Company, payload["company_id"])
        if not company:
            raise HTTPException(status_code=404, detail={"error_code": "COMPANY_NOT_FOUND"})
        if actor.role == models.Role.admin and company.warehouse_id != actor.warehouse_id:
            raise HTTPException(status_code=403, detail={"error_code": "FORBIDDEN"})

    for k, v in payload.items():
        setattr(user, k, v)

    db.commit()
    db.refresh(user)

    # resolve aliasy do response
    company_alias = None
    warehouse_alias = None
    if user.company_id:
        c = db.get(models.Company, user.company_id)
        if c:
            company_alias = c.alias
            w = db.get(models.Warehouse, c.warehouse_id)
            warehouse_alias = w.alias if w else None
    if user.warehouse_id:
        w = db.get(models.Warehouse, user.warehouse_id)
        warehouse_alias = w.alias if w else warehouse_alias

    return UserOut(
        id=user.id, username=user.username, alias=user.alias, role=user.role,
        warehouse_id=user.warehouse_id, company_id=user.company_id,
        company_alias=company_alias, warehouse_alias=warehouse_alias,
    )