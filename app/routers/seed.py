from fastapi import APIRouter, Depends
from ..deps import require_role
from .. import models

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/seed")
def run_seed(_user: models.User = Depends(require_role(models.Role.superadmin))):
    import seed
    seed.run()
    return {"ok": True}
