import ssl
from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from .config import settings


def _build_url(raw: str) -> str | URL:
    """
    Parsuje DATABASE_URL z obsługą znaków specjalnych w haśle (np. @, !, $).
    Używa URL.create() dla PostgreSQL — SQLAlchemy sam zakoduje hasło.
    SQLite zwraca surowy string bez zmian.
    """
    if raw.startswith("sqlite"):
        return raw

    # Wyodrębnij schemat
    scheme_end = raw.index("://") + 3
    scheme = raw[: scheme_end - 3]
    rest = raw[scheme_end:]

    # rfind("@") — ostatnie wystąpienie to separator credentials/host
    at_pos = rest.rfind("@")
    credentials = rest[:at_pos]
    host_db = rest[at_pos + 1 :]

    # user:password — dzielimy na pierwszym dwukropku
    colon_pos = credentials.index(":")
    username = credentials[:colon_pos]
    password = credentials[colon_pos + 1 :]

    # host:port/database
    slash_pos = host_db.index("/")
    host_port = host_db[:slash_pos]
    database = host_db[slash_pos + 1 :]

    if ":" in host_port:
        host, port_str = host_port.rsplit(":", 1)
        port = int(port_str)
    else:
        host = host_port
        port = None

    # Normalizuj schemat do postgresql+pg8000
    if scheme in ("postgres", "postgresql"):
        drivername = "postgresql+pg8000"
    else:
        drivername = scheme  # np. już "postgresql+pg8000"

    return URL.create(
        drivername=drivername,
        username=username,
        password=password,
        host=host,
        port=port,
        database=database,
    )


_raw = settings.DATABASE_URL
_is_sqlite = _raw.startswith("sqlite")
_url = _build_url(_raw)

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
