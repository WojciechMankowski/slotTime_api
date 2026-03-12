import React, { useEffect, useState } from "react";
import { api } from "../API/api";
import { t, Lang, errorText } from "../Helper/i18n";
import type { Me, Slot, Dock } from "../Types/types";

function fmt(dt: string) {
  return new Date(dt).toLocaleString();
}

function minutesBetween(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

export default function Slots({ lang, me }: { lang: Lang; me: Me }) {
  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  const [dateFrom, setDateFrom] = useState(iso(today));
  const [dateTo, setDateTo] = useState(iso(today));
  const [items, setItems] = useState<Slot[]>([]);
  const [docks, setDocks] = useState<Dock[]>([]);
  const [err, setErr] = useState<string | null>(null);

  /* ===== ADMIN: single slot ===== */
  const [singleDate, setSingleDate] = useState(iso(today));
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const [slotType, setSlotType] = useState<"INBOUND" | "OUTBOUND" | "ANY">("INBOUND");
  const [parallelSlots, setParallelSlots] = useState(1);

  const load = async () => {
    setErr(null);
    const res = await api.get("/api/slots", {
      params: { date_from: dateFrom, date_to: dateTo },
    });
    setItems(res.data);
  };

  const loadDocks = async () => {
    try {
      const res = await api.get("/api/docks");
      setDocks(res.data);
    } catch {}
  };

  useEffect(() => {
    load();
    loadDocks();
  }, []);

  /* ===== CREATE SINGLE SLOT (via /generate) ===== */
  const createSingleSlot = async () => {
    setErr(null);

    const interval = minutesBetween(startTime, endTime);
    if (interval <= 0) {
      setErr("Koniec musi być po starcie");
      return;
    }

    try {
      await api.post("/api/slots/generate", {
        date_from: singleDate,
        date_to: singleDate,
        start_time: startTime,
        end_time: endTime,
        interval_minutes: interval,
        slot_type: slotType,
        parallel_slots: parallelSlots,
      });

      await load();
    } catch (ex: any) {
      const detail = ex?.response?.data?.detail;
      setErr(typeof detail === "string" ? detail : JSON.stringify(detail));
    }
  };

  // Wspólne klasy dla inputów, żeby nie powtarzać kodu
  const inputClass = "border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm";

  return (
    <div className="p-4 max-w-7xl mx-auto text-gray-800">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">{t("slots", lang)}</h2>

      {/* ===== ADMIN CARD ===== */}
      {me.role !== "client" && (
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 mb-6">
          <h3 className="text-lg font-bold text-blue-600 mb-1">
            Dodaj slot (pojedynczy)
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Tworzenie slotu ręcznie – przez endpoint <code className="bg-gray-100 px-1 rounded text-gray-700">/generate</code>
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="date"
              className={inputClass}
              value={singleDate}
              onChange={(e) => setSingleDate(e.target.value)}
            />
            <input
              type="time"
              className={inputClass}
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <input
              type="time"
              className={inputClass}
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />

            <select
              className={inputClass}
              value={slotType}
              onChange={(e) => setSlotType(e.target.value as any)}
            >
              <option value="INBOUND">INBOUND</option>
              <option value="OUTBOUND">OUTBOUND</option>
              <option value="ANY">ANY</option>
            </select>

            <input
              type="number"
              min={1}
              className={`${inputClass} w-24`}
              value={parallelSlots}
              onChange={(e) => setParallelSlots(Number(e.target.value))}
              title="Równoległe sloty"
            />

            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-4 rounded-md transition-colors shadow-sm"
              onClick={createSingleSlot}
            >
              + Utwórz slot
            </button>
          </div>
        </div>
      )}

      {/* ===== FILTER ===== */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="date"
          className={inputClass}
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
        <input
          type="date"
          className={inputClass}
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />
        <button 
          className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 font-medium py-1.5 px-4 rounded-md transition-colors shadow-sm"
          onClick={load}
        >
          {t("load", lang)}
        </button>
      </div>

      {err && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6 shadow-sm">
          {err}
        </div>
      )}

      {/* ===== TABLE ===== */}
      <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-sm">
        <table className="min-w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Start</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Koniec</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Typ</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Dok</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Rezerwacja</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{fmt(s.start_dt)}</td>
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{fmt(s.end_dt)}</td>
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                    {s.slot_type}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{s.status}</td>
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{s.dock_alias || "-"}</td>
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                  {s.reserved_by_company_alias
                    ? <span className="font-medium text-blue-600">{s.reserved_by_company_alias}</span> + ` / ${s.reserved_by_alias}`
                    : <span className="text-gray-400">-</span>}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 text-sm">
                  Brak danych do wyświetlenia.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}