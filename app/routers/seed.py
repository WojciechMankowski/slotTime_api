from fastapi import APIRouter, Depends
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from ..deps import require_role
from ..db import get_db, engine
from .. import models, crud

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/init-db", summary="Utwórz tabele")
def init_db(_user: models.User = Depends(require_role(models.Role.superadmin))):
    """Tworzy wszystkie tabele w bazie danych (idempotentne — bezpieczne do ponownego wywołania)."""
    crud.create_tables()
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    return {"ok": True, "tables_created": tables}


@router.get("/db-status", summary="Stan bazy danych")
def db_status(
    _user: models.User = Depends(require_role(models.Role.superadmin)),
    db: Session = Depends(get_db),
):
    """Zwraca stan połączenia i liczbę rekordów w każdej tabeli."""
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()

    counts = {}
    for table in existing_tables:
        row = db.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
        counts[table] = row

    return {
        "status": "ok",
        "tables": existing_tables,
        "row_counts": counts,
    }


@router.post("/seed")
def run_seed(_user: models.User = Depends(require_role(models.Role.superadmin))):
    import seed
    seed.run()
    return {"ok": True}
