import React from "react";
import FilterField from "../ui/FilterField";
import Spinner from "../UI/Spinner";
import ErrorBanner from "../UI/ErrorBanner";
import EmptyState from "../ui/EmptyState";
import { SearchIcon, UserIcon } from "../ui/Icons";
import DayGroup from "./DayGroup";
import MyReservationCard from "./MyReservationCard";
import { t, Lang } from "../../Helper/i18n";
import { groupByDay } from "../../Helper/helper";
import type { Slot } from "../../Types/SlotType";

interface MyReservationsTabProps {
  lang: Lang;
  slots: Slot[];
  loading: boolean;
  loadErr: string | null;
  cancelErr: string | null;
  dateFrom: string;
  dateTo: string;
  statusFilter: string;
  typeFilter: string;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onStatusFilterChange: (v: string) => void;
  onTypeFilterChange: (v: string) => void;
  onSearch: () => void;
  onCancel: (slotId: number) => void;
  onNotice: (slot: Slot) => void;
}

export default function MyReservationsTab({
  lang,
  slots,
  loading,
  loadErr,
  cancelErr,
  dateFrom,
  dateTo,
  statusFilter,
  typeFilter,
  onDateFromChange,
  onDateToChange,
  onStatusFilterChange,
  onTypeFilterChange,
  onSearch,
  onCancel,
  onNotice,
}: MyReservationsTabProps) {
  const filtered = slots
    .filter((s) => statusFilter === "ALL" || s.status === statusFilter)
    .filter((s) => typeFilter === "ALL" || s.slot_type === typeFilter);

  const grouped = groupByDay(filtered);
  const days = Object.keys(grouped).sort();

  return (
    <>
      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <FilterField label={t("date_from", lang)}>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </FilterField>

          <FilterField label={t("date_to", lang)}>
            <input
              type="date"
              value={dateTo}
              min={dateFrom}
              onChange={(e) => onDateToChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </FilterField>

          <FilterField label={t("status", lang)}>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[180px]"
            >
              <option value="ALL">
                {t("all_statuses", lang)}
              </option>
              <option value="BOOKED">{t("booked", lang)}</option>
              <option value="APPROVED_WAITING_DETAILS">
                {t("approved_waiting_details", lang)}
              </option>
              <option value="RESERVED_CONFIRMED">
                {t("reserved_confirmed", lang)}
              </option>
              <option value="CANCEL_PENDING">{t("cancel_pending", lang)}</option>
              <option value="COMPLETED">{t("completed", lang)}</option>
              <option value="CANCELLED">{t("cancelled", lang)}</option>
            </select>
          </FilterField>

          <FilterField label={t("type", lang)}>
            <select
              value={typeFilter}
              onChange={(e) => onTypeFilterChange(e.target.value)}
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
            onClick={onSearch}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg px-5 py-2 text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <>
                <Spinner />
                {t("loading", lang)}
              </>
            ) : (
              <>
                <SearchIcon />
                {t("search_slots", lang)}
              </>
            )}
          </button>
        </div>
      </div>

      {loadErr && <ErrorBanner msg={loadErr} />}
      {cancelErr && <ErrorBanner msg={cancelErr} />}

      {/* Empty state */}
      {!loading && filtered.length === 0 && !loadErr && (
        <EmptyState
          icon={<UserIcon />}
          title={t("no_my_reservations", lang)}
          desc={t("no_my_reservations_desc", lang)}
        />
      )}

      {/* Reservations grouped by day */}
      {days.map((day) => (
        <DayGroup
          key={day}
          day={day}
          lang={lang}
          count={grouped[day].length}
          countLabel={t("reservations_count", lang)}
        >
          <div className="flex flex-col gap-3">
            {grouped[day].map((slot) => (
              <MyReservationCard
                key={slot.id}
                slot={slot}
                lang={lang}
                onCancel={() => onCancel(slot.id)}
                onNotice={() => onNotice(slot)}
              />
            ))}
          </div>
        </DayGroup>
      ))}
    </>
  );
}
