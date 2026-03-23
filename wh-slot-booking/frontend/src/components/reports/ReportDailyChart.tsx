import React from "react";
import { t, Lang } from "../../Helper/i18n";
import type { ReportDayRow } from "../../hooks/useReports";

interface Props {
  rows: ReportDayRow[];
  lang: Lang;
}

const BAR_H = 160;
const BAR_W = 28;
const GAP = 8;

export default function ReportDailyChart({ rows, lang }: Props) {
  if (rows.length === 0) return null;

  const maxTotal = Math.max(...rows.map(r => r.total), 1);

  const svgW = rows.length * (BAR_W + GAP) + GAP;

  return (
    <div className="overflow-x-auto">
      <svg
        width={svgW}
        height={BAR_H + 40}
        style={{ minWidth: `${Math.min(svgW, 100)}%` }}
      >
        {rows.map((r, i) => {
          const x = GAP + i * (BAR_W + GAP);
          const completedH = Math.round((r.completed / maxTotal) * BAR_H);
          const activeH = Math.round(((r.booked + r.approved_waiting_details + r.reserved_confirmed + r.cancel_pending) / maxTotal) * BAR_H);
          const cancelledH = Math.round((r.cancelled / maxTotal) * BAR_H);
          const availableH = Math.round((r.available / maxTotal) * BAR_H);

          // stacked from bottom: available, cancelled, active, completed
          let bottom = BAR_H;

          const segments: { h: number; color: string }[] = [
            { h: availableH, color: "#d1fae5" },   // emerald-100
            { h: cancelledH, color: "#fecaca" },    // red-200
            { h: activeH,    color: "#fde68a" },    // amber-200
            { h: completedH, color: "#6366f1" },    // indigo-500
          ];

          const bars: React.ReactNode[] = [];
          for (const seg of segments) {
            if (seg.h <= 0) continue;
            bottom -= seg.h;
            bars.push(
              <rect
                key={`${i}-${seg.color}`}
                x={x}
                y={bottom}
                width={BAR_W}
                height={seg.h}
                fill={seg.color}
                rx={seg.h === BAR_H ? 4 : 0}
              />
            );
          }

          // round top corners on the top-most bar
          const label = r.date.slice(5); // MM-DD

          return (
            <g key={r.date}>
              {bars}
              {/* total label on top */}
              <text
                x={x + BAR_W / 2}
                y={Math.max(BAR_H - Math.round((r.total / maxTotal) * BAR_H) - 4, 10)}
                textAnchor="middle"
                fontSize="9"
                fontWeight="700"
                fill="#4338ca"
              >
                {r.total > 0 ? r.total : ""}
              </text>
              {/* date label below */}
              <text
                x={x + BAR_W / 2}
                y={BAR_H + 14}
                textAnchor="middle"
                fontSize="8"
                fill="#9ca3af"
                fontWeight="600"
              >
                {label}
              </text>
              {/* utilization % */}
              <text
                x={x + BAR_W / 2}
                y={BAR_H + 26}
                textAnchor="middle"
                fontSize="8"
                fill={r.utilization_pct >= 80 ? "#059669" : r.utilization_pct >= 50 ? "#d97706" : "#dc2626"}
                fontWeight="700"
              >
                {r.utilization_pct}%
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-3 text-xs font-semibold text-gray-600">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block bg-indigo-500" />{t("completed", lang)}</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block bg-amber-200" />{t("booked", lang)}</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block bg-red-200" />{t("cancelled", lang)}</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block bg-emerald-100 border border-emerald-200" />{t("available", lang)}</span>
      </div>
    </div>
  );
}
