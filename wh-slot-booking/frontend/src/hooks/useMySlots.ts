import { useState } from "react";
import { api } from "../API/api";
import { getApiError } from "../Helper/helper";
import type { Slot } from "../Types/SlotType";
import type { Me } from "../Types/types";

const iso = (d: Date) => d.toISOString().slice(0, 10);

export default function useMySlots(me: Me) {
  const today = new Date();
  const plus30 = new Date(today);
  plus30.setDate(today.getDate() + 30);

  const [dateFrom, setDateFrom] = useState(iso(today));
  const [dateTo, setDateTo] = useState(iso(plus30));
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

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
      const mine = res.data.filter(
        (s) => s.reserved_by_user_id === me.id && s.status !== "AVAILABLE"
      );
      setSlots(mine);
    } catch (err) {
      setLoadErr(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return {
    slots,
    loading,
    loadErr,
    dateFrom,
    dateTo,
    statusFilter,
    typeFilter,
    setDateFrom,
    setDateTo,
    setStatusFilter,
    setTypeFilter,
    reload: load,
  };
}
