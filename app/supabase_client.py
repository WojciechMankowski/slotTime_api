from typing import Any, Dict, List, Optional
from supabase import create_client, Client
from .config import settings

_client: Client | None = None

def get_supabase() -> Client:
    global _client
    if _client is None:
        _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    return _client

def add_record(table_name: str, data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Dodaje nowy rekord do podanej tabeli w Supabase.
    
    :param table_name: Nazwa tabeli.
    :param data: Słownik z danymi do wstawienia.
    :return: Zwraca dodane dane.
    """
    client = get_supabase()
    response = client.table(table_name).insert(data).execute()
    return response.data

def get_records(table_name: str, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Pobiera rekordy z podanej tabeli w Supabase. Opcjonalnie pozwala na filtrowanie.
    
    :param table_name: Nazwa tabeli.
    :param filters: Słownik z filtrami (np. {"status": "active", "user_id": 1}).
    :return: Lista pobranych rekordów.
    """
    client = get_supabase()
    query = client.table(table_name).select("*")
    
    if filters:
        for key, value in filters.items():
            query = query.eq(key, value)
            
    response = query.execute()
    return response.data