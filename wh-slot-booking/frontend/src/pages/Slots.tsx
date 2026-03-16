import React, { useEffect, useState } from "react";
import { api } from "../API/api";
import { t, Lang, errorText } from "../Helper/i18n";
import type { Me, Slot, Dock } from "../Types/types";
import AdminSlot from "./AdminSlot";

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
  const [slotType, setSlotType] = useState<"INBOUND" | "OUTBOUND" | "ANY">(
    "INBOUND",
  );
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
  const inputClass =
    "border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm";

  return (
    <div className="p-4 max-w-7xl mx-auto text-gray-800">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        {t("slots", lang)}
      </h2>
      {me.role !== "client" && <AdminSlot lang={lang} />}
    </div>
  );
}
