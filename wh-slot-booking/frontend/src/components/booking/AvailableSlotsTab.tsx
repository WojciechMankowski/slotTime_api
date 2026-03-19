import React from "react";
import FilterField from "../ui/FilterField";
import Spinner from "../ui/Spinner";
import ErrorBanner from "../ui/ErrorBanner";
import EmptyState from "../ui/EmptyState";
import { SearchIcon, CalendarIcon } from "../ui/Icons";
import DayGroup from "./DayGroup";
import SlotCard from "./SlotCard";
import { t, Lang } from "../../Helper/i18n";
import { groupByDay } from "../../Helper/helper";
import type { Slot } from "../../Types/SlotType";
import type { SlotType } from "../../Types/SlotType";

interface AvailableSlotsTabProps {
  lang: Lang;
  slots: Slot[];
  loading: boolean;
  loadErr: string | null;
  dateFrom: string;
  dateTo: string;
  typeFilter: SlotType;
  minDate: string;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onTypeFilterChange: (v: SlotType) => void;
  onSearch: () => void;
  onSlotClick: (slot: Slot) => void;
}

export default function AvailableSlotsTab({
  lang,
  slots,
  loading,
  loadErr,
  dateFrom,
  dateTo,
  typeFilter,
  minDate,
  onDateFromChange,
  onDateToChange,
  onTypeFilterChange,
  onSearch,
  onSlotClick,
}: AvailableSlotsTabProps) {
  const grouped = groupByDay(slots);
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
              min={minDate}
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

          <FilterField label={t("type", lang)}>
            <select
              value={typeFilter}
              onChange={(e) => onTypeFilterChange(e.target.value as SlotType)}
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
        <DayGroup
          key={day}
          day={day}
          lang={lang}
          count={grouped[day].length}
          countLabel={t("slots_available", lang)}
        >
          {grouped[day].map((slot) => (
            <SlotCard
              key={slot.id}
              slot={slot}
              lang={lang}
              onClick={() => onSlotClick(slot)}
            />
          ))}
        </DayGroup>
      ))}
    </>
  );
}
