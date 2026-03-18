import React, { useEffect, useState } from "react";
import { api } from "../API/api";
import { reserveSlot, cancelSlot, postNotice, NoticePayload } from "../API/serviceSlot";
import { t, Lang } from "../Helper/i18n";
import type { Me } from "../Types/types";
import { Slot } from "../Types/SlotType";
import axios from "axios";

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function formatDate(dt: string, lang: Lang): string {
  return new Date(dt).toLocaleDateString(lang === "pl" ? "pl-PL" : "en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTime(dt: string): string {
  return new Date(dt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupByDay(slots: Slot[]): Record<string, Slot[]> {
  return slots.reduce<Record<string, Slot[]>>((acc, slot) => {
    const day = slot.start_dt.slice(0, 10);
    if (!acc[day]) acc[day] = [];
    acc[day].push(slot);
    return acc;
  }, {});
}

function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (detail?.error_code) return detail.error_code;
    if (typeof detail === "string") return detail;
    if (error.response?.status === 403) return "COMPANY_INACTIVE";
    return error.message || "CONNECTION_ERROR";
  }
  return "UNKNOWN_ERROR";
}

type SlotTypeFilter = "ALL" | "INBOUND" | "OUTBOUND" | "ANY";
type Tab = "available" | "my";

const STATUS_STYLE: Record<string, { bg: string; text: string; label_pl: string; label_en: string }> = {
  BOOKED:                   { bg: "bg-amber-100",   text: "text-amber-800",   label_pl: "Zarezerwowany",           label_en: "Booked" },
  APPROVED_WAITING_DETAILS: { bg: "bg-blue-100",    text: "text-blue-800",    label_pl: "Oczekuje na szczegóły",   label_en: "Awaiting details" },
  RESERVED_CONFIRMED:       { bg: "bg-emerald-100", text: "text-emerald-800", label_pl: "Potwierdzone",            label_en: "Confirmed" },
  COMPLETED:                { bg: "bg-gray-100",    text: "text-gray-600",    label_pl: "Zakończony",              label_en: "Completed" },
  CANCELLED:                { bg: "bg-red-100",     text: "text-red-700",     label_pl: "Anulowany",              label_en: "Cancelled" },
};

const TYPE_STYLE: Record<string, string> = {
  INBOUND:  "bg-blue-100 text-blue-800",
  OUTBOUND: "bg-emerald-100 text-emerald-800",
  ANY:      "bg-purple-100 text-purple-800",
};

/* ------------------------------------------------------------------ */
/* Component                                                            */
/* ------------------------------------------------------------------ */

export default function ClientBooking({ lang, me }: { lang: Lang; me: Me }) {
  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const plus7 = new Date(today);
  plus7.setDate(today.getDate() + 6);

  /* --- tab --- */
  const [tab, setTab] = useState<Tab>("available");

  /* --- filters (available tab) --- */
  const [dateFrom, setDateFrom] = useState(iso(today));
  const [dateTo, setDateTo] = useState(iso(plus7));
  const [typeFilter, setTypeFilter] = useState<SlotTypeFilter>("ALL");

  /* --- filters (my tab) --- */
  const [myDateFrom, setMyDateFrom] = useState(iso(today));
  const [myDateTo, setMyDateTo] = useState(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 30);
    return iso(d);
  });
  const [myStatusFilter, setMyStatusFilter] = useState<string>("ALL");
  const [myTypeFilter, setMyTypeFilter] = useState<string>("ALL");

  /* --- data --- */
  const [slots, setSlots] = useState<Slot[]>([]);
  const [mySlots, setMySlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [myLoading, setMyLoading] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [myLoadErr, setMyLoadErr] = useState<string | null>(null);

  /* --- modal / reservation --- */
  const [confirmSlot, setConfirmSlot] = useState<Slot | null>(null);
  const [requestedType, setRequestedType] = useState<"INBOUND" | "OUTBOUND">("INBOUND");
  const [reserving, setReserving] = useState(false);
  const [reserveErr, setReserveErr] = useState<string | null>(null);

  /* --- cancel --- */
  const [cancelSlotId, setCancelSlotId] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelErr, setCancelErr] = useState<string | null>(null);

  /* --- notice / awizacja --- */
  const [noticeSlot, setNoticeSlot] = useState<Slot | null>(null);
  const [noticeForm, setNoticeForm] = useState<NoticePayload>({
    numer_zlecenia: "",
    referencja: "",
    rejestracja_auta: "",
    rejestracja_naczepy: "",
    ilosc_palet: 1,
    kierowca_imie_nazwisko: "",
    kierowca_tel: "",
    uwagi: "",
  });
  const [noticeErrors, setNoticeErrors] = useState<Partial<Record<keyof NoticePayload, string>>>({});
  const [noticeSubmitting, setNoticeSubmitting] = useState(false);
  const [noticeErr, setNoticeErr] = useState<string | null>(null);

  /* --- flash messages --- */
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  /* ==================================================================
     DATA LOADING
  ================================================================== */

  const loadAvailable = async () => {
    setLoadErr(null);
    setLoading(true);
    try {
      const res = await api.get<Slot[]>("/api/slots", {
        params: { date_from: dateFrom, date_to: dateTo },
      });
      let available = res.data.filter((s) => s.status === "AVAILABLE");
      if (typeFilter !== "ALL") {
        available = available.filter((s) => s.slot_type === typeFilter);
      }
      setSlots(available);
    } catch (err) {
      setLoadErr(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const loadMySlots = async () => {
    setMyLoadErr(null);
    setMyLoading(true);
    try {
      const res = await api.get<Slot[]>("/api/slots", {
        params: { date_from: myDateFrom, date_to: myDateTo },
      });
      // klient widzi tylko swoje sloty (zarezerwowane przez niego)
      const mine = res.data.filter(
        (s) => s.reserved_by_user_id === me.id && s.status !== "AVAILABLE"
      );
      setMySlots(mine);
    } catch (err) {
      setMyLoadErr(getApiError(err));
    } finally {
      setMyLoading(false);
    }
  };

  useEffect(() => {
    loadAvailable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab === "my") loadMySlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  /* ==================================================================
     RESERVE
  ================================================================== */

  const handleReserve = async () => {
    if (!confirmSlot) return;
    setReserveErr(null);
    setReserving(true);
    try {
      const payload =
        confirmSlot.slot_type === "ANY" ? { requested_type: requestedType } : {};
      await reserveSlot(confirmSlot.id, payload as any);
      flash(t("reserve_success", lang));
      setConfirmSlot(null);
      await loadAvailable();
    } catch (err) {
      setReserveErr(getApiError(err));
    } finally {
      setReserving(false);
    }
  };

  /* ==================================================================
     CANCEL
  ================================================================== */

  const handleCancel = async () => {
    if (cancelSlotId === null) return;
    setCancelErr(null);
    setCancelling(true);
    try {
      await cancelSlot(cancelSlotId);
      flash(t("cancel_success", lang));
      setCancelSlotId(null);
      await loadMySlots();
    } catch (err) {
      setCancelErr(getApiError(err));
    } finally {
      setCancelling(false);
    }
  };

  /* ==================================================================
     NOTICE / AWIZACJA
  ================================================================== */

  const openNoticeModal = (slot: Slot) => {
    setNoticeSlot(slot);
    setNoticeErr(null);
    setNoticeErrors({});
    setNoticeForm({
      numer_zlecenia: "",
      referencja: "",
      rejestracja_auta: "",
      rejestracja_naczepy: "",
      ilosc_palet: 1,
      kierowca_imie_nazwisko: "",
      kierowca_tel: "",
      uwagi: "",
    });
  };

  const handleNoticeSubmit = async () => {
    if (!noticeSlot) return;

    // front-end validation
    const errs: Partial<Record<keyof NoticePayload, string>> = {};
    const req = t("notice_required_field", lang);
    if (!noticeForm.numer_zlecenia.trim())    errs.numer_zlecenia    = req;
    if (!noticeForm.referencja.trim())         errs.referencja         = req;
    if (!noticeForm.rejestracja_auta.trim())   errs.rejestracja_auta   = req;
    if (!noticeForm.rejestracja_naczepy.trim()) errs.rejestracja_naczepy = req;
    if (!noticeForm.ilosc_palet || noticeForm.ilosc_palet <= 0)
      errs.ilosc_palet = t("notice_pallets_positive", lang);

    if (Object.keys(errs).length > 0) { setNoticeErrors(errs); return; }

    setNoticeErr(null);
    setNoticeSubmitting(true);
    try {
      await postNotice(noticeSlot.id, noticeForm);
      flash(t("notice_success", lang));
      setNoticeSlot(null);
      await loadMySlots();
    } catch (err) {
      setNoticeErr(getApiError(err));
    } finally {
      setNoticeSubmitting(false);
    }
  };

  /* ==================================================================
     HELPERS
  ================================================================== */

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const grouped = groupByDay(slots);
  const days = Object.keys(grouped).sort();

  // filtered my slots
  const filteredMySlots = mySlots
    .filter((s) => myStatusFilter === "ALL" || s.status === myStatusFilter)
    .filter((s) => myTypeFilter === "ALL" || s.slot_type === myTypeFilter);

  const myGrouped = groupByDay(filteredMySlots);
  const myDays = Object.keys(myGrouped).sort();

  /* ==================================================================
     RENDER
  ================================================================== */

  return (
    <div className="p-4 max-w-5xl mx-auto">

      {/* ===== Page header ===== */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          {t("book_slot", lang)}
        </h1>
        <p className="text-gray-500 text-sm">{t("book_slot_desc", lang)}</p>
      </div>

      {/* ===== Flash ===== */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl px-5 py-3 mb-5 shadow-sm">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="font-medium">{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="ml-auto text-emerald-600 hover:text-emerald-900 leading-none">✕</button>
        </div>
      )}

      {/* ===== Tabs ===== */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        <TabBtn
          active={tab === "available"}
          onClick={() => setTab("available")}
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
          label={t("available_slots_tab", lang)}
          badge={slots.length > 0 ? String(slots.length) : undefined}
        />
        <TabBtn
          active={tab === "my"}
          onClick={() => { setTab("my"); }}
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          }
          label={t("my_reservations", lang)}
          badge={mySlots.length > 0 ? String(mySlots.length) : undefined}
        />
      </div>

      {/* ================================================================
          TAB: AVAILABLE SLOTS
      ================================================================ */}
      {tab === "available" && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-6">
            <div className="flex flex-wrap gap-4 items-end">
              <FilterField label={t("date_from", lang)}>
                <input
                  type="date"
                  value={dateFrom}
                  min={iso(today)}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </FilterField>

              <FilterField label={t("date_to", lang)}>
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </FilterField>

              <FilterField label={t("type", lang)}>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as SlotTypeFilter)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[160px]"
                >
                  <option value="ALL">{t("all_types", lang)}</option>
                  <option value="INBOUND">{t("inbound", lang)}</option>
                  <option value="OUTBOUND">{t("outbound", lang)}</option>
                  <option value="ANY">{t("any", lang)}</option>
                </select>
              </FilterField>

              <button
                id="btn-search-slots"
                onClick={loadAvailable}
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg px-5 py-2 text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? (
                  <><Spinner />{t("loading", lang)}</>
                ) : (
                  <><SearchIcon />{t("search_slots", lang)}</>
                )}
              </button>
            </div>
          </div>

          {loadErr && <ErrorBanner msg={loadErr} />}

          {/* Empty state */}
          {!loading && slots.length === 0 && !loadErr && (
            <EmptyState
              icon={<CalendarIcon />}
              title={t("no_available_slots", lang)}
              desc={t("try_different_dates", lang)}
            />
          )}

          {/* Slot cards grouped by day */}
          {days.map((day) => (
            <DayGroup key={day} day={day} lang={lang} count={grouped[day].length} countLabel={t("slots_available", lang)}>
              {grouped[day].map((slot) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  lang={lang}
                  onClick={() => {
                    setConfirmSlot(slot);
                    setReserveErr(null);
                    setRequestedType("INBOUND");
                  }}
                />
              ))}
            </DayGroup>
          ))}
        </>
      )}

      {/* ================================================================
          TAB: MY RESERVATIONS
      ================================================================ */}
      {tab === "my" && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-6">
            <div className="flex flex-wrap gap-4 items-end">
              <FilterField label={t("date_from", lang)}>
                <input
                  type="date"
                  value={myDateFrom}
                  onChange={(e) => setMyDateFrom(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </FilterField>

              <FilterField label={t("date_to", lang)}>
                <input
                  type="date"
                  value={myDateTo}
                  min={myDateFrom}
                  onChange={(e) => setMyDateTo(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </FilterField>

              <FilterField label={t("status", lang)}>
                <select
                  value={myStatusFilter}
                  onChange={(e) => setMyStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[180px]"
                >
                  <option value="ALL">{lang === "pl" ? "Wszystkie statusy" : "All statuses"}</option>
                  <option value="BOOKED">{t("booked", lang)}</option>
                  <option value="APPROVED_WAITING_DETAILS">{t("approved_waiting_details", lang)}</option>
                  <option value="RESERVED_CONFIRMED">{t("reserved_confirmed", lang)}</option>
                  <option value="COMPLETED">{t("completed", lang)}</option>
                  <option value="CANCELLED">{t("cancelled", lang)}</option>
                </select>
              </FilterField>

              <FilterField label={t("type", lang)}>
                <select
                  value={myTypeFilter}
                  onChange={(e) => setMyTypeFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[160px]"
                >
                  <option value="ALL">{t("all_types", lang)}</option>
                  <option value="INBOUND">{t("inbound", lang)}</option>
                  <option value="OUTBOUND">{t("outbound", lang)}</option>
                  <option value="ANY">{t("any", lang)}</option>
                </select>
              </FilterField>

              <button
                id="btn-search-my-slots"
                onClick={loadMySlots}
                disabled={myLoading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg px-5 py-2 text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              >
                {myLoading ? (
                  <><Spinner />{t("loading", lang)}</>
                ) : (
                  <><SearchIcon />{t("search_slots", lang)}</>
                )}
              </button>
            </div>
          </div>

          {myLoadErr && <ErrorBanner msg={myLoadErr} />}

          {/* Cancel error */}
          {cancelErr && <ErrorBanner msg={cancelErr} />}

          {/* Empty state — uwzględniamy filtry */}
          {!myLoading && filteredMySlots.length === 0 && !myLoadErr && (
            <EmptyState
              icon={<UserIcon />}
              title={t("no_my_reservations", lang)}
              desc={t("no_my_reservations_desc", lang)}
            />
          )}

          {/* Reservations grouped by day */}
          {myDays.map((day) => (
            <DayGroup key={day} day={day} lang={lang} count={myGrouped[day].length} countLabel={t("reservations_count", lang)}>
              <div className="flex flex-col gap-3">
                {myGrouped[day].map((slot) => (
                  <MyReservationCard
                    key={slot.id}
                    slot={slot}
                    lang={lang}
                    onCancel={() => {
                      setCancelSlotId(slot.id);
                      setCancelErr(null);
                    }}
                    onNotice={() => openNoticeModal(slot)}
                  />
                ))}
              </div>
            </DayGroup>
          ))}
        </>
      )}

      {/* ================================================================
          MODAL: CONFIRM RESERVATION
      ================================================================ */}
      {confirmSlot && (
        <Overlay onClose={() => setConfirmSlot(null)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-linear-to-br from-blue-600 to-blue-800 px-7 py-5">
              <h3 className="text-xl font-bold text-white mb-0.5">
                {t("confirm_reservation", lang)}
              </h3>
              <p className="text-blue-200 text-sm">{t("confirm_reservation_desc", lang)}</p>
            </div>

            <div className="px-7 py-6">
              <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2.5">
                <DetailRow icon={<CalendarIcon sm />} label={t("date", lang)} value={formatDate(confirmSlot.start_dt, lang)} />
                <DetailRow icon={<ClockIcon sm />} label={t("start", lang)} value={formatTime(confirmSlot.start_dt)} />
                <DetailRow icon={<ClockIcon sm />} label={t("end", lang)} value={formatTime(confirmSlot.end_dt)} />
                <DetailRow
                  icon={<StarIcon sm />}
                  label={t("type", lang)}
                  value={t(confirmSlot.slot_type.toLowerCase() as any, lang)}
                />
              </div>

              {/* ANY type chooser */}
              {confirmSlot.slot_type === "ANY" && (
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("choose_type", lang)}
                  </label>
                  <div className="flex gap-3">
                    {(["INBOUND", "OUTBOUND"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setRequestedType(type)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all duration-150 ${
                          requestedType === type
                            ? "border-blue-600 bg-blue-600 text-white shadow-md"
                            : "border-gray-200 text-gray-600 hover:border-blue-300"
                        }`}
                      >
                        {t(type.toLowerCase() as any, lang)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {reserveErr && <ErrorBanner msg={reserveErr} compact />}

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setConfirmSlot(null)}
                  disabled={reserving}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {t("cancel_btn", lang)}
                </button>
                <button
                  id="btn-confirm-reserve"
                  onClick={handleReserve}
                  disabled={reserving}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-colors shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {reserving ? <><Spinner />{t("reserving", lang)}</> : t("reserve", lang)}
                </button>
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {/* ================================================================
          MODAL: CONFIRM CANCEL
      ================================================================ */}
      {cancelSlotId !== null && (
        <Overlay onClose={() => setCancelSlotId(null)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="bg-linear-to-br from-red-500 to-red-700 px-7 py-5">
              <h3 className="text-xl font-bold text-white mb-0.5">{t("cancel_reservation", lang)}</h3>
              <p className="text-red-200 text-sm">{t("cancel_confirm_desc", lang)}</p>
            </div>
            <div className="px-7 py-6">
              {cancelErr && <ErrorBanner msg={cancelErr} compact />}
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setCancelSlotId(null)}
                  disabled={cancelling}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {t("cancel_btn", lang)}
                </button>
                <button
                  id="btn-confirm-cancel"
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold text-sm transition-colors shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {cancelling ? <><Spinner />{t("cancelling", lang)}</> : t("yes_cancel", lang)}
                </button>
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {/* ================================================================
          MODAL: NOTICE / AWIZACJA
      ================================================================ */}
      {noticeSlot && (
        <Overlay onClose={() => setNoticeSlot(null)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-linear-to-br from-indigo-600 to-indigo-800 px-7 py-5 shrink-0">
              <h3 className="text-xl font-bold text-white mb-0.5">{t("notice_form_title", lang)}</h3>
              <p className="text-indigo-200 text-sm">{t("notice_form_desc", lang)}</p>
              <p className="text-indigo-300 text-xs mt-1">
                {new Date(noticeSlot.start_dt).toLocaleString(lang === "pl" ? "pl-PL" : "en-GB")}
                {" – "}
                {new Date(noticeSlot.end_dt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>

            {/* Scrollable body */}
            <div className="px-7 py-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <NoticeField
                  label={t("notice_order_no", lang)}
                  value={noticeForm.numer_zlecenia}
                  error={noticeErrors.numer_zlecenia}
                  onChange={(v) => setNoticeForm(f => ({ ...f, numer_zlecenia: v }))}
                  onFocus={() => setNoticeErrors(e => ({ ...e, numer_zlecenia: undefined }))}
                />
                <NoticeField
                  label={t("notice_reference", lang)}
                  value={noticeForm.referencja}
                  error={noticeErrors.referencja}
                  onChange={(v) => setNoticeForm(f => ({ ...f, referencja: v }))}
                  onFocus={() => setNoticeErrors(e => ({ ...e, referencja: undefined }))}
                />
                <NoticeField
                  label={t("notice_truck_plate", lang)}
                  value={noticeForm.rejestracja_auta}
                  error={noticeErrors.rejestracja_auta}
                  onChange={(v) => setNoticeForm(f => ({ ...f, rejestracja_auta: v }))}
                  onFocus={() => setNoticeErrors(e => ({ ...e, rejestracja_auta: undefined }))}
                />
                <NoticeField
                  label={t("notice_trailer_plate", lang)}
                  value={noticeForm.rejestracja_naczepy}
                  error={noticeErrors.rejestracja_naczepy}
                  onChange={(v) => setNoticeForm(f => ({ ...f, rejestracja_naczepy: v }))}
                  onFocus={() => setNoticeErrors(e => ({ ...e, rejestracja_naczepy: undefined }))}
                />
                <NoticeField
                  label={t("notice_pallets", lang)}
                  value={String(noticeForm.ilosc_palet)}
                  error={noticeErrors.ilosc_palet}
                  type="number"
                  onChange={(v) => setNoticeForm(f => ({ ...f, ilosc_palet: parseInt(v) || 0 }))}
                  onFocus={() => setNoticeErrors(e => ({ ...e, ilosc_palet: undefined }))}
                />
                <NoticeField
                  label={t("notice_driver_name", lang)}
                  value={noticeForm.kierowca_imie_nazwisko ?? ""}
                  onChange={(v) => setNoticeForm(f => ({ ...f, kierowca_imie_nazwisko: v }))}
                />
                <NoticeField
                  label={t("notice_driver_phone", lang)}
                  value={noticeForm.kierowca_tel ?? ""}
                  type="tel"
                  onChange={(v) => setNoticeForm(f => ({ ...f, kierowca_tel: v }))}
                />
              </div>

              {/* Remarks - full width */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  {t("notice_remarks", lang)}
                </label>
                <textarea
                  rows={3}
                  value={noticeForm.uwagi ?? ""}
                  onChange={(e) => setNoticeForm(f => ({ ...f, uwagi: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  placeholder={lang === "pl" ? "Dodaj uwagi…" : "Add remarks…"}
                />
              </div>

              {noticeErr && <ErrorBanner msg={noticeErr} compact />}

              {/* Actions */}
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setNoticeSlot(null)}
                  disabled={noticeSubmitting}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {t("cancel_btn", lang)}
                </button>
                <button
                  id="btn-notice-submit"
                  onClick={handleNoticeSubmit}
                  disabled={noticeSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm transition-colors shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {noticeSubmitting ? (
                    <><Spinner />{t("notice_submitting", lang)}</>
                  ) : (
                    t("notice_submit", lang)
                  )}
                </button>
              </div>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}

/* ================================================================
   SUB-COMPONENTS
================================================================ */

function TabBtn({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
        active
          ? "bg-white text-blue-700 shadow-sm"
          : "text-gray-500 hover:text-gray-700"
      }`}
    >
      {icon}
      {label}
      {badge && (
        <span className={`text-[0.75rem] px-2 py-0.5 rounded-lg font-black shadow-xs ${active ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function DayGroup({
  day,
  lang,
  count,
  countLabel,
  children,
}: {
  day: string;
  lang: Lang;
  count: number;
  countLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-lg shadow-sm leading-tight text-center">
          <div>{new Date(day + "T00:00:00").toLocaleDateString(
            lang === "pl" ? "pl-PL" : "en-GB",
            { day: "2-digit", month: "short" }
          )}</div>
          <div className="text-[0.65rem] font-semibold opacity-75 tracking-wide">
            {new Date(day + "T00:00:00").getFullYear()}
          </div>
        </div>
        <h2 className="text-base font-semibold text-gray-700 capitalize">
          {new Date(day + "T00:00:00").toLocaleDateString(lang === "pl" ? "pl-PL" : "en-GB", {
            weekday: "long",
          })}
        </h2>
        <div className="ml-auto px-3 py-1 bg-gray-100 rounded-full border border-gray-200 flex items-center gap-1.5 shadow-xs">
          <span className="text-sm font-black text-blue-700">{count}</span>
          <span className="text-[0.7rem] font-bold text-gray-500 uppercase tracking-tight">{countLabel}</span>
        </div>
      </div>
      {children}
    </div>
  );
}

function SlotCard({ slot, lang, onClick }: { slot: Slot; lang: Lang; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group relative bg-white border border-gray-200 rounded-2xl p-4 text-left shadow-sm hover:shadow-md hover:border-blue-400 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
    >
      {/* Type badge */}
      <span className={`inline-block text-[0.7rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-3 ${TYPE_STYLE[slot.slot_type] ?? "bg-gray-100 text-gray-700"}`}>
        {slot.slot_type === "INBOUND" ? (lang === "pl" ? "Dostawa" : "Inbound")
          : slot.slot_type === "OUTBOUND" ? (lang === "pl" ? "Odbiór" : "Outbound")
          : lang === "pl" ? "Dowolny" : "Any"}
      </span>

      {/* Time */}
      <div className="flex items-center gap-2 mb-1">
        <ClockIcon sm />
        <span className="text-lg font-bold text-gray-900">{new Date(slot.start_dt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        <span className="text-gray-400">–</span>
        <span className="text-lg font-bold text-gray-900">{new Date(slot.end_dt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
      </div>

      {/* Hover CTA */}
      <div className="mt-3 text-xs text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        {lang === "pl" ? "Kliknij, aby zarezerwować" : "Click to reserve"}
      </div>

      {/* Available dot */}
      <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-400" />
    </button>
  );
}

function MyReservationCard({
  slot,
  lang,
  onCancel,
  onNotice,
}: {
  slot: Slot;
  lang: Lang;
  onCancel: () => void;
  onNotice: () => void;
}) {
  const statusInfo = STATUS_STYLE[slot.status] ?? {
    bg: "bg-gray-100", text: "text-gray-600",
    label_pl: slot.status, label_en: slot.status,
  };
  const canCancel = slot.status === "BOOKED";
  const canNotice = slot.status === "APPROVED_WAITING_DETAILS";

  return (
    <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm flex items-center gap-4 flex-wrap">
      {/* Date block */}
      <div className="text-center min-w-[52px]">
        <div className="text-2xl font-extrabold text-blue-700 leading-none">
          {new Date(slot.start_dt).getDate()}
        </div>
        <div className="text-[0.7rem] font-semibold text-gray-400 uppercase tracking-wide mt-0.5">
          {new Date(slot.start_dt).toLocaleDateString(lang === "pl" ? "pl-PL" : "en-GB", { month: "short" })}
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-10 bg-gray-200 shrink-0" />

      {/* Time + type */}
      <div className="flex-1 min-w-0">
        <div className="text-lg font-bold text-gray-900">
          {new Date(slot.start_dt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          {" – "}
          {new Date(slot.end_dt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
        <div className="mt-1">
          <span className={`text-[0.68rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${TYPE_STYLE[slot.slot_type] ?? "bg-gray-100 text-gray-600"}`}>
            {slot.slot_type === "INBOUND" ? (lang === "pl" ? "Dostawa" : "Inbound")
              : slot.slot_type === "OUTBOUND" ? (lang === "pl" ? "Odbiór" : "Outbound")
              : lang === "pl" ? "Dowolny" : "Any"}
          </span>
        </div>
      </div>

      {/* Dock block — POWIĘKSZONY */}
      {slot.dock_alias && (
        <div className="flex flex-col items-center justify-center px-3 py-2 bg-indigo-600 text-white rounded-xl shadow-sm min-w-[80px]">
          <span className="text-[0.6rem] font-bold uppercase tracking-wider opacity-80 leading-none mb-1">
            {lang === "pl" ? "Dok" : "Dock"}
          </span>
          <span className="text-xl font-black leading-none">{slot.dock_alias}</span>
        </div>
      )}

      {/* Status badge */}
      <span className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${statusInfo.bg} ${statusInfo.text}`}>
        {lang === "pl" ? statusInfo.label_pl : statusInfo.label_en}
      </span>

      {/* Notice button — only when APPROVED_WAITING_DETAILS */}
      {canNotice && (
        <button
          onClick={onNotice}
          className="flex items-center gap-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 px-3 py-2 rounded-xl transition-colors shadow-sm shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          {lang === "pl" ? "Wypełnij awizację" : "Fill notice"}
        </button>
      )}

      {/* Cancel button */}
      {canCancel && (
        <button
          onClick={onCancel}
          title={lang === "pl" ? "Anuluj rezerwację" : "Cancel reservation"}
          className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-150 shrink-0"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-2000 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {children}
    </div>
  );
}

function ErrorBanner({ msg, compact }: { msg: string; compact?: boolean }) {
  return (
    <div className={`flex items-center gap-3 bg-red-50 border border-red-300 text-red-700 rounded-xl px-5 py-3 shadow-sm ${compact ? "text-sm mb-4" : "mb-6"}`}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {msg}
    </div>
  );
}

function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="text-center py-20 text-gray-400">
      <div className="mx-auto mb-4 opacity-30 flex justify-center">{icon}</div>
      <p className="text-lg font-medium">{title}</p>
      <p className="text-sm mt-1">{desc}</p>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <span className="text-gray-400 shrink-0">{icon}</span>
      <span className="text-gray-500 w-16 shrink-0">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

/* --- icons --- */
function Spinner() {
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function CalendarIcon({ sm }: { sm?: boolean }) {
  const s = sm ? 15 : 56;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sm ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function ClockIcon({ sm }: { sm?: boolean }) {
  const s = sm ? 14 : 56;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sm ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round" className={sm ? "text-gray-400" : ""}>
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function StarIcon({ sm }: { sm?: boolean }) {
  const s = sm ? 15 : 56;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sm ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function NoticeField({
  label,
  value,
  onChange,
  onFocus,
  error,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onFocus?: () => void;
  error?: string;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-colors ${
          error
            ? "border-red-400 focus:ring-red-400 bg-red-50"
            : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
        }`}
      />
      {error && (
        <p className="text-xs text-red-600 font-medium mt-0.5">{error}</p>
      )}
    </div>
  );
}
