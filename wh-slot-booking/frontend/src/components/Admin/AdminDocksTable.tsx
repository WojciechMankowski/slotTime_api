import React from "react";
import { t, Lang } from "../../Helper/i18n";
import { DokTyp } from "../../Types/DokType";
import { AdminDocksTableProps } from "../../Types/Props";
import Button from "../UI/Button";
import EmptyState from "../UI/EmptyState";

export default function AdminDocksTable({
  rows,
  lang,
  className = "",
  setIsEdit,
  setDock,
  onDelete,
}: AdminDocksTableProps) {
  const handleEdit = (row: DokTyp) => {
    setDock(row);
    setIsEdit(true);
  };

  if (!rows || rows.length === 0) {
    return (
      <EmptyState
        icon={
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
        }
        title={t("no_docks", lang)}
        desc=""
      />
    );
  }

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}
    >
      {rows.map((row, index) => (
        <div
          key={row.id ?? index}
          className="relative bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-400 hover:-translate-y-0.5 transition-all duration-200"
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

          {/* Actions */}
          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              onClick={() => handleEdit(row)}
              className="outline"
              text={t("edit", lang)}
            />
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(row.id)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 transition-all"
              >
                {t("delete_btn", lang)}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
