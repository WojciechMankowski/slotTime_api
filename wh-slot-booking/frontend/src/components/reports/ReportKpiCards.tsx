import React from "react";
import { t, Lang } from "../../Helper/i18n";
import type { ReportSummary } from "../../hooks/useReports";

interface Props {
  summary: ReportSummary;
  lang: Lang;
}

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className={`rounded-2xl border p-5 flex flex-col gap-1 ${color}`}>
      <div className="text-xs font-bold uppercase tracking-widest opacity-70">{label}</div>
      <div className="text-3xl font-black">{value}</div>
      {sub && <div className="text-xs font-medium opacity-60">{sub}</div>}
    </div>
  );
}

export default function ReportKpiCards({ summary, lang }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <KpiCard
        label={t("kpi_total", lang)}
        value={String(summary.total)}
        sub={`${t("available", lang)}: ${summary.available}`}
        color="bg-indigo-50 border-indigo-200 text-indigo-900"
      />
      <KpiCard
        label={t("kpi_utilization", lang)}
        value={`${summary.utilization_pct}%`}
        sub={`${summary.total - summary.available} / ${summary.total}`}
        color={
          summary.utilization_pct >= 80
            ? "bg-emerald-50 border-emerald-200 text-emerald-900"
            : summary.utilization_pct >= 50
            ? "bg-amber-50 border-amber-200 text-amber-900"
            : "bg-red-50 border-red-200 text-red-900"
        }
      />
      <KpiCard
        label={t("kpi_completed", lang)}
        value={String(summary.completed)}
        sub={`${t("reserved_confirmed", lang)}: ${summary.reserved_confirmed}`}
        color="bg-green-50 border-green-200 text-green-900"
      />
      <KpiCard
        label={t("kpi_cancelled", lang)}
        value={String(summary.cancelled)}
        sub={`${t("cancel_pending", lang)}: ${summary.cancel_pending}`}
        color="bg-red-50 border-red-200 text-red-900"
      />
    </div>
  );
}
