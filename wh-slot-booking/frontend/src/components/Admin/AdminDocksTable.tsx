import React from "react";
import { t, Lang } from "../../Helper/i18n";
import { DokTyp } from "../../Types/DokType";

interface AdminDocksTableProps {
  rows: DokTyp[];
  lang: Lang;
  className?: string;
  setIsEdit: (v: boolean) => void;
  setDock: (dok: DokTyp) => void;
}

export default function AdminDocksTable({
  rows,
  lang,
  className = "",
  setIsEdit,
  setDock,
}: AdminDocksTableProps) {
  const handleEdit = (row: DokTyp) => {
    setDock(row);
    setIsEdit(true);
  };

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
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
        <p className="text-lg font-medium">
          {t("no_docks", lang)}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}
    >
      {rows.map((row, index) => (
        <button
          key={row.id ?? index}
          onClick={() => handleEdit(row)}
          className="group relative bg-white border border-gray-200 rounded-2xl p-5 text-left shadow-sm hover:shadow-md hover:border-blue-400 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
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
                {row.alias}
              </span>
            </div>
            <div className="min-w-0">
              <div className="text-base font-bold text-gray-900 truncate">
                {row.name}
              </div>
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
            {row.is_active ? t("active_male", lang) : t("inactive_male", lang)}
          </span>

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
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            {t("edit", lang)}
          </div>
        </button>
      ))}
    </div>
  );
}
