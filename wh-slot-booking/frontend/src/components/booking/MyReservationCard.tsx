import React from "react";
import { TYPE_STYLE, STATUS_STYLE } from "../../Helper/helper";
import type { Slot } from "../../Types/SlotType";
import { Lang, t } from "../../Helper/i18n";

interface MyReservationCardProps {
  slot: Slot;
  lang: Lang;
  onCancel: () => void;
  onNotice: () => void;
}

export default function MyReservationCard({
  slot,
  lang,
  onCancel,
  onNotice,
}: MyReservationCardProps) {
  const statusInfo = STATUS_STYLE[slot.status] ?? {
    bg: "bg-gray-100",
    text: "text-gray-600",
    label_pl: slot.status,
    label_en: slot.status,
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
          {new Date(slot.start_dt).toLocaleDateString(
            lang === "pl" ? "pl-PL" : "en-GB",
            { month: "short" }
          )}
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
          <span
            className={`text-[0.68rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              TYPE_STYLE[slot.slot_type] ?? "bg-gray-100 text-gray-600"
            }`}
          >
            {t(slot.slot_type.toLowerCase() as any, lang)}
          </span>
        </div>
      </div>

      {/* Dock block */}
      {slot.dock_alias && (
        <div className="flex flex-col items-center justify-center px-3 py-2 bg-indigo-600 text-white rounded-xl shadow-sm min-w-[80px]">
          <span className="text-[0.6rem] font-bold uppercase tracking-wider opacity-80 leading-none mb-1">
            {t("dock", lang)}
          </span>
          <span className="text-xl font-black leading-none">{slot.dock_alias}</span>
        </div>
      )}

      {/* Status badge */}
      <span
        className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${statusInfo.bg} ${statusInfo.text}`}
      >
        {lang === "pl" ? statusInfo.label_pl : statusInfo.label_en}
      </span>

      {/* Notice button */}
      {canNotice && (
        <button
          onClick={onNotice}
          className="flex items-center gap-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 px-3 py-2 rounded-xl transition-colors shadow-sm shrink-0"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          {t("notice_action_btn", lang)}
        </button>
      )}

      {/* Cancel button */}
      {canCancel && (
        <button
          onClick={onCancel}
          title={t("cancel_reservation", lang)}
          className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-150 shrink-0"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}
