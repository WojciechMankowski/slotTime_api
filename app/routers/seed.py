from fastapi import APIRouter, Depends
# Importujemy funkcję z pliku, w którym została zdefiniowana (np. supabase_client)
from ..supabase_client import get_supabase
from ..deps import require_role
from .. import models

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/init-db", summary="Utwórz tabele")
def init_db(_user: models.User = Depends(require_role(models.Role.superadmin))):
    """
    Tworzenie tabel.
    W architekturze Supabase operacje DDL (Data Definition Language) 
    zazwyczaj wykonuje się przez panel dashboard lub migracje, a nie przez REST API.
    """
    return {
        "ok": False, 
        "message": "Zarządzanie strukturą tabel powinno odbywać się po stronie panelu Supabase lub poprzez migracje CLI."
    }


@router.get("/db-status", summary="Stan bazy danych")
def db_status(
    _user: models.User = Depends(require_role(models.Role.superadmin))
):
    """Zwraca stan połączenia i liczbę rekordów w zdefiniowanych tabelach."""
    client = get_supabase()

    # Zamiast inspektora z SQLAlchemy, definiujemy listę tabel do sprawdzenia
    # (możesz ją rozszerzyć o wszystkie tabele używane w projekcie)
    tables_to_check = [
        "users", "warehouses", "companies", 
        "docks", "slots", "notices"
    ]

    counts = {}
    for table in tables_to_check:
        try:
            # Używamy zapytań Supabase z count="exact" i limit(0) 
            # dla najwyższej wydajności (nie pobieramy samych danych, tylko ich liczbę)
            response = client.table(table).select("*", count="exact").limit(0).execute()
            counts[table] = response.count if response.count is not None else 0
        except Exception as e:
            counts[table] = f"Błąd: {str(e)}"

    return {
        "status": "ok",
        "tables": tables_to_check,
        "row_counts": counts,
    }


@router.post("/seed")
def run_seed(_user: models.User = Depends(require_role(models.Role.superadmin))):
    import seed
    seed.run()
    return {"ok": True}