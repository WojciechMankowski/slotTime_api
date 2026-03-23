# FastAPI — Dobre praktyki dla projektu WH Slot Booking

> Dokument opisuje zasady i wzorce stosowane w tym projekcie.
> Każda sekcja zawiera przykłady z kodu produkcyjnego (`backend/app/`).

---

## 1. Struktura projektu

```
backend/app/
├── main.py          # fabryka aplikacji (create_app)
├── config.py        # ustawienia przez Pydantic Settings
├── db.py            # silnik SQLAlchemy + Base + get_db
├── models.py        # modele ORM — JEDEN plik dla małych projektów
├── schemas.py       # modele Pydantic (request / response)
├── deps.py          # zależności (get_current_user, require_role, …)
├── security.py      # JWT — tworzenie i weryfikacja tokenów
├── utils.py         # funkcje pomocnicze bez efektów ubocznych
└── routers/         # jeden plik na zasób
    ├── auth.py
    ├── companies.py
    ├── slots.py
    └── …
```

**Zasada:** router = zasób. Nie łączyć niezwiązanych endpointów w jednym pliku.

---

## 2. Fabryka aplikacji (Application Factory)

```python
# main.py
def create_app() -> FastAPI:
    app = FastAPI(title="WH Slot Booking API", version="2.1")
    app.add_middleware(CORSMiddleware, ...)
    app.include_router(auth.router)
    app.include_router(companies.router)
    # …
    return app

app = create_app()
```

**Dlaczego:** ułatwia testowanie (można stworzyć instancję testową bez uruchamiania serwera).

---

## 3. Zależności (Dependency Injection)

### Zasada: logika autoryzacji TYLKO w `deps.py`

```python
# deps.py
def require_role(*roles: models.Role):
    def _guard(user: models.User = Depends(get_current_user)) -> models.User:
        if user.role not in roles:
            raise HTTPException(403, detail={"error_code": "FORBIDDEN"})
        return user
    return _guard

def get_context_warehouse(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> models.Warehouse:
    return warehouse_context(user, db)
```

### Użycie w routerze

```python
# ✅ Dobrze — guard jako dependencies= (nie musi wracać wartości)
@router.delete("/{id}", status_code=204,
               dependencies=[Depends(require_role(models.Role.superadmin))])
def delete_company(id: int, db: Session = Depends(get_db)):
    ...

# ✅ Dobrze — gdy potrzebujesz aktora (kto wywołuje)
@router.delete("/{id}", status_code=204)
def delete_user(
    id: int,
    actor: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if id == actor.id:
        raise HTTPException(400, detail={"error_code": "CANNOT_DELETE_SELF"})
    ...
```

---

## 4. Schematy Pydantic (schemas.py)

### Trzy rodzaje schematów na zasób

```python
class CompanyCreate(BaseModel):   # POST — dane wejściowe
    name: str
    alias: str | None = None
    is_active: bool = True

class CompanyPatch(BaseModel):    # PATCH — wszystkie pola opcjonalne
    name: str | None = None
    alias: str | None = None
    is_active: bool | None = None

class CompanyOut(BaseModel):      # response — zawsze explicite
    id: int
    name: str
    alias: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
```

### Patch — pomijanie niezmiennych pól

```python
payload = data.model_dump(exclude_unset=True)  # tylko pola podane przez klienta
for k, v in payload.items():
    setattr(entity, k, v)
db.commit()
```

---

## 5. Format błędów API

**Zasada:** zawsze `{"error_code": "NAZWA_BLEDU"}` — nigdy surowy string.
Frontend mapuje `error_code` → komunikat PL/EN w `i18n.ts`.

```python
# ✅ Dobrze
raise HTTPException(404, detail={"error_code": "COMPANY_NOT_FOUND"})
raise HTTPException(409, detail={"error_code": "DOCK_HAS_ACTIVE_SLOTS"})
raise HTTPException(400, detail={"error_code": "FIELD_REQUIRED", "field": "alias"})

# ❌ Źle — surowy tekst nie jest obsługiwany przez frontend
raise HTTPException(404, detail="Company not found")
```

### Kody HTTP i kiedy ich używać

| Kod | Kiedy |
|-----|-------|
| 200 | GET, PATCH (zwraca dane) |
| 201 | POST (tworzenie zasobu) |
| 204 | DELETE (brak body w odpowiedzi) |
| 400 | Błąd walidacji biznesowej (zły stan, brakujące pole) |
| 401 | Brak/wygasły token |
| 403 | Brak uprawnień do operacji |
| 404 | Zasób nie istnieje |
| 409 | Konflikt stanu (alias zajęty, dok ma sloty) |

---

## 6. Obsługa bazy danych

### Session jako zależność — nigdy jako globalna zmienna

```python
# db.py
def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### Pobieranie pojedynczego rekordu

```python
# ✅ Dobrze — db.get() dla klucza głównego (bez dodatkowego SELECT)
entity = db.get(models.Company, company_id)
if not entity:
    raise HTTPException(404, detail={"error_code": "COMPANY_NOT_FOUND"})

# ✅ Dobrze — query z filtrem (np. sprawdzenie unikalności)
exists = db.query(models.Company).filter(
    models.Company.warehouse_id == wh_id,
    models.Company.alias == alias,
).first()
```

### Guard przed usunięciem (sprawdzenie zależności)

```python
# Sprawdź czy można usunąć przed db.delete()
has_users = db.query(models.User).filter(
    models.User.company_id == company_id
).first()
if has_users:
    raise HTTPException(409, detail={"error_code": "COMPANY_HAS_USERS"})

db.delete(company)
db.commit()
```

---

## 7. Kontekst magazynu (warehouse context)

W tym projekcie magazyn nigdy nie pochodzi z nagłówków HTTP — wyznaczany jest z roli użytkownika:

```
client     → user.company.warehouse_id
admin      → user.warehouse_id
superadmin → brak (dostęp globalny, nie używa get_context_warehouse)
```

```python
# ✅ Dobrze — endpoint admin/client
@router.get("", dependencies=[Depends(require_role(models.Role.admin))])
def list_docks(
    wh: models.Warehouse = Depends(get_context_warehouse),
    db: Session = Depends(get_db),
):
    return db.query(models.Dock).filter(models.Dock.warehouse_id == wh.id).all()

# ✅ Dobrze — endpoint superadmin (bez warehouse_id, działa globalnie)
@router.delete("/{id}", dependencies=[Depends(require_role(models.Role.superadmin))])
def delete_company(id: int, db: Session = Depends(get_db)):
    ...
```

---

## 8. Enumy i maszyna stanów

### Enumy jako `str, enum.Enum`

```python
class SlotStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    BOOKED = "BOOKED"
    CANCEL_PENDING = "CANCEL_PENDING"
    # …
```

`str` jako baza umożliwia bezpośrednie porównanie z wartościami string i serializację JSON bez konwersji.

### Guard na niedozwolone przejście

```python
# Zabroń ustawiania CANCEL_PENDING przez ogólny endpoint
if data.status == models.SlotStatus.CANCEL_PENDING:
    raise HTTPException(400, detail={"error_code": "USE_REQUEST_CANCEL_ENDPOINT"})
```

### Dedykowane endpointy dla przejść stanu

Zamiast ogólnego PATCH `/status`, każde ważne przejście stanu ma swój endpoint:

```
POST /slots/{id}/reserve          → AVAILABLE → BOOKED
POST /slots/{id}/approve          → BOOKED → APPROVED_WAITING_DETAILS
POST /slots/{id}/cancel           → * → CANCELLED
POST /slots/{id}/request-cancel   → * → CANCEL_PENDING (klient)
POST /slots/{id}/reject-cancel    → CANCEL_PENDING → previous_status (admin)
```

---

## 9. Migracje bazy danych

### Aktualna sytuacja (dev)

`seed.py` usuwa i odtwarza tabele. Nie uruchamiać na produkcji.

```python
# seed.py
Base.metadata.drop_all(engine)
Base.metadata.create_all(engine)
# insert test data…
```

### Dodawanie kolumny bez recreate (SQLite)

Gdy `seed.py` pomija tworzenie (baza ma dane), użyj `ALTER TABLE`:

```python
import sqlite3
conn = sqlite3.connect("app.db")
conn.execute("ALTER TABLE slots ADD COLUMN previous_status VARCHAR")
conn.commit()
conn.close()
```

### Docelowo — Alembic (Faza 3)

```bash
alembic revision --autogenerate -m "add previous_status to slots"
alembic upgrade head
```

---

## 10. Bezpieczeństwo

### JWT — weryfikacja w każdym zapytaniu

```python
# deps.py
def get_current_user(
    cred: HTTPAuthorizationCredentials = Depends(HTTPBearer()),
    db: Session = Depends(get_db),
) -> models.User:
    payload = decode_token(cred.credentials)  # rzuca wyjątek gdy wygasły/invalid
    user = db.get(models.User, int(payload["sub"]))
    if not user:
        raise HTTPException(401, detail={"error_code": "INVALID_TOKEN"})
    return user
```

### Hasła — tylko hash, nigdy plaintext

```python
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)
```

### CORS — tylko zaufane originy

```python
# config.py
class Settings(BaseSettings):
    cors_origins: list[str] = ["http://localhost:5173"]

# main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 11. Organizacja routerów

### Kolejność endpointów w pliku

Umieszczaj konkretne ścieżki przed parametryzowanymi — FastAPI dopasowuje po kolejności:

```python
# ✅ Dobrze — /archive przed /{slot_id}
@router.get("/archive")           # dopasuje GET /slots/archive
def get_archive(...): ...

@router.get("/{slot_id}")         # dopasuje GET /slots/123
def get_slot(...): ...

# ❌ Źle — /{slot_id} przechwytuje /archive
@router.get("/{slot_id}")
def get_slot(...): ...

@router.get("/archive")           # nigdy nie zostanie wywołany
def get_archive(...): ...
```

### Prefiks i tagi

```python
router = APIRouter(prefix="/api/companies", tags=["companies"])
```

`tags` grupują endpointy w dokumentacji `/docs`.

---

## 12. Response model i status code

```python
# Zawsze deklaruj response_model dla GET i POST
@router.get("", response_model=list[CompanyOut])
@router.post("", response_model=CompanyOut, status_code=201)

# DELETE — 204 bez body
@router.delete("/{id}", status_code=204)
def delete_...: ...   # funkcja nie zwraca nic (None)
```

---

## 13. Typowanie

Używaj pełnego typowania Pythona 3.10+ — FastAPI i Pydantic w pełni je obsługują:

```python
# ✅ Dobrze (Python 3.10+)
def patch_company(
    company_id: int,
    data: CompanyPatch,
    wh: models.Warehouse = Depends(get_context_warehouse),
    db: Session = Depends(get_db),
) -> CompanyOut:
    ...

# Opcjonalne pola
alias: str | None = None        # zamiast Optional[str]
list[CompanyOut]                # zamiast List[CompanyOut]
```

---

## 14. Dokumentacja automatyczna

FastAPI generuje `/docs` (Swagger UI) i `/redoc` automatycznie.
Wzbogacaj ją przez parametry dekoratora:

```python
@router.post(
    "",
    response_model=CompanyOut,
    status_code=201,
    summary="Utwórz firmę",
    description="Tworzy nową firmę w magazynie. Alias generowany automatycznie jeśli nie podano.",
    responses={
        400: {"description": "ALIAS_TAKEN — alias już istnieje w tym magazynie"},
        403: {"description": "FORBIDDEN — brak uprawnień"},
    },
)
```
