from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..db import get_db
from .. import models
from ..security import verify_password, create_access_token
from ..schemas import TokenOut

router = APIRouter(prefix="/api", tags=["auth"])

class LoginIn(BaseModel):
    username: str
    password: str

@router.post("/login", response_model=TokenOut)
def login(data: LoginIn, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == data.username).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error_code": "BAD_CREDENTIALS"})
    token = create_access_token(user_id=user.id, role=user.role.value)
    return TokenOut(access_token=token, role=user.role)
