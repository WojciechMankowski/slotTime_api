from app.db import SessionLocal, engine, Base
from app import models
from app.security import get_password_hash
from datetime import datetime, timedelta

def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # only seed if empty
    if db.query(models.User).count() > 0:
        print("DB already seeded.")
        return

    wh = models.Warehouse(name="Warehouse Demo", alias="WHDemo", location="PL", is_active=True, logo_path="/static/warehouses/1.png")
    db.add(wh)
    db.commit()
    db.refresh(wh)

    c = models.Company(warehouse_id=wh.id, name="Demo Company", alias="DEMO", is_active=True)
    db.add(c)
    db.commit()
    db.refresh(c)

    superadmin = models.User(username="superadmin", password_hash=get_password_hash("superadmin"), alias="Super Admin", role=models.Role.superadmin)
    admin = models.User(username="admin", password_hash=get_password_hash("admin"), alias="Admin WH", role=models.Role.admin, warehouse_id=wh.id)
    client = models.User(username="client", password_hash=get_password_hash("client"), alias="Jan Kowalski", role=models.Role.client, company_id=c.id)

    db.add_all([superadmin, admin, client])
    db.commit()

    dock1 = models.Dock(warehouse_id=wh.id, name="Dock A", alias="A", is_active=True)
    dock2 = models.Dock(warehouse_id=wh.id, name="Dock B", alias="B", is_active=False)
    db.add_all([dock1, dock2])
    db.commit()

    templ = models.SlotTemplate(warehouse_id=wh.id, name="Default 30m", start_hour=6, end_hour=18, slot_minutes=30, slot_type=models.SlotType.ANY, is_active=True)
    db.add(templ)
    db.commit()

    print("Seeded:")
    print("  superadmin/superadmin")
    print("  admin/admin")
    print("  client/client")
    print(f"  warehouse_id={wh.id}, template_id={templ.id}")

if __name__ == "__main__":
    run()
