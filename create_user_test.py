from typing import List, Dict, Any, Optional
from supabase import Client

from app.supabase_client import get_supabase
from app.security import get_password_hash
from app.enums import Role

def create_test_users(users_data: List[Dict[str, Any]], supa: Optional[Client] = None) -> List[Dict[str, Any]]:
    """
    Tworzy testowych użytkowników w bazie danych Supabase.
    Automatycznie hashuje podane hasła i parsuje role.
    
    :param users_data: Lista słowników z danymi użytkowników.
    :param supa: Opcjonalny klient Supabase (przydatny w testach). Jeśli brak, pobierze globalnego.
    :return: Lista utworzonych rekordów z bazy danych.
    """
    if supa is None:
        supa = get_supabase()

    payload = []
    for data in users_data:
        # Automatyczne hashowanie hasła, jeśli podano klucz 'password'
        password = data.get("password", "haslo123") 
        password_hash = data.get("password_hash") or get_password_hash(password)

        # Bezpieczne parsowanie roli (obsługa zarówno obiektu Enum, jak i stringa)
        role = data.get("role", Role.client)
        role_value = role.value if hasattr(role, "value") else role

        payload.append({
            "username": data["username"],
            "email": data.get("email"),
            "password_hash": password_hash,
            "alias": data.get("alias", data["username"]), # Domyślnie alias to username
            "role": role_value,
            "warehouse_id": data.get("warehouse_id"),
            "company_id": data.get("company_id")
        })

    if not payload:
        return []

    # Wykonanie jednego, zbiorczego zapytania INSERT dla optymalizacji wydajności
    response = supa.table("users").insert(payload).execute()
    return response.data

# Przykład użycia w skrypcie seed.py lub w celach testowych
nowi_uzytkownicy = [
    {
        "username": "admin",
        "password": "admin", 
        "email": "wojciech.mankowski@mcg-logistics.com",
        "alias": "Administrator Testowy",
        "role": Role.admin,
        "warehouse_id": 1
    },
     {
        "username": "superadmin",
        "password": "superadmin", 
        "email": "mails@mcg-logistics.com",
        "alias": "Super administrator Testowy",
        "role": Role.superadmin,
        "warehouse_id": 1
    }
]

utworzeni_uzytkownicy = create_test_users(nowi_uzytkownicy)

for u in utworzeni_uzytkownicy:
    print(f"Utworzono użytkownika: {u['username']} z ID: {u['id']}")