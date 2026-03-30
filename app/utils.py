import re
from sqlalchemy.orm import Session
from . import models

def slugify_alias(name: str) -> str:
    s = name.strip().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s or "x"

def next_company_alias(db: Session, warehouse_id: int, name: str) -> str:
    base = slugify_alias(name)[:20]
    alias = base.upper()
    i = 1
    while db.query(models.Company).filter(models.Company.warehouse_id==warehouse_id, models.Company.alias==alias).first():
        i += 1
        alias = f"{base[:18]}{i}".upper()
    return alias
