import React from "react";
import type { Lang } from "../../Helper/i18n";

interface DayGroupProps {
  day: string;
  lang: Lang;
  count: number;
  countLabel: string;
  children: React.ReactNode;
}

export default function DayGroup({ day, lang, count, countLabel, children }: DayGroupProps) {
  const locale = lang === "pl" ? "pl-PL" : "en-GB";
  const dateObj = new Date(day + "T00:00:00");

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-lg shadow-sm leading-tight text-center">
          <div>
            {dateObj.toLocaleDateString(locale, { day: "2-digit", month: "short" })}
          </div>
          <div className="text-[0.65rem] font-semibold opacity-75 tracking-wide">
            {dateObj.getFullYear()}
          </div>
        </div>
        <h2 className="text-base font-semibold text-gray-700 capitalize">
          {dateObj.toLocaleDateString(locale, { weekday: "long" })}
        </h2>
        <div className="ml-auto px-3 py-1 bg-gray-100 rounded-full border border-gray-200 flex items-center gap-1.5 shadow-xs">
          <span className="text-sm font-black text-blue-700">{count}</span>
          <span className="text-[0.7rem] font-bold text-gray-500 uppercase tracking-tight">
            {countLabel}
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}
