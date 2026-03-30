from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from .config import settings

# Supabase (i inne providery) mogą zwracać "postgres://" — SQLAlchemy wymaga "postgresql://"
_url = settings.DATABASE_URL
if _url.startswith("postgres://"):
    _url = _url.replace("postgres://", "postgresql://", 1)

_is_sqlite = _url.startswith("sqlite")

connect_args = {"check_same_thread": False} if _is_sqlite else {}
engine_kwargs: dict = {"connect_args": connect_args, "future": True}

if not _is_sqlite:
    # connection pool dla PostgreSQL / Supabase
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_size"] = 5
    engine_kwargs["max_overflow"] = 10

engine = create_engine(_url, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
