from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from collections import defaultdict
from time import time

from ..db import get_db
from .. import models
from ..security import verify_password, create_access_token, create_refresh_token, decode_refresh_token
from ..schemas import TokenOut, RefreshIn, RefreshOut

router = APIRouter(prefix="/api", tags=["auth"])

# In-memory rate limiter: max 10 attempts per 60 seconds per IP
_login_attempts: dict[str, list[float]] = defaultdict(list)
_RATE_LIMIT = 10
_RATE_WINDOW = 60  # seconds


def _check_rate_limit(ip: str) -> None:
    now = time()
    window_start = now - _RATE_WINDOW
    attempts = [t for t in _login_attempts[ip] if t > window_start]
    _login_attempts[ip] = attempts
    if len(attempts) >= _RATE_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"error_code": "TOO_MANY_REQUESTS"},
        )
    _login_attempts[ip].append(now)


class LoginIn(BaseModel):
    email: str
    password: str

@router.post("/login", response_model=TokenOut)
def login(data: LoginIn, request: Request, db: Session = Depends(get_db)):
    ip = request.client.host if request.client else "unknown"
    _check_rate_limit(ip)
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error_code": "BAD_CREDENTIALS"})
    if user.company_id is not None and user.company and not user.company.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"error_code": "COMPANY_INACTIVE"})
    access_token = create_access_token(user_id=user.id, role=user.role.value)
    refresh_token = create_refresh_token(user_id=user.id)
    return TokenOut(access_token=access_token, refresh_token=refresh_token, role=user.role)


@router.post("/refresh", response_model=RefreshOut)
def refresh(data: RefreshIn, db: Session = Depends(get_db)):
    payload = decode_refresh_token(data.refresh_token)
    user_id = int(payload["sub"])
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error_code": "INVALID_TOKEN"})
    if user.company_id is not None and user.company and not user.company.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"error_code": "COMPANY_INACTIVE"})
    new_access_token = create_access_token(user_id=user.id, role=user.role.value)
    return RefreshOut(access_token=new_access_token)
