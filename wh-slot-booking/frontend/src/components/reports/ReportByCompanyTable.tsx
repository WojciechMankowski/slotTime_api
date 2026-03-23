import React from "react";
import { t, Lang } from "../../Helper/i18n";
import type { ReportCompanyRow } from "../../hooks/useReports";

interface Props {
  rows: ReportCompanyRow[];
  lang: Lang;
}

export default function ReportByCompanyTable({ rows, lang }: Props) {
  if (rows.length === 0) return null;

  const thCls = "px-3 py-3 text-left text-[0.65rem] font-bold uppercase tracking-widest text-gray-400";
  const tdCls = "px-3 py-2.5 text-sm";

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className={thCls}>{t("company", lang)}</th>
            <th className={thCls}>{t("reservations", lang)}</th>
            <th className={thCls}>{t("completed", lang)}</th>
            <th className={thCls}>{t("cancelled", lang)}</th>
            <th className={thCls}>{t("active", lang)}</th>
            <th className={thCls}>{t("inbound", lang)}</th>
            <th className={thCls}>{t("outbound", lang)}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map(r => {
            const completionRate = r.total_reservations > 0
              ? Math.round(r.completed / r.total_reservations * 100)
              : 0;
            return (
              <tr key={r.company_id} className="hover:bg-gray-50 transition-colors">
                <td className={`${tdCls}`}>
                  <div className="font-bold text-gray-900">{r.company_name}</div>
                  <div className="text-xs text-gray-400 font-mono">{r.company_alias}</div>
                </td>
                <td className={`${tdCls} font-bold text-indigo-700`}>{r.total_reservations}</td>
                <td className={`${tdCls}`}>
                  <span className="text-emerald-600 font-semibold">{r.completed}</span>
                  <span className="text-xs text-gray-400 ml-1">({completionRate}%)</span>
                </td>
                <td className={`${tdCls} text-red-500`}>{r.cancelled}</td>
                <td className={`${tdCls} text-amber-600`}>{r.active}</td>
                <td className={`${tdCls} text-blue-600`}>{r.inbound}</td>
                <td className={`${tdCls} text-orange-500`}>{r.outbound}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
