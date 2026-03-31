import ssl
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from .config import settings

# Supabase (i inne providery) mogą zwracać "postgres://" — SQLAlchemy wymaga "postgresql://"
# pg8000 = czysty Python, działa na Vercel (psycopg2 wymaga rozszerzeń C)
_url = settings.DATABASE_URL
_is_sqlite = _url.startswith("sqlite")

if not _is_sqlite:
    if _url.startswith("postgres://"):
        _url = _url.replace("postgres://", "postgresql+pg8000://", 1)
    elif _url.startswith("postgresql://"):
        _url = _url.replace("postgresql://", "postgresql+pg8000://", 1)

if _is_sqlite:
    connect_args: dict = {"check_same_thread": False}
    engine_kwargs: dict = {"connect_args": connect_args, "future": True}
else:
    # SSL wymagany przez Supabase; pg8000 przyjmuje ssl_context
    # Supabase pooler używa self-signed cert — wyłączamy weryfikację
    _ssl_ctx = ssl.create_default_context()
    _ssl_ctx.check_hostname = False
    _ssl_ctx.verify_mode = ssl.CERT_NONE
    engine_kwargs = {
        "connect_args": {"ssl_context": _ssl_ctx},
        "future": True,
        "pool_pre_ping": True,
        "pool_size": 5,
        "max_overflow": 10,
    }

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
