import React from "react";
import { t, Lang } from "../../Helper/i18n";
import { UserOut } from "../../Types/types";

interface AdminUsersTableProps {
  rows: UserOut[];
  lang: Lang;
  className?: string;
  setIsEdit: (v: boolean) => void;
  setUser: (user: UserOut) => void;
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
        <button
          key={row.id ?? index}
          onClick={() => handleEdit(row)}
          className="group relative bg-white border border-gray-200 rounded-2xl p-5 text-left shadow-sm hover:shadow-md hover:border-blue-400 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
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
            </div>
          </div>

          {/* Info badges */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {/* Role */}
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.7rem] font-bold uppercase tracking-wider border ${
                ROLE_STYLE[row.role] ?? ROLE_STYLE.client
              }`}
            >
              {row.role}
            </span>

            {/* Company */}
            {row.company_alias && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.7rem] font-bold tracking-wider border bg-amber-50 text-amber-800 border-amber-200">
                {row.company_alias}
              </span>
            )}

            {/* Warehouse */}
            {row.warehouse_alias && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.7rem] font-bold tracking-wider border bg-emerald-50 text-emerald-800 border-emerald-200">
                {row.warehouse_alias}
              </span>
            )}
          </div>

          {/* Hover CTA */}
          <div className="text-xs text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1">
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