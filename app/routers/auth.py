import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from supabase import Client
from pydantic import BaseModel
from collections import defaultdict
from time import time

from ..supabase_client import get_supabase
from ..security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_refresh_token
from ..schemas import TokenOut, RefreshIn, RefreshOut, ForgotPasswordIn, VerifyResetCodeIn, ResetPasswordIn
from ..enums import Role, CodePurpose
from ..verification import create_verification_code, verify_code
from ..notifications import send_verification_code

router = APIRouter(prefix="/api", tags=["auth"])

# In-memory rate limiter: max 10 attempts per 60 seconds per IP
_login_attempts: dict[str, list[float]] = defaultdict(list)
_RATE_LIMIT = 10
_RATE_WINDOW = 60  # seconds

# Atrapa hasha do ochrony przed atakami czasowymi (dostosuj do swojego algorytmu, np. bcrypt)
_DUMMY_HASH = "$2b$12$DUMMYHASHFORSECURITYPURPOSESONLYXYZ1234567890123456"

def _check_rate_limit(ip: str) -> None:
    now = time()
    window_start = now - _RATE_WINDOW
    
    # Aktualizacja prób tylko dla obecnego IP
    attempts = [t for t in _login_attempts[ip] if t > window_start]
    
    if not attempts and ip in _login_attempts:
        del _login_attempts[ip] # Zwalnianie pamięci, gdy limit wygasł
    else:
        _login_attempts[ip] = attempts

    if len(attempts) >= _RATE_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"error_code": "TOO_MANY_REQUESTS"},
        )
    _login_attempts[ip].append(now)


class LoginIn(BaseModel):
    username: str
    password: str


@router.post("/login", response_model=TokenOut)
def login(data: LoginIn, request: Request, supa: Client = Depends(get_supabase)):
    ip = request.client.host if request.client else "unknown"
    _check_rate_limit(ip)
    
    try:
        rows = supa.table("users").select("*").eq("username", data.username).execute().data
    except Exception as e:
        logging.error(f"Login DB error for user '{data.username}': {type(e).__name__}: {e}")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"error_code": "DATABASE_ERROR", "message": str(e)})

    user = rows[0] if rows else None
    
    # Zabezpieczenie przed atakami czasowymi
    hash_to_check = user["password_hash"] if user else _DUMMY_HASH
    is_password_valid = verify_password(data.password, hash_to_check)

    if not user or not is_password_valid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, 
                            detail={"error_code": "BAD_CREDENTIALS", 'isPass': is_password_valid})
        
    if user["company_id"] is not None:
        try:
            company_rows = supa.table("companies").select("is_active").eq("id", user["company_id"]).execute().data
            if company_rows and not company_rows[0].get("is_active"):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"error_code": "COMPANY_INACTIVE"})
        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"Supabase company fetch error: {str(e)}")
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"error_code": "DATABASE_ERROR"})

    access_token = create_access_token(user_id=user["id"], role=user["role"])
    refresh_token = create_refresh_token(user_id=user["id"])
    
    return TokenOut(access_token=access_token, refresh_token=refresh_token, role=Role(user["role"]))


@router.post("/refresh", response_model=RefreshOut)
def refresh(data: RefreshIn, supa: Client = Depends(get_supabase)):
    try:
        payload = decode_refresh_token(data.refresh_token)
        user_id = int(payload["sub"])
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error_code": "INVALID_TOKEN"})

    try:
        rows = supa.table("users").select("*").eq("id", user_id).execute().data
    except Exception as err:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"error_code": "DATABASE_ERROR", 'err': err})

    if not rows:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error_code": "INVALID_TOKEN"})
        
    user = rows[0]
    
    if user["company_id"] is not None:
        try:
            company_rows = supa.table("companies").select("is_active").eq("id", user["company_id"]).execute().data
            if company_rows and not company_rows[0].get("is_active"):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"error_code": "COMPANY_INACTIVE"})
        except Exception as err:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"error_code": "DATABASE_ERROR", 'err': err})

    new_access_token = create_access_token(user_id=user["id"], role=user["role"])
    return RefreshOut(access_token=new_access_token)


def _find_user_id_by_email(supa: Client, email: str):
    """Zwraca id użytkownika o danym emailu lub None. Podnosi 503 przy błędzie DB."""
    try:
        rows = supa.table("users").select("id, email, alias, username").eq("email", email).limit(1).execute().data
    except Exception as e:
        logging.error(f"User lookup by email error: {type(e).__name__}: {e}")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"error_code": "DATABASE_ERROR"})
    return rows[0] if rows else None


@router.post("/forgot-password")
def forgot_password(
    data: ForgotPasswordIn,
    request: Request,
    background_tasks: BackgroundTasks,
    supa: Client = Depends(get_supabase),
):
    ip = request.client.host if request.client else "unknown"
    _check_rate_limit(ip)

    user = _find_user_id_by_email(supa, data.email)
    if user:
        code = create_verification_code(user["id"], CodePurpose.PASSWORD_RESET)
        name = user.get("alias") or user.get("username") or ""
        background_tasks.add_task(
            send_verification_code, data.email, name, CodePurpose.PASSWORD_RESET, code
        )

    # Zawsze ten sam wynik — nie zdradzamy, czy konto istnieje.
    return {"ok": True}


@router.post("/verify-reset-code")
def verify_reset_code(data: VerifyResetCodeIn, supa: Client = Depends(get_supabase)):
    user = _find_user_id_by_email(supa, data.email)
    if not user or not verify_code(user["id"], CodePurpose.PASSWORD_RESET, data.code, consume=False):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error_code": "INVALID_CODE"})
    return {"valid": True}


@router.post("/reset-password")
def reset_password(data: ResetPasswordIn, supa: Client = Depends(get_supabase)):
    user = _find_user_id_by_email(supa, data.email)
    if not user or not verify_code(user["id"], CodePurpose.PASSWORD_RESET, data.code, consume=True):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error_code": "INVALID_CODE"})

    try:
        supa.table("users").update({"password_hash": get_password_hash(data.new_password)}) \
            .eq("id", user["id"]).execute()
    except Exception as e:
        logging.error(f"Reset password update error: {type(e).__name__}: {e}")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"error_code": "DATABASE_ERROR"})

    return {"ok": True}