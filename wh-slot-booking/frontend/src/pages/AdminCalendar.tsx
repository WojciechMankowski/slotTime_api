import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { t, Lang } from "../Helper/i18n";
import useAdminCalendar, { CalendarMode } from "../hooks/useAdminCalendar";
import useAdminCalendarWeek from "../hooks/useAdminCalendarWeek";
import ErrorBanner from "../components/UI/ErrorBanner";
import Spinner from "../components/UI/Spinner";
import { TYPE_STYLE } from "../Helper/helper";
import type { CalendarDaySummary } from "../API/serviceSlot";
import type { Slot } from "../Types/SlotType";

interface Props { lang: Lang }

function getMonthNames(lang: Lang) { return t("cal_months", lang).split("|"); }
function getDayNames(lang: Lang)   { return t("cal_days",   lang).split("|"); }

const GRID_START = 6 * 60;  // 06:00
const GRID_END   = 22 * 60; // 22:00
const GRID_SPAN  = GRID_END - GRID_START; // 960 min

function dtToMinutes(dt: string): number {
  const d = new Date(dt);
  return d.getHours() * 60 + d.getMinutes();
}

// ── Month Day Cell ──────────────────────────────────────────
function DayCell({ summary, dateStr, isToday, isOtherMonth, onClick }: {
  summary: CalendarDaySummary | undefined;
  dateStr: string;
  isToday: boolean;
  isOtherMonth: boolean;
  onClick: () => void;
}) {
  const dayNum = parseInt(dateStr.slice(8), 10);

  if (isOtherMonth) {
    return (
      <div className="min-h-[88px] rounded-xl bg-gray-50 border border-gray-100 p-2 opacity-35 select-none">
        <span className="text-sm font-medium text-gray-400">{dayNum}</span>
      </div>
    );
  }

  const booked   = summary?.booked    ?? 0;
  const avail    = summary?.available ?? 0;
  const total    = summary?.total     ?? 0;
  const progress = total > 0 ? Math.round((booked / total) * 100) : 0;

  return (
    <button
      onClick={onClick}
      className={`min-h-[88px] rounded-xl border p-2 text-left w-full transition-all hover:shadow-md hover:scale-[1.02] active:scale-100
        ${isToday ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200" : "bg-white border-gray-200 hover:border-blue-300"}`}
    >
      <span className={`text-sm font-bold leading-none ${isToday ? "text-blue-600" : "text-gray-800"}`}>{dayNum}</span>

      {total > 0 ? (
        <>
          {/* total badge */}
          <span className="ml-1.5 text-[0.6rem] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{total}</span>

          {/* dots */}
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {avail > 0 && (
              <span className="flex items-center gap-0.5 text-[0.6rem] font-semibold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />{avail}
              </span>
            )}
            {booked > 0 && (
              <span className="flex items-center gap-0.5 text-[0.6rem] font-semibold text-amber-700">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />{booked}
              </span>
            )}
            {(summary?.cancelled ?? 0) + (summary?.completed ?? 0) > 0 && (
              <span className="flex items-center gap-0.5 text-[0.6rem] font-semibold text-gray-400">
                <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />{(summary?.cancelled ?? 0) + (summary?.completed ?? 0)}</span>
            )}
          </div>

          {/* mini progress bar */}
          <div className="mt-1.5 h-1 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                progress === 0 ? "bg-emerald-400" :
                progress < 40  ? "bg-blue-400" :
                progress < 75  ? "bg-amber-400" : "bg-red-400"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </>
      ) : (
        <span className="block text-[0.6rem] text-gray-300 mt-1">—</span>
      )}
    </button>
  );
}

// ── Week Grid ───────────────────────────────────────────────
function WeekGrid({ slots, weekRef, lang, onDayClick }: {
  slots: Slot[];
  weekRef: Date;
  lang: Lang;
  onDayClick: (date: string) => void;
}) {
  const dayNames = getDayNames(lang);
  const today = new Date().toISOString().slice(0, 10);

  // Build 7-day column dates (Mon–Sun)
  const monday = new Date(weekRef);
  monday.setDate(weekRef.getDate() - ((weekRef.getDay() + 6) % 7));
  const cols: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    cols.push(d.toISOString().slice(0, 10));
  }

  // Bucket slots by day
  const byDay: Record<string, Slot[]> = {};
  cols.forEach(d => { byDay[d] = []; });
  slots.forEach(s => {
    const day = s.start_dt.slice(0, 10);
    if (byDay[day]) byDay[day].push(s);
  });

  // Hour labels 06–22
  const hours: number[] = [];
  for (let h = 6; h <= 22; h++) hours.push(h);

  const CELL_H = 48; // px per hour row
  const GRID_H = (GRID_SPAN / 60) * CELL_H; // total grid height px

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Column headers */}
        <div className="flex border-b border-gray-200 mb-0">
          <div className="w-14 shrink-0" />
          {cols.map((date, i) => {
            const dayNum = parseInt(date.slice(8), 10);
            const monthNum = parseInt(date.slice(5, 7), 10);
            const isToday = date === today;
            return (
              <div key={date} className="flex-1 text-center py-2 border-l border-gray-100 first:border-l-0">
                <div className={`text-[0.7rem] font-bold uppercase tracking-wider ${isToday ? "text-blue-500" : "text-gray-400"}`}>
                  {dayNames[i]}
                </div>
                <div className={`text-base font-extrabold ${isToday ? "text-blue-600" : "text-gray-700"}`}>
                  {dayNum}
                  <span className="text-[0.6rem] font-normal text-gray-400 ml-0.5">/{monthNum}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Grid body */}
        <div className="flex">
          {/* Hour labels */}
          <div className="w-14 shrink-0 relative" style={{ height: GRID_H }}>
            {hours.map(h => (
              <div
                key={h}
                className="absolute text-[0.65rem] text-gray-400 font-medium pr-2 text-right w-full"
                style={{ top: ((h - 6) * 60 / GRID_SPAN) * GRID_H - 8 }}
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {cols.map(date => (
            <div
              key={date}
              className="flex-1 border-l border-gray-100 relative"
              style={{ height: GRID_H }}
            >
              {/* Hour lines */}
              {hours.map(h => (
                <div
                  key={h}
                  className="absolute w-full border-t border-gray-100"
                  style={{ top: ((h - 6) * 60 / GRID_SPAN) * GRID_H }}
                />
              ))}

              {/* Slot blocks */}
              {byDay[date].map(slot => {
                const startMin = Math.max(dtToMinutes(slot.start_dt), GRID_START);
                const endMin   = Math.min(dtToMinutes(slot.end_dt),   GRID_END);
                const topPct   = (startMin - GRID_START) / GRID_SPAN;
                const heightPct = Math.max((endMin - startMin) / GRID_SPAN, 20 / GRID_H);
                const colorClass = TYPE_STYLE[slot.slot_type] ?? "bg-blue-100 text-blue-800";

                return (
                  <button
                    key={slot.id}
                    onClick={() => onDayClick(date)}
                    className={`absolute inset-x-0.5 rounded-lg px-1.5 py-1 text-left overflow-hidden border border-white/50 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all ${colorClass}`}
                    style={{
                      top: `${topPct * 100}%`,
                      height: `${Math.max(heightPct * 100, (20 / GRID_H) * 100)}%`,
                      minHeight: "20px",
                    }}
                  >
                    <div className="text-[0.6rem] font-bold leading-tight truncate">
                      {new Date(slot.start_dt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {" "}
                      {slot.slot_type}
                    </div>
                    <div className="text-[0.55rem] opacity-70 truncate">{slot.status}</div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────
export default function AdminCalendar({ lang }: Props) {
  const nav = useNavigate();
  const cal  = useAdminCalendar();
  const week = useAdminCalendarWeek();

  useEffect(() => {
    cal.load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchMode = (m: CalendarMode) => {
    cal.switchMode(m);
    if (m === "week") week.load();
  };

  const handleDayClick = (dateStr: string) => nav(`/slots?date=${dateStr}`);

  // Month grid builder
  const buildMonthGrid = () => {
    const firstDay = new Date(cal.year, cal.month, 1);
    const lastDay  = new Date(cal.year, cal.month + 1, 0);
    const offset   = (firstDay.getDay() + 6) % 7;
    const cells: { dateStr: string; isOtherMonth: boolean }[] = [];

    for (let i = offset - 1; i >= 0; i--) {
      const d = new Date(firstDay); d.setDate(d.getDate() - (i + 1));
      cells.push({ dateStr: d.toISOString().slice(0, 10), isOtherMonth: true });
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      cells.push({ dateStr: new Date(cal.year, cal.month, i).toISOString().slice(0, 10), isOtherMonth: false });
    }
    const rem = cells.length % 7;
    if (rem !== 0) {
      for (let i = 1; i <= 7 - rem; i++) {
        const d = new Date(lastDay); d.setDate(d.getDate() + i);
        cells.push({ dateStr: d.toISOString().slice(0, 10), isOtherMonth: true });
      }
    }
    return cells;
  };

  const summaryMap = Object.fromEntries(cal.days.map(d => [d.date, d]));
  const todayStr   = new Date().toISOString().slice(0, 10);
  const monthNames = getMonthNames(lang);
  const dayNames   = getDayNames(lang);

  // Week label
  const weekLabel = (() => {
    const ref = week.weekRef;
    const monday = new Date(ref);
    monday.setDate(ref.getDate() - ((ref.getDay() + 6) % 7));
    const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
    const fmt = (d: Date) => `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}`;
    return `${fmt(monday)} – ${fmt(sunday)}.${sunday.getFullYear()}`;
  })();

  const navLabel = cal.mode === "month" ? `${monthNames[cal.month]} ${cal.year}` : weekLabel;
  const loading  = cal.mode === "month" ? cal.loading : week.loading;
  const loadErr  = cal.mode === "month" ? cal.loadErr : week.loadErr;

  return (
    <div className="p-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">{t("calendar", lang)}</h1>
          <p className="text-gray-500 text-sm">{navLabel}</p>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {(["month", "week"] as CalendarMode[]).map(m => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                cal.mode === m ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {m === "month" ? t("month_view", lang) : t("week_view", lang)}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={cal.mode === "month" ? cal.prevMonth : week.prevWeek}
          className="p-2 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <span className="font-bold text-gray-700 text-lg">{navLabel}</span>
        <button
          onClick={cal.mode === "month" ? cal.nextMonth : week.nextWeek}
          className="p-2 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>

      {loadErr && <ErrorBanner msg={loadErr} />}

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          {cal.mode === "month" ? (
            <>
              <div className="grid grid-cols-7 gap-2 mb-2">
                {dayNames.map(d => (
                  <div key={d} className="text-center text-[0.7rem] font-bold text-gray-400 uppercase tracking-widest pb-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {buildMonthGrid().map(({ dateStr, isOtherMonth }) => (
                  <DayCell
                    key={dateStr}
                    dateStr={dateStr}
                    summary={summaryMap[dateStr]}
                    isToday={dateStr === todayStr}
                    isOtherMonth={isOtherMonth}
                    onClick={() => handleDayClick(dateStr)}
                  />
                ))}
              </div>
            </>
          ) : (
            <WeekGrid
              slots={week.slots}
              weekRef={week.weekRef}
              lang={lang}
              onDayClick={handleDayClick}
            />
          )}
        </div>
      )}

      {/* Legend (month only) */}
      {cal.mode === "month" && (
        <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />{t("cal_legend_available", lang)}</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />{t("cal_legend_booked", lang)}</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" />{t("cal_legend_done", lang)}</span>
          <span className="ml-2 flex items-center gap-1.5 text-gray-400">{t("cal_legend_bar", lang)}</span>
        </div>
      )}
    </div>
  );
}
