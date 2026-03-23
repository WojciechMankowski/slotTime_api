from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from .config import settings
from .db import engine, Base
from .routers import auth, me, warehouses, companies, users, docks, slots, notices, day_capacity, templates, calendar, seed, reports


def create_app() -> FastAPI:
    app = FastAPI(title="WH Slot Booking API", version="2.1")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # === STATIC FILES (Windows-safe) ===
    base_dir = Path(__file__).resolve().parent
    static_dir = base_dir / "static"
    static_dir.mkdir(parents=True, exist_ok=True)

    app.mount(
        "/static",
        StaticFiles(directory=static_dir),
        name="static",
    )

    # === ROUTERS ===
    app.include_router(auth.router)
    app.include_router(me.router)
    app.include_router(warehouses.router)
    app.include_router(companies.router)
    app.include_router(users.router)
    app.include_router(docks.router)
    app.include_router(slots.router)
    app.include_router(notices.router)
    app.include_router(day_capacity.router)
    app.include_router(templates.router)
    app.include_router(calendar.router)
    app.include_router(seed.router)
    app.include_router(reports.router)

    @app.get("/health")
    def health():
        return {"ok": True}

    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000)