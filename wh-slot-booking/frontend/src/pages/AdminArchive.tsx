import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { t, Lang } from "../Helper/i18n";
import useAdminArchive from "../hooks/useAdminArchive";
import ErrorBanner from "../components/UI/ErrorBanner";
import Spinner from "../components/UI/Spinner";
import { STATUS_STYLE, TYPE_STYLE } from "../Helper/helper";

interface Props {
  lang: Lang;
}

export default function AdminArchive({ lang }: Props) {
  const nav = useNavigate();
  const { slots, loading, loadErr, dateFrom, dateTo, statusFilter, setDateFrom, setDateTo, setStatusFilter, load } =
    useAdminArchive();

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => nav("/slots")}
          className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
          title={t("slots", lang)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">{t("archive", lang)}</h1>
          <p className="text-gray-500 text-sm">{t("archive_desc", lang)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("date_from", lang)}</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("date_to", lang)}</label>
            <input
              type="date"
              value={dateTo}
              min={dateFrom}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("status", lang)}</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[160px]"
            >
              <option value="ALL">{t("show_all", lang)}</option>
              <option value="COMPLETED">{t("completed", lang)}</option>
              <option value="CANCELLED">{t("cancelled", lang)}</option>
            </select>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg px-5 py-2 text-sm transition-colors shadow-sm disabled:opacity-60"
          >
            {loading ? (
              <>
                <Spinner />
                {t("loading", lang)}
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                {t("filter_slots", lang)}
              </>
            )}
          </button>
        </div>
      </div>

      {loadErr && <ErrorBanner msg={loadErr} />}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                {[t("start", lang), t("end", lang), t("type", lang), t("status", lang), t("dock", lang), t("company", lang)].map((col) => (
                  <th key={col} className="px-6 py-4 text-left text-[0.7rem] font-bold text-gray-400 uppercase tracking-widest">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {slots.map((row) => {
                const statusStyle = STATUS_STYLE[row.status] ?? { bg: "bg-gray-100", text: "text-gray-600", label_pl: row.status, label_en: row.status };
                return (
                  <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {new Date(row.start_dt).toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                      </span>
                      <span className="text-sm font-bold text-blue-600 ml-2">
                        {new Date(row.start_dt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                      {new Date(row.end_dt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-[0.65rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${TYPE_STYLE[row.slot_type] ?? "bg-gray-100 text-gray-600"}`}>
                        {t(row.slot_type.toLowerCase() as any, lang)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                        {lang === "pl" ? statusStyle.label_pl : statusStyle.label_en}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                      {row.dock_alias ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {row.reserved_by_company_alias ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{row.reserved_by_company_alias}</span>
                          {row.reserved_by_alias && <span className="text-[0.65rem] text-gray-400 italic">{row.reserved_by_alias}</span>}
                        </div>
                      ) : row.reserved_by_alias ? (
                        <span className="text-gray-500 italic">{row.reserved_by_alias}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!loading && slots.length === 0 && !loadErr && (
            <div className="text-center py-20 text-gray-300">
              <svg className="mx-auto mb-4 opacity-20" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <p className="text-lg font-medium">{t("no_available_slots", lang)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
