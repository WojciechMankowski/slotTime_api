import React from "react";
import { t, Lang } from "../Helper/i18n";
import { exportToCsv } from "../Helper/helper";
import type { Me } from "../Types/types";
import useReports from "../hooks/useReports";
import ReportKpiCards from "../components/reports/ReportKpiCards";
import ReportDailyChart from "../components/reports/ReportDailyChart";
import ReportDailyTable from "../components/reports/ReportDailyTable";
import ReportByCompanyTable from "../components/reports/ReportByCompanyTable";
import ReportByWarehouseTable from "../components/reports/ReportByWarehouseTable";
import ErrorBanner from "../components/UI/ErrorBanner";
import Spinner from "../components/UI/Spinner";

const inputCls = "border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

export default function AdminReports({ lang, me }: { lang: Lang; me: Me }) {
  const isSuperadmin = me.role === "superadmin";
  const { dateFrom, setDateFrom, dateTo, setDateTo, summary, daily, byCompany, byWarehouse, loading, error, generate } = useReports(isSuperadmin);

  const hasData = summary !== null;

  const handleExportDaily = () => {
    exportToCsv(daily as any, `raport_dzienny_${dateFrom}_${dateTo}.csv`);
  };

  const handleExportCompany = () => {
    exportToCsv(byCompany as any, `raport_firmy_${dateFrom}_${dateTo}.csv`);
  };

  const handleExportWarehouse = () => {
    exportToCsv(byWarehouse as any, `raport_magazyny_${dateFrom}_${dateTo}.csv`);
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">{t("reports", lang)}</h1>
        <p className="text-gray-500 text-sm">{t("reports_desc", lang)}</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("date_from", lang)}</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={inputCls} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("date_to", lang)}</label>
            <input type="date" value={dateTo} min={dateFrom} onChange={e => setDateTo(e.target.value)} className={inputCls} />
          </div>
          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-lg px-5 py-2 text-sm transition-colors shadow-sm"
          >
            {loading ? (
              <><Spinner />{t("generating_report", lang)}</>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
                {t("generate_report", lang)}
              </>
            )}
          </button>
          {hasData && (
            <div className="flex gap-2 ml-auto">
              <button
                onClick={handleExportDaily}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                {t("export_csv", lang)} ({t("daily_breakdown", lang)})
              </button>
              <button
                onClick={handleExportCompany}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                {t("export_csv", lang)} ({t("by_company", lang)})
              </button>
              {isSuperadmin && byWarehouse.length > 0 && (
                <button
                  onClick={handleExportWarehouse}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  {t("export_csv", lang)} ({t("warehouses", lang)})
                </button>
              )}
            </div>
          )}
        </div>
        {error && <ErrorBanner msg={error} />}
      </div>

      {/* Empty state */}
      {!hasData && !loading && (
        <div className="text-center py-20 text-gray-400">
          <svg className="mx-auto mb-4 opacity-20" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          <p className="text-base font-semibold">{t("no_report_data", lang)}</p>
        </div>
      )}

      {/* Data */}
      {hasData && (
        <>
          {/* KPI cards */}
          <ReportKpiCards summary={summary!} lang={lang} />

          {/* Daily chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">{t("daily_breakdown", lang)}</h2>
            <ReportDailyChart rows={daily} lang={lang} />
          </div>

          {/* Daily table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">{t("daily_breakdown", lang)}</h2>
            <ReportDailyTable rows={daily} lang={lang} />
          </div>

          {/* By company */}
          {byCompany.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-base font-bold text-gray-900 mb-4">{t("by_company", lang)}</h2>
              <ReportByCompanyTable rows={byCompany} lang={lang} />
            </div>
          )}

          {/* By warehouse (superadmin only) */}
          {isSuperadmin && byWarehouse.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-base font-bold text-gray-900 mb-4">{t("warehouses", lang)}</h2>
              <ReportByWarehouseTable rows={byWarehouse} lang={lang} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
