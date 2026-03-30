from fastapi import APIRouter, Depends
from ..deps import require_role
from .. import models
from ..db import engine, Base

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/init-db")
def init_db(_user: models.User = Depends(require_role(models.Role.superadmin))):
    Base.metadata.create_all(bind=engine)
    return {"ok": True}


@router.post("/seed")
def run_seed(_user: models.User = Depends(require_role(models.Role.superadmin))):
    import seed
    seed.run()
    return {"ok": True}
