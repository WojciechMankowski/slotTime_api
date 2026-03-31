import re
from supabase import Client


def slugify_alias(name: str) -> str:
    s = name.strip().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s or "x"


def next_company_alias(supa: Client, warehouse_id: int, name: str) -> str:
    base = slugify_alias(name)[:20]
    alias = base.upper()
    i = 1
    while True:
        rows = (
            supa.table("companies").select("id")
            .eq("warehouse_id", warehouse_id)
            .eq("alias", alias)
            .execute().data
        )
        if not rows:
            break
        i += 1
        alias = f"{base[:18]}{i}".upper()
    return alias
