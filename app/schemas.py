
from pydantic import BaseModel, Field
from datetime import datetime, date, time
from typing import Optional, List, Literal
from .enums import Role, SlotType, SlotStatus


class UserRow(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    alias: str
    role: Role
    warehouse_id: Optional[int] = None
    company_id: Optional[int] = None
    password_hash: str


class WarehouseRow(BaseModel):
    id: int
    name: str
    alias: str
    location: Optional[str] = None
    is_active: bool = True
    logo_path: Optional[str] = None


class SlotStatusPatch(BaseModel):
    status: SlotStatus


class ErrorOut(BaseModel):
    error_code: str
    field: Optional[str] = None

class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    role: Role

class RefreshIn(BaseModel):
    refresh_token: str

class RefreshOut(BaseModel):
    access_token: str

class WarehouseOut(BaseModel):
    id: int
    name: str
    alias: str
    location: Optional[str] = None
    is_active: bool
    logo_path: Optional[str] = None

class WarehouseCreate(BaseModel):
    name: str
    alias: str
    location: Optional[str] = None
    is_active: bool = True

class WarehousePatch(BaseModel):
    name: Optional[str] = None
    alias: Optional[str] = None
    location: Optional[str] = None
    is_active: Optional[bool] = None

class CompanyOut(BaseModel):
    id: int
    name: str
    alias: str
    is_active: bool
    warehouse_id: Optional[int] = None

class CompanyCreate(BaseModel):
    name: str
    alias: Optional[str] = None
    is_active: bool = True

class MeOut(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    alias: str
    role: Role
    company: Optional[CompanyOut] = None
    warehouse: WarehouseOut

class UserOut(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    alias: str
    role: Role
    warehouse_id: Optional[int] = None
    company_id: Optional[int] = None
    company_alias: Optional[str] = None
    warehouse_alias: Optional[str] = None

class UserCreate(BaseModel):
    username: str
    email: Optional[str] = None
    password: str
    alias: str
    role: Role
    company_id: Optional[int] = None
    warehouse_id: Optional[int] = None  # only for superadmin creating admin

class DockOut(BaseModel):
    id: int
    name: str
    alias: str
    is_active: bool
    warehouse_id: Optional[int] = None

class DockCreate(BaseModel):
    name: str
    alias: str
    is_active: bool = True

class DockPatch(BaseModel):
    name: Optional[str] = None
    alias: Optional[str] = None
    is_active: Optional[bool] = None

class SlotNoticeOut(BaseModel):
    numer_zlecenia: str
    referencja: str
    rejestracja_auta: str
    rejestracja_naczepy: str
    ilosc_palet: int
    kierowca_imie_nazwisko: Optional[str] = None
    kierowca_tel: Optional[str] = None
    uwagi: Optional[str] = None

class SlotNoticeCreate(SlotNoticeOut):
    pass

class SlotOut(BaseModel):
    id: int
    warehouse_id: Optional[int] = None
    start_dt: datetime
    end_dt: datetime
    slot_type: SlotType
    original_slot_type: SlotType
    status: SlotStatus
    dock_id: Optional[int] = None
    dock_alias: Optional[str] = None
    reserved_by_user_id: Optional[int] = None
    reserved_by_alias: Optional[str] = None
    reserved_by_company_alias: Optional[str] = None

class SlotWithNoticeOut(BaseModel):
    id: int
    start_dt: datetime
    end_dt: datetime
    slot_type: SlotType
    original_slot_type: SlotType
    status: SlotStatus
    dock_id: Optional[int] = None
    dock_alias: Optional[str] = None
    reserved_by_user_id: Optional[int] = None
    reserved_by_alias: Optional[str] = None
    reserved_by_company_alias: Optional[str] = None
    notice: Optional[SlotNoticeOut] = None

class SlotReserveIn(BaseModel):
    requested_type: Optional[Literal["INBOUND","OUTBOUND"]] = None
    numer_zlecenia: str = ""
    referencja: str = ""
    rejestracja_auta: str = ""
    rejestracja_naczepy: str = ""
    ilosc_palet: int = Field(default=1, ge=1)
    kierowca_imie_nazwisko: Optional[str] = None
    kierowca_tel: Optional[str] = None
    uwagi: Optional[str] = None

class SlotConfirmIn(BaseModel):
    dock_id: Optional[int] = None

class SlotAssignDockIn(BaseModel):
    dock_id: int

class SlotGenerateIn(BaseModel):
    date_from: date
    date_to: date

    # ręczne
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    interval_minutes: Optional[int] = None
    slot_type: Optional[SlotType] = None

    # szablon
    template_id: Optional[int] = None

    parallel_slots: Optional[int] = 1

class SlotGenerateDayReport(BaseModel):
    date: date
    requested: int
    generated: int
    skipped_due_to_capacity: int
    capacity: Optional[int] = None

class SlotGenerateOut(BaseModel):
    generated_count: int
    skipped_due_to_capacity: int
    days: List[SlotGenerateDayReport]

class DayCapacityOut(BaseModel):
    id: int
    date: date
    slot_type: SlotType
    capacity: int

class DayCapacityUpsert(BaseModel):
    date: date
    slot_type: SlotType
    capacity: int = Field(ge=0)

class SlotTemplateOut(BaseModel):
    id: int
    name: str
    start_hour: int
    end_hour: int
    slot_minutes: int
    slot_type: SlotType
    is_active: bool

class SlotTemplateCreate(BaseModel):
    name: str
    start_hour: int = Field(ge=0, le=23)
    end_hour: int = Field(ge=1, le=24)
    slot_minutes: int = Field(ge=5, le=240)
    slot_type: SlotType = SlotType.ANY
    is_active: bool = True

class SlotTemplatePatch(BaseModel):
    name: Optional[str] = None
    start_hour: Optional[int] = Field(default=None, ge=0, le=23)
    end_hour: Optional[int] = Field(default=None, ge=1, le=24)
    slot_minutes: Optional[int] = Field(default=None, ge=5, le=240)
    slot_type: Optional[SlotType] = None
    is_active: Optional[bool] = None

class CompanyPatch(BaseModel):
    name: Optional[str] = None
    alias: Optional[str] = None
    is_active: Optional[bool] = None

class UserPatch(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    alias: Optional[str] = None
    password: Optional[str] = None
    role: Optional[Role] = None
    company_id: Optional[int] = None

class SlotPatch(BaseModel):
    slot_type: Optional[SlotType] = None
    start_dt: Optional[datetime] = None
    end_dt: Optional[datetime] = None
