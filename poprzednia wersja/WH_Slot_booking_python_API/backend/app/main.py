
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine, SessionLocal
from sqlalchemy import inspect, text

from .models import Company, User, Dock
from .auth import get_password_hash
from .routes import router

app = FastAPI(title="Time Slot Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.on_event("startup")
def on_startup():
    # Create tables
    Base.metadata.create_all(bind=engine)

    # Light-weight schema updates for SQLite (avoid manual migrations for this prototype)
    try:
        inspector = inspect(engine)
        if "slots" in inspector.get_table_names():
            cols = {c["name"] for c in inspector.get_columns("slots")}
            if "dock_id" not in cols:
                with engine.begin() as conn:
                    conn.execute(text("ALTER TABLE slots ADD COLUMN dock_id INTEGER"))
    except Exception:
        # If schema update fails, we still continue; tables already exist.
        pass

    # Seed admin + demo company + demo client (idempotent)
    db = SessionLocal()
    try:
        company = db.query(Company).filter(Company.name == "Default Company").first()
        if not company:
            company = Company(name="Default Company")
            db.add(company)
            db.commit()
            db.refresh(company)

        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin = User(
                username="admin",
                password_hash=get_password_hash("admin"),
                role="admin",
                company_id=company.id,
            )
            db.add(admin)
            db.commit()

        demo_client = db.query(User).filter(User.username == "client1").first()
        if not demo_client:
            demo_client = User(
                username="client1",
                password_hash=get_password_hash("client1"),
                role="client",
                company_id=company.id,
            )
            db.add(demo_client)
            db.commit()

        # Seed default docks (idempotent)
        existing_docks = db.query(Dock).count()
        if existing_docks == 0:
            for name in ["Dok 1", "Dok 2", "Dok 3"]:
                db.add(Dock(name=name))
            db.commit()
    finally:
        db.close()
