import React from "react";
import { t, Lang } from "../../Helper/i18n";
import { UserOut } from "../../Types/types";

interface AdminUsersTableProps {
  rows: UserOut[];
  lang: Lang;
  className?: string;
  setIsEdit: (v: boolean) => void;
  setUser: (user: UserOut) => void;
  onDelete?: (id: number) => void;
}

const ROLE_STYLE: Record<string, string> = {
  admin: "bg-purple-50 text-purple-800 border-purple-200",
  manager: "bg-blue-50 text-blue-800 border-blue-200",
  client: "bg-gray-50 text-gray-700 border-gray-200",
};

export default function AdminUsersTable({
  rows,
  lang,
  className = "",
  setIsEdit,
  setUser,
  onDelete,
}: AdminUsersTableProps) {
  const handleEdit = (row: UserOut) => {
    setUser(row);
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
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <p className="text-lg font-medium">
          {lang === "pl" ? "Brak użytkowników" : "No users"}
        </p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {rows.map((row, index) => (
        <div
          key={row.id ?? index}
          className="relative bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-400 hover:-translate-y-0.5 transition-all duration-200"
        >
          {/* Avatar + name */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center min-w-[48px] h-12 px-3 bg-indigo-600 text-white rounded-xl shadow-sm">
              <span className="text-lg font-black leading-none">
                {(row.alias || row.username).slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <div className="text-base font-bold text-gray-900 truncate">
                {row.username}
              </div>
              {row.alias && (
                <div className="text-xs text-gray-400 font-medium truncate">
                  {row.alias}
                </div>
              )}
              {row.email && (
                <div className="text-xs text-gray-400 truncate">
                  {row.email}
                </div>
              )}
            </div>
          </div>

          {/* Info badges */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.7rem] font-bold uppercase tracking-wider border ${
                ROLE_STYLE[row.role] ?? ROLE_STYLE.client
              }`}
            >
              {row.role}
            </span>
            {row.company_alias && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.7rem] font-bold tracking-wider border bg-amber-50 text-amber-800 border-amber-200">
                {row.company_alias}
              </span>
            )}
            {row.warehouse_alias && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.7rem] font-bold tracking-wider border bg-emerald-50 text-emerald-800 border-emerald-200">
                {row.warehouse_alias}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={() => handleEdit(row)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-gray-700 border border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50 transition-all"
            >
              {t("edit", lang)}
            </button>
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