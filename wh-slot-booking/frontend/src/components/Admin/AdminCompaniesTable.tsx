import React from "react";
import { t, Lang } from "../../Helper/i18n";
import type { Company } from "../../Types/types";

interface AdminCompaniesTableProps {
  rows: Company[];
  lang: Lang;
  className?: string;
}

export default function AdminCompaniesTable({
  rows,
  lang,
  className = "",
}: AdminCompaniesTableProps) {
  if (!rows || rows.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mx-auto mb-3 opacity-30"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <p className="text-lg font-medium">
          {lang === "pl" ? "Brak firm" : "No companies"}
        </p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {rows.map((row, index) => (
        <div
          key={row.id ?? index}
          className="relative bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
        >
          {/* Status dot */}
          <div
            className={`absolute top-4 right-4 w-2.5 h-2.5 rounded-full shadow-sm ${
              row.is_active
                ? "bg-emerald-500 shadow-emerald-400"
                : "bg-red-400 shadow-red-300"
            }`}
          />

          {/* Alias + name */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center min-w-[48px] h-12 px-3 bg-indigo-600 text-white rounded-xl shadow-sm">
              <span className="text-lg font-black leading-none">
                {(row.alias || row.name).slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <div className="text-base font-bold text-gray-900 truncate">
                {row.name}
              </div>
              {row.alias && (
                <div className="text-xs text-gray-400 font-medium truncate">
                  {row.alias}
                </div>
              )}
            </div>
          </div>

          {/* Status badge */}
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.7rem] font-bold uppercase tracking-wider border ${
              row.is_active
                ? "bg-green-50 text-green-800 border-green-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            {row.is_active
              ? t("active_male", lang)
              : t("inactive_male", lang)}
          </span>
        </div>
      ))}
    </div>
  );
}