import React from "react";
import { ClockIcon } from "../UI/Icons";
import { TYPE_STYLE } from "../../Helper/helper";
import type { Slot } from "../../Types/SlotType";
import { Lang, t } from "../../Helper/i18n";

interface SlotCardProps {
  slot: Slot;
  lang: Lang;
  onClick: () => void;
}

export default function SlotCard({ slot, lang, onClick }: SlotCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative bg-white border border-gray-200 rounded-2xl p-4 text-left shadow-sm hover:shadow-md hover:border-blue-400 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
    >
      {/* Type badge */}
      <span
        className={`inline-block text-[0.7rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-3 ${
          TYPE_STYLE[slot.slot_type] ?? "bg-gray-100 text-gray-700"
        }`}
      >
        {t(slot.slot_type.toLowerCase() as any, lang)}
      </span>

      {/* Time */}
      <div className="flex items-center gap-2 mb-1">
        <ClockIcon sm />
        <span className="text-lg font-bold text-gray-900">
          {new Date(slot.start_dt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
        <span className="text-gray-400">–</span>
        <span className="text-lg font-bold text-gray-900">
          {new Date(slot.end_dt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      {/* Hover CTA */}
      <div className="mt-3 text-xs text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        {t("click_to_reserve", lang)}
      </div>

      {/* Available dot */}
      <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-400" />
    </button>
  );
}
