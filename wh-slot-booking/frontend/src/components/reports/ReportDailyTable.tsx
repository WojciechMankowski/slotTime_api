import React from "react";
import { t, Lang } from "../../Helper/i18n";
import type { ReportDayRow } from "../../hooks/useReports";

interface Props {
  rows: ReportDayRow[];
  lang: Lang;
}

export default function ReportDailyTable({ rows, lang }: Props) {
  if (rows.length === 0) return null;

  const thCls = "px-3 py-3 text-left text-[0.65rem] font-bold uppercase tracking-widest text-gray-400";
  const tdCls = "px-3 py-2.5 text-sm";

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className={thCls}>{t("date", lang)}</th>
            <th className={thCls}>{t("kpi_total", lang)}</th>
            <th className={thCls}>{t("available", lang)}</th>
            <th className={thCls}>{t("booked", lang)}</th>
            <th className={thCls}>{t("completed", lang)}</th>
            <th className={thCls}>{t("cancelled", lang)}</th>
            <th className={thCls}>{t("inbound", lang)}</th>
            <th className={thCls}>{t("outbound", lang)}</th>
            <th className={thCls}>{t("utilization", lang)}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map(r => (
            <tr key={r.date} className="hover:bg-gray-50 transition-colors">
              <td className={`${tdCls} font-bold text-gray-900`}>{r.date}</td>
              <td className={`${tdCls} font-semibold text-indigo-700`}>{r.total}</td>
              <td className={`${tdCls} text-gray-500`}>{r.available}</td>
              <td className={`${tdCls} text-amber-600`}>{r.booked + r.approved_waiting_details + r.reserved_confirmed}</td>
              <td className={`${tdCls} text-emerald-600 font-semibold`}>{r.completed}</td>
              <td className={`${tdCls} text-red-500`}>{r.cancelled}</td>
              <td className={`${tdCls} text-blue-600`}>{r.inbound}</td>
              <td className={`${tdCls} text-orange-500`}>{r.outbound}</td>
              <td className={`${tdCls} font-bold`}>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  r.utilization_pct >= 80
                    ? "bg-emerald-100 text-emerald-800"
                    : r.utilization_pct >= 50
                    ? "bg-amber-100 text-amber-800"
                    : "bg-red-100 text-red-700"
                }`}>
                  {r.utilization_pct}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
