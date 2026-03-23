import { useState, useCallback } from "react";
import { getCalendarSummary, CalendarDaySummary } from "../API/serviceSlot";
import { getApiError } from "../Helper/helper";

function monthRange(year: number, month: number): { dateFrom: string; dateTo: string } {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    dateFrom: `${first.getFullYear()}-${pad(first.getMonth() + 1)}-${pad(first.getDate())}`,
    dateTo: `${last.getFullYear()}-${pad(last.getMonth() + 1)}-${pad(last.getDate())}`,
  };
}

function weekRange(refDate: Date): { dateFrom: string; dateTo: string } {
  const day = refDate.getDay(); // 0=Sun
  const monday = new Date(refDate);
  monday.setDate(refDate.getDate() - ((day + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { dateFrom: iso(monday), dateTo: iso(sunday) };
}

export type CalendarMode = "month" | "week";

export default function useAdminCalendar() {
  const today = new Date();
  const [mode, setMode] = useState<CalendarMode>("month");
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-based
  const [weekRef, setWeekRef] = useState(today);

  const [days, setDays] = useState<CalendarDaySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const load = useCallback(async (m: CalendarMode, y: number, mo: number, wr: Date) => {
    setLoadErr(null);
    setLoading(true);
    try {
      const range = m === "month" ? monthRange(y, mo) : weekRange(wr);
      const data = await getCalendarSummary(range.dateFrom, range.dateTo);
      setDays(data);
    } catch (err) {
      setLoadErr(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const reload = () => load(mode, year, month, weekRef);

  const prevMonth = () => {
    const nm = month === 0 ? 11 : month - 1;
    const ny = month === 0 ? year - 1 : year;
    setMonth(nm); setYear(ny);
    load("month", ny, nm, weekRef);
  };

  const nextMonth = () => {
    const nm = month === 11 ? 0 : month + 1;
    const ny = month === 11 ? year + 1 : year;
    setMonth(nm); setYear(ny);
    load("month", ny, nm, weekRef);
  };

  const prevWeek = () => {
    const nw = new Date(weekRef);
    nw.setDate(weekRef.getDate() - 7);
    setWeekRef(nw);
    load("week", year, month, nw);
  };

  const nextWeek = () => {
    const nw = new Date(weekRef);
    nw.setDate(weekRef.getDate() + 7);
    setWeekRef(nw);
    load("week", year, month, nw);
  };

  const switchMode = (m: CalendarMode) => {
    setMode(m);
    load(m, year, month, weekRef);
  };

  return {
    mode, year, month, weekRef,
    days, loading, loadErr,
    load: reload,
    switchMode,
    prevMonth, nextMonth,
    prevWeek, nextWeek,
  };
}
