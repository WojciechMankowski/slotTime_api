
import os
from datetime import datetime, date, time, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session
from sqlalchemy import func

from .database import get_db
from .models import User, Slot, Company, SlotTemplate, DayCapacity, Dock, SlotNotice
from .auth import create_token, verify_password, get_current_user, get_password_hash
from .email_utils import send_email_notification, EMAIL_FROM

router = APIRouter()


# ---------- Schemy ----------

class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    company_name: Optional[str]


class SlotCreate(BaseModel):
    start_time: datetime
    end_time: datetime
    slot_type: str = "ANY"
    status: str = "OPEN"  # domyślnie otwarty


class SlotUpdate(BaseModel):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    slot_type: Optional[str] = None
    status: Optional[str] = None


class SlotOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    start_time: datetime
    end_time: datetime
    slot_type: str
    status: str
    reserved_by_user_id: Optional[int] = None
    dock_id: Optional[int] = None


class CompanyCreate(BaseModel):
    name: str


class CompanyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "client"        # domyślnie klient
    company_id: int             # firma, do której należy


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    role: str
    company_id: Optional[int]


class TemplateCreate(BaseModel):
    name: str
    slot_type: str = "ANY"          # INBOUND / OUTBOUND / ANY
    start_time: str                 # "HH:MM"
    end_time: str                   # "HH:MM"
    interval_minutes: int = 30      # co ile minut
    capacity: int = 1               # ile równoległych slotów


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    slot_type: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    interval_minutes: Optional[int] = None
    capacity: Optional[int] = None


class TemplateOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slot_type: str
    start_time: str
    end_time: str
    interval_minutes: int
    capacity: int


class TemplateGenerateRequest(BaseModel):
    date_from: date
    date_to: date
    # opcjonalnie ustaw limity dzienne w trakcie generowania (żeby nie robić ręcznie per dzień)
    inbound_limit: Optional[int] = None   # 0 = brak limitu
    outbound_limit: Optional[int] = None  # 0 = brak limitu


class DayCapacityCreate(BaseModel):
    date: date
    inbound_limit: int
    outbound_limit: int


class DayCapacityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    date: date
    inbound_limit: int
    outbound_limit: int


# ---------- Helpers ----------

VALID_STATUSES = {
    "OPEN",
    "RESERVED_PENDING",
    "APPROVED_WAITING_DETAILS",
    "RESERVED_CONFIRMED",
    "CANCEL_PENDING",
    "CLOSED",
}


VALID_SLOT_TYPES = {"INBOUND", "OUTBOUND", "ANY"}


class ReserveRequest(BaseModel):
    requested_type: str


class SlotNoticeIn(BaseModel):
    order_number: str
    reference: str
    vehicle_registration: str
    trailer_registration: str
    driver_name: str
    driver_phone: str
    pallet_count: int
    remarks: Optional[str] = None


class SlotNoticeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slot_id: int
    order_number: str
    reference: str
    vehicle_registration: str
    trailer_registration: str
    driver_name: str
    driver_phone: str
    pallet_count: int
    remarks: Optional[str] = None


class DockCreate(BaseModel):
    name: str


class DockOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class AssignDockRequest(BaseModel):
    dock_id: Optional[int] = None


def ensure_admin(current_user: dict):
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins are allowed to perform this action",
        )


def _parse_hhmm(hhmm: str) -> time:
    try:
        h, m = map(int, hhmm.split(":"))
        return time(hour=h, minute=m)
    except Exception:
        raise HTTPException(status_code=400, detail="Time must be in HH:MM format")


# ---------- Endpointy AUTH ----------

@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid credentials",
        )

    token = create_token(user.id, user.role)
    company_name = user.company.name if user.company else None

    return LoginResponse(
        access_token=token,
        role=user.role,
        user_id=user.id,
        company_name=company_name,
    )


# ---------- Endpointy COMPANY ----------

@router.post("/companies", response_model=CompanyOut)
def create_company(
    company: CompanyCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_admin(current_user)

    existing = db.query(Company).filter(Company.name == company.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company with this name already exists",
        )

    new_company = Company(name=company.name)
    db.add(new_company)
    db.commit()
    db.refresh(new_company)
    return new_company


@router.get("/companies", response_model=List[CompanyOut])
def list_companies(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    companies = db.query(Company).order_by(Company.name).all()
    return companies


# ---------- Endpointy USERS ----------

@router.post("/users", response_model=UserOut)
def create_user(
    user_in: UserCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_admin(current_user)

    company = db.query(Company).filter(Company.id == user_in.company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company not found",
        )

    existing = db.query(User).filter(User.username == user_in.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this username already exists",
        )

    new_user = User(
        username=user_in.username,
        password_hash=get_password_hash(user_in.password),
        role=user_in.role,
        company_id=user_in.company_id,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.get("/users", response_model=List[UserOut])
def list_users(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_admin(current_user)
    users = db.query(User).order_by(User.id).all()
    return users


# ---------- Endpointy TEMPLATES ----------

@router.post("/templates", response_model=TemplateOut)
def create_template(
    template_in: TemplateCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_admin(current_user)

    if template_in.interval_minutes <= 0:
        raise HTTPException(status_code=400, detail="Interval must be positive")
    if template_in.capacity <= 0:
        raise HTTPException(status_code=400, detail="Capacity must be positive")

    # walidacja HH:MM
    _parse_hhmm(template_in.start_time)
    _parse_hhmm(template_in.end_time)

    new_t = SlotTemplate(
        name=template_in.name,
        slot_type=template_in.slot_type,
        start_time=template_in.start_time,
        end_time=template_in.end_time,
        interval_minutes=template_in.interval_minutes,
        capacity=template_in.capacity,
    )
    db.add(new_t)
    db.commit()
    db.refresh(new_t)
    return new_t


@router.patch("/templates/{template_id}", response_model=TemplateOut)
def update_template(
    template_id: int,
    template_upd: TemplateUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_admin(current_user)

    t = db.query(SlotTemplate).filter(SlotTemplate.id == template_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")

    if template_upd.name is not None:
        t.name = template_upd.name
    if template_upd.slot_type is not None:
        t.slot_type = template_upd.slot_type
    if template_upd.start_time is not None:
        _parse_hhmm(template_upd.start_time)
        t.start_time = template_upd.start_time
    if template_upd.end_time is not None:
        _parse_hhmm(template_upd.end_time)
        t.end_time = template_upd.end_time
    if template_upd.interval_minutes is not None:
        if template_upd.interval_minutes <= 0:
            raise HTTPException(status_code=400, detail="Interval must be positive")
        t.interval_minutes = template_upd.interval_minutes
    if template_upd.capacity is not None:
        if template_upd.capacity <= 0:
            raise HTTPException(status_code=400, detail="Capacity must be positive")
        t.capacity = template_upd.capacity

    db.commit()
    db.refresh(t)
    return t


@router.get("/templates", response_model=List[TemplateOut])
def list_templates(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_admin(current_user)
    return db.query(SlotTemplate).order_by(SlotTemplate.id).all()


@router.post("/templates/{template_id}/generate")
def generate_slots_from_template(
    template_id: int,
    req: TemplateGenerateRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_admin(current_user)

    template = db.query(SlotTemplate).filter(SlotTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    start_t = _parse_hhmm(template.start_time)
    end_t = _parse_hhmm(template.end_time)

    if template.interval_minutes <= 0:
        raise HTTPException(status_code=400, detail="Interval must be positive")

    created_count = 0
    current_day = req.date_from
    while current_day <= req.date_to:
        dt_start = datetime.combine(current_day, start_t)
        dt_end_limit = datetime.combine(current_day, end_t)

        dt = dt_start
        while dt < dt_end_limit:
            next_dt = dt + timedelta(minutes=template.interval_minutes)
            # tworzymy 'capacity' slotów równoległych
            for _ in range(template.capacity):
                slot = Slot(
                    start_time=dt,
                    end_time=next_dt,
                    slot_type=template.slot_type,
                    status="OPEN",
                )
                db.add(slot)
                created_count += 1
            dt = next_dt

        # opcjonalnie: ustaw limity dzienne w trakcie generowania (na każdy dzień w zakresie)
        if req.inbound_limit is not None or req.outbound_limit is not None:
            cap = db.query(DayCapacity).filter(DayCapacity.date == current_day).first()
            if not cap:
                cap = DayCapacity(date=current_day, inbound_limit=0, outbound_limit=0)
                db.add(cap)

            if req.inbound_limit is not None:
                if req.inbound_limit < 0:
                    raise HTTPException(status_code=400, detail="inbound_limit cannot be negative")
                cap.inbound_limit = req.inbound_limit

            if req.outbound_limit is not None:
                if req.outbound_limit < 0:
                    raise HTTPException(status_code=400, detail="outbound_limit cannot be negative")
                cap.outbound_limit = req.outbound_limit

        current_day += timedelta(days=1)

    db.commit()
    return {"message": f"Generated {created_count} slots from template {template.name} (and updated day limits if provided)"}


# ---------- Endpointy DAY CAPACITY ----------

@router.post("/day-capacity", response_model=DayCapacityOut)
def set_day_capacity(
    cap_in: DayCapacityCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_admin(current_user)

    cap = db.query(DayCapacity).filter(DayCapacity.date == cap_in.date).first()
    if cap:
        cap.inbound_limit = cap_in.inbound_limit
        cap.outbound_limit = cap_in.outbound_limit
    else:
        cap = DayCapacity(
            date=cap_in.date,
            inbound_limit=cap_in.inbound_limit,
            outbound_limit=cap_in.outbound_limit,
        )
        db.add(cap)
    db.commit()
    db.refresh(cap)
    return cap


@router.get("/day-capacity", response_model=List[DayCapacityOut])
def list_day_capacity(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_admin(current_user)
    caps = db.query(DayCapacity).order_by(DayCapacity.date).all()
    return caps


# ---------- Endpointy SLOTS ----------

@router.get("/slots", response_model=List[SlotOut])
def get_slots(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    slots = db.query(Slot).order_by(Slot.start_time).all()
    return slots


@router.post("/slots", response_model=SlotOut)
def create_slot(
    slot: SlotCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_admin(current_user)

    if slot.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid slot status")

    new_slot = Slot(
        start_time=slot.start_time,
        end_time=slot.end_time,
        slot_type=slot.slot_type,
        status=slot.status,
    )
    db.add(new_slot)
    db.commit()
    db.refresh(new_slot)
    return new_slot


@router.patch("/slots/{slot_id}", response_model=SlotOut)
def update_slot(
    slot_id: int,
    slot_update: SlotUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_admin(current_user)

    slot = db.query(Slot).filter(Slot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    if slot_update.start_time is not None:
        slot.start_time = slot_update.start_time
    if slot_update.end_time is not None:
        slot.end_time = slot_update.end_time
    if slot_update.slot_type is not None:
        slot.slot_type = slot_update.slot_type
    if slot_update.status is not None:
        if slot_update.status not in VALID_STATUSES:
            raise HTTPException(status_code=400, detail="Invalid status")
        slot.status = slot_update.status

    db.commit()
    db.refresh(slot)
    return slot


@router.post("/slots/{slot_id}/reserve")
def reserve_slot(
    slot_id: int,
    req: ReserveRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # tylko client
    if current_user.get("role") != "client":
        raise HTTPException(status_code=403, detail="Only clients can reserve slots")

    slot = db.query(Slot).filter(Slot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    if slot.status != "OPEN":
        raise HTTPException(status_code=400, detail="Slot is not open")

    requested_type = (req.requested_type or "").upper().strip()
    if requested_type not in {"INBOUND", "OUTBOUND"}:
        raise HTTPException(status_code=400, detail="requested_type must be INBOUND or OUTBOUND")

    # Walidacja typu slotu względem wyboru klienta
    if slot.slot_type in {"INBOUND", "OUTBOUND"} and slot.slot_type != requested_type:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Na wybrany termin nie są dostępne sloty typu {requested_type}. "
                f"Dostępne są tylko sloty {slot.slot_type}."
            ),
        )
    if slot.slot_type == "ANY":
        # jeśli admin udostępnił slot 'ANY', klient wybiera typ w momencie rezerwacji
        slot.slot_type = requested_type

    # --- sprawdzenie dziennego limitu Inbound/Outbound (współdzielone między klientami) ---
    slot_date = slot.start_time.date()
    cap = db.query(DayCapacity).filter(DayCapacity.date == slot_date).first()

    if cap and slot.slot_type in {"INBOUND", "OUTBOUND"}:
        limit = cap.inbound_limit if slot.slot_type == "INBOUND" else cap.outbound_limit

        if limit > 0:
            used = (
                db.query(Slot)
                .filter(
                    Slot.slot_type == slot.slot_type,
                    func.date(Slot.start_time) == slot_date,
                    Slot.status.in_(["RESERVED_PENDING", "APPROVED_WAITING_DETAILS", "RESERVED_CONFIRMED", "CANCEL_PENDING"]),
                )
                .count()
            )
            if used >= limit:
                raise HTTPException(
                    status_code=400,
                    detail=f"Przekroczono limit slotów {slot.slot_type} na dzień {slot_date}.",
                )

    slot.reserved_by_user_id = int(current_user["sub"])
    slot.status = "RESERVED_PENDING"
    db.commit()

    # Powiadomienie mailowe (opcjonalnie)
    notify_to = os.getenv("NOTIFY_EMAIL_TO", EMAIL_FROM or "")
    if notify_to:
        subject = f"Nowa rezerwacja slotu #{slot.id} (oczekuje na potwierdzenie)"
        body = (
            f"Zarezerwowano slot #{slot.id}\n"
            f"Start: {slot.start_time}\n"
            f"Koniec: {slot.end_time}\n"
            f"Użytkownik ID: {slot.reserved_by_user_id}\n"
            f"Status: {slot.status}\n"
        )
        background_tasks.add_task(
            send_email_notification,
            subject,
            body,
            [notify_to],
        )

    return {"message": "Slot reserved, waiting for admin confirmation"}


@router.post("/slots/{slot_id}/confirm")
def confirm_reservation(
    slot_id: int,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_admin(current_user)

    slot = db.query(Slot).filter(Slot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    if slot.status not in {"RESERVED_PENDING", "CANCEL_PENDING"}:
        raise HTTPException(status_code=400, detail="Slot is not pending confirmation")

    # jeśli była prośba o anulację – potwierdź anulację
    if slot.status == "CANCEL_PENDING":
        slot.status = "OPEN"
        slot.reserved_by_user_id = None
        action = "Cancellation confirmed"
    else:
        # Po zatwierdzeniu przez admina klient MUSI uzupełnić dane awizacyjne
        slot.status = "APPROVED_WAITING_DETAILS"
        action = "Reservation approved - waiting for notice details"

    db.commit()

    notify_to = os.getenv("NOTIFY_EMAIL_TO", EMAIL_FROM or "")
    if notify_to:
        subject = f"Slot #{slot.id}: {action}"
        body = (
            f"Slot #{slot.id}\n"
            f"Start: {slot.start_time}\n"
            f"Koniec: {slot.end_time}\n"
            f"Status: {slot.status}\n"
            f"Użytkownik ID: {slot.reserved_by_user_id}\n"
        )
        background_tasks.add_task(
            send_email_notification,
            subject,
            body,
            [notify_to],
        )

    return {"message": action}


@router.post("/slots/{slot_id}/reject")
def reject_reservation(
    slot_id: int,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_admin(current_user)

    slot = db.query(Slot).filter(Slot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    if slot.status not in {"RESERVED_PENDING", "APPROVED_WAITING_DETAILS", "RESERVED_CONFIRMED", "CANCEL_PENDING"}:
        raise HTTPException(status_code=400, detail="Slot has no reservation to reject")

    slot.status = "OPEN"
    slot.reserved_by_user_id = None
    db.commit()

    notify_to = os.getenv("NOTIFY_EMAIL_TO", EMAIL_FROM or "")
    if notify_to:
        subject = f"Slot #{slot.id}: reservation cancelled by admin"
        body = (
            f"Slot #{slot.id}\n"
            f"Start: {slot.start_time}\n"
            f"Koniec: {slot.end_time}\n"
            f"Status: {slot.status}\n"
        )
        background_tasks.add_task(
            send_email_notification,
            subject,
            body,
            [notify_to],
        )

    return {"message": "Reservation cancelled and slot is open again"}


@router.post("/slots/{slot_id}/request-cancel")
def request_cancel_slot(
    slot_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # tylko klient, który ma rezerwację na tym slocie
    if current_user.get("role") != "client":
        raise HTTPException(status_code=403, detail="Only clients can request cancellation")

    slot = db.query(Slot).filter(Slot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    user_id = int(current_user["sub"])
    if slot.reserved_by_user_id != user_id:
        raise HTTPException(status_code=403, detail="You are not the owner of this reservation")

    if slot.status not in {"RESERVED_PENDING", "APPROVED_WAITING_DETAILS", "RESERVED_CONFIRMED"}:
        raise HTTPException(status_code=400, detail="Reservation cannot be cancelled in current status")

    slot.status = "CANCEL_PENDING"
    db.commit()

    return {"message": "Cancellation request sent, waiting for admin confirmation"}


@router.post("/slots/{slot_id}/reject-cancel")
def reject_cancel_request(
    slot_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Admin odrzuca prośbę o anulację. Przywraca sensowny poprzedni status."""
    ensure_admin(current_user)

    slot = db.query(Slot).filter(Slot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    if slot.status != "CANCEL_PENDING":
        raise HTTPException(status_code=400, detail="Slot is not pending cancellation")

    # W tym prototypie minimalnie: jeśli brak awizacji, wracamy do RESERVED_PENDING; jeśli jest awizacja, do RESERVED_CONFIRMED
    slot.status = "RESERVED_CONFIRMED" if slot.notice is not None else "RESERVED_PENDING"
    db.commit()
    return {"message": "Cancellation rejected"}



# ---------- Awizacja (dane awizacyjne po zatwierdzeniu) ----------


@router.get("/slots/{slot_id}/notice", response_model=Optional[SlotNoticeOut])
def get_slot_notice(
    slot_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    slot = db.query(Slot).filter(Slot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    # klient tylko dla własnego slotu; admin dla wszystkich
    if current_user.get("role") != "admin":
        user_id = int(current_user["sub"])
        if slot.reserved_by_user_id != user_id:
            raise HTTPException(status_code=403, detail="You are not the owner of this reservation")

    return slot.notice


@router.post("/slots/{slot_id}/notice", response_model=SlotNoticeOut)
def upsert_slot_notice(
    slot_id: int,
    notice_in: SlotNoticeIn,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    slot = db.query(Slot).filter(Slot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    if current_user.get("role") != "client":
        raise HTTPException(status_code=403, detail="Only clients can fill notice details")

    user_id = int(current_user["sub"])
    if slot.reserved_by_user_id != user_id:
        raise HTTPException(status_code=403, detail="You are not the owner of this reservation")

    if slot.status not in {"APPROVED_WAITING_DETAILS", "RESERVED_CONFIRMED"}:
        raise HTTPException(status_code=400, detail="Notice can be filled only after admin approval")

    if notice_in.pallet_count <= 0:
        raise HTTPException(status_code=400, detail="pallet_count must be positive")

    notice = db.query(SlotNotice).filter(SlotNotice.slot_id == slot_id).first()
    if not notice:
        notice = SlotNotice(slot_id=slot_id, **notice_in.model_dump())
        db.add(notice)
    else:
        for k, v in notice_in.model_dump().items():
            setattr(notice, k, v)

    # po uzupełnieniu awizacji potwierdzamy rezerwację
    slot.status = "RESERVED_CONFIRMED"

    db.commit()
    db.refresh(notice)
    return notice


# ---------- Doki (wspólne) ----------


@router.get("/docks", response_model=List[DockOut])
def list_docks(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Dock).order_by(Dock.name).all()


@router.post("/docks", response_model=DockOut)
def create_dock(
    dock_in: DockCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_admin(current_user)
    name = dock_in.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Dock name cannot be empty")
    existing = db.query(Dock).filter(Dock.name == name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Dock with this name already exists")
    d = Dock(name=name)
    db.add(d)
    db.commit()
    db.refresh(d)
    return d


@router.post("/slots/{slot_id}/assign-dock", response_model=SlotOut)
def assign_dock(
    slot_id: int,
    req: AssignDockRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_admin(current_user)

    slot = db.query(Slot).filter(Slot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    if req.dock_id is None:
        slot.dock_id = None
        db.commit()
        db.refresh(slot)
        return slot

    dock = db.query(Dock).filter(Dock.id == req.dock_id).first()
    if not dock:
        raise HTTPException(status_code=404, detail="Dock not found")

    # konflikt: ten sam dok w tym samym czasie dla innego slotu (poza CLOSED)
    conflict = (
        db.query(Slot)
        .filter(
            Slot.id != slot.id,
            Slot.dock_id == dock.id,
            Slot.status != "CLOSED",
            Slot.start_time < slot.end_time,
            Slot.end_time > slot.start_time,
        )
        .first()
    )
    if conflict:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Dok '{dock.name}' jest już przypisany do slotu #{conflict.id} "
                f"({conflict.start_time} - {conflict.end_time})."
            ),
        )

    slot.dock_id = dock.id
    db.commit()
    db.refresh(slot)
    return slot
