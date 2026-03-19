import { useState, useEffect } from "react";
import { api } from "../API/api";
import { getApiError } from "../Helper/helper";
import type { Slot } from "../Types/SlotType";
import type { SlotType } from "../Types/SlotType";

const iso = (d: Date) => d.toISOString().slice(0, 10);

export default function useAvailableSlots() {
  const today = new Date();
  const plus7 = new Date(today);
  plus7.setDate(today.getDate() + 6);

  const [dateFrom, setDateFrom] = useState(iso(today));
  const [dateTo, setDateTo] = useState(iso(plus7));
  const [typeFilter, setTypeFilter] = useState<SlotType>("ALL");

  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const load = async () => {
    setLoadErr(null);
    setLoading(true);
    try {
      const res = await api.get<Slot[]>("/api/slots", {
        params: { date_from: dateFrom, date_to: dateTo },
      });
      let available = res.data.filter((s) => s.status === "AVAILABLE");
      if (typeFilter !== "ALL") {
        available = available.filter((s) => s.slot_type === typeFilter);
      }
      setSlots(available);
    } catch (err) {
      setLoadErr(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    slots,
    loading,
    loadErr,
    dateFrom,
    dateTo,
    typeFilter,
    minDate: iso(today),
    setDateFrom,
    setDateTo,
    setTypeFilter,
    reload: load,
  };
}
