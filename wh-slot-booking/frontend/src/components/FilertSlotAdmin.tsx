import React, { useState } from "react";
import { Lang, t } from "../Helper/i18n";
import Input from "./Input";
import Button from "./Button";
import Label from "./Label";
import Select from "./Select";

interface Props {
  lang: Lang;
  startOd: string;
  endDo: string;
  onChange: (start: string, end: string) => Promise<void>;
  setStartOd: (start: string) => void;
  setEndDo: (end: string) => void;
  setTypeSlot: (name: string) => void;
  setStatus: (name: string) => void;
}

function FilterSlotAdmin({
  lang,
  startOd,
  endDo,
  onChange,
  setStartOd,
  setEndDo,
  setStatus,
  setTypeSlot,
}: Props) {
  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('date_from', lang)}</label>
        <input
          type="date"
          value={startOd}
          onChange={(e) => setStartOd(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('date_to', lang)}</label>
        <input
          type="date"
          value={endDo}
          onChange={(e) => setEndDo(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('type', lang)}</label>
        <select
          onChange={(e) => setTypeSlot(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[140px]"
        >
          <option value="--">--</option>
          <option value="OUTBOUND">{t('outbound', lang)}</option>
          <option value="INBOUND">{t('inbound', lang)}</option>
          <option value="ANY">{t('any', lang)}</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('status', lang)}</label>
        <select
          onChange={(e) => setStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[160px]"
        >
          <option value="--">--</option>
          <option value="AVAILABLE">{t('available', lang)}</option>
          <option value="BOOKED">{t('booked', lang)}</option>
          <option value="APPROVED_WAITING_DETAILS">{t('approved_waiting_details', lang)}</option>
          <option value="RESERVED_CONFIRMED">{t('reserved_confirmed', lang)}</option>
          <option value="COMPLETED">{t('completed', lang)}</option>
          <option value="CANCELLED">{t('cancelled', lang)}</option>
        </select>
      </div>

      <button
        onClick={() => onChange(startOd, endDo)}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg px-5 py-2 text-sm transition-colors shadow-sm"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        {t('filter_slots', lang)}
      </button>
    </div>
  );
}

export default FilterSlotAdmin;
