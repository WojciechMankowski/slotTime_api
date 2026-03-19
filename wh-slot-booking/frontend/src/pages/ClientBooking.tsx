import React, { useEffect, useState } from "react";
import { t, Lang } from "../Helper/i18n";
import type { Me } from "../Types/types";
import type { Tab } from "../Types/SlotType";

import useFlash from "../hooks/useFlash";
import useAvailableSlots from "../hooks/useAvailableSlots";
import useMySlots from "../hooks/useMySlots";
import useReservation from "../hooks/useReservation";
import useCancelSlot from "../hooks/useAdminSlots";
import useNotice from "../hooks/useNotice";

import AvailableSlotsTab from "../components/booking/AvailableSlotsTab";
import MyReservationsTab from "../components/booking/MyReservationsTab";
import ConfirmReservationModal from "../components/booking/ConfirmReservationModal";
import CancelModal from "../components/booking/CancelModal";
import NoticeModal from "../components/booking/NoticeModal";
import TabBtn from "../components/UI/TabBtn";

export default function ClientBooking({ lang, me }: { lang: Lang; me: Me }) {
  const [tab, setTab] = useState<Tab>("available");

  const { successMsg, flash, dismiss } = useFlash();
  const available = useAvailableSlots();
  const my = useMySlots(me);

  const reservation = useReservation(() => {
    flash(t("reserve_success", lang));
    available.reload();
  });

  const cancel = useCancelSlot(() => {
    flash(t("cancel_success", lang));
    my.reload();
  });

  const notice = useNotice(lang, () => {
    flash(t("notice_success", lang));
    my.reload();
  });

  useEffect(() => {
    if (tab === "my") my.reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className="p-4 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          {t("book_slot", lang)}
        </h1>
        <p className="text-gray-500 text-sm">{t("book_slot_desc", lang)}</p>
      </div>

      {/* Flash */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl px-5 py-3 mb-5 shadow-sm">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="font-medium">{successMsg}</span>
          <button onClick={dismiss} className="ml-auto text-emerald-600 hover:text-emerald-900 leading-none">✕</button>
        </div>
      )}

      {/* Tabs */}
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
          badge={available.slots.length > 0 ? String(available.slots.length) : undefined}
        />
        <TabBtn
          active={tab === "my"}
          onClick={() => setTab("my")}
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          }
          label={t("my_reservations", lang)}
          badge={my.slots.length > 0 ? String(my.slots.length) : undefined}
        />
      </div>

      {/* Tab content */}
      {tab === "available" && (
        <AvailableSlotsTab
          lang={lang}
          slots={available.slots}
          loading={available.loading}
          loadErr={available.loadErr}
          dateFrom={available.dateFrom}
          dateTo={available.dateTo}
          typeFilter={available.typeFilter}
          minDate={available.minDate}
          onDateFromChange={available.setDateFrom}
          onDateToChange={available.setDateTo}
          onTypeFilterChange={available.setTypeFilter}
          onSearch={available.reload}
          onSlotClick={reservation.open}
        />
      )}

      {tab === "my" && (
        <MyReservationsTab
          lang={lang}
          slots={my.slots}
          loading={my.loading}
          loadErr={my.loadErr}
          cancelErr={cancel.cancelErr}
          dateFrom={my.dateFrom}
          dateTo={my.dateTo}
          statusFilter={my.statusFilter}
          typeFilter={my.typeFilter}
          onDateFromChange={my.setDateFrom}
          onDateToChange={my.setDateTo}
          onStatusFilterChange={my.setStatusFilter}
          onTypeFilterChange={my.setTypeFilter}
          onSearch={my.reload}
          onCancel={cancel.open}
          onNotice={notice.open}
        />
      )}

      {/* Modals */}
      {reservation.confirmSlot && (
        <ConfirmReservationModal
          slot={reservation.confirmSlot}
          lang={lang}
          requestedType={reservation.requestedType}
          onRequestedTypeChange={reservation.setRequestedType}
          reserving={reservation.reserving}
          reserveErr={reservation.reserveErr}
          onConfirm={reservation.confirm}
          onClose={reservation.close}
        />
      )}

      {cancel.cancelSlotId !== null && (
        <CancelModal
          lang={lang}
          cancelling={cancel.cancelling}
          cancelErr={cancel.cancelErr}
          onConfirm={cancel.confirm}
          onClose={cancel.close}
        />
      )}

      {notice.noticeSlot && (
        <NoticeModal
          slot={notice.noticeSlot}
          lang={lang}
          form={notice.form}
          errors={notice.errors}
          submitting={notice.submitting}
          submitErr={notice.submitErr}
          onFormChange={notice.setForm}
          onClearError={notice.clearError}
          onSubmit={notice.submit}
          onClose={notice.close}
        />
      )}
    </div>
  );
}