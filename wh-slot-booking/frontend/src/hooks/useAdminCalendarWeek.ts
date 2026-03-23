import { useState, useCallback } from "react";
import { getSlotsAdmin } from "../API/serviceSlot";
import { getApiError } from "../Helper/helper";
import type { Slot } from "../Types/SlotType";

function weekRange(ref: Date): { dateFrom: string; dateTo: string } {
  const day = ref.getDay();
  const monday = new Date(ref);
  monday.setDate(ref.getDate() - ((day + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { dateFrom: iso(monday), dateTo: iso(sunday) };
}

export default function useAdminCalendarWeek() {
  const [weekRef, setWeekRef] = useState(new Date());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const load = useCallback(async (ref: Date) => {
    setLoadErr(null);
    setLoading(true);
    try {
      const { dateFrom, dateTo } = weekRange(ref);
      const data = await getSlotsAdmin(dateFrom, dateTo);
      setSlots(data);
    } catch (err) {
      setLoadErr(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const prevWeek = () => {
    const nw = new Date(weekRef);
    nw.setDate(weekRef.getDate() - 7);
    setWeekRef(nw);
    load(nw);
  };

  const nextWeek = () => {
    const nw = new Date(weekRef);
    nw.setDate(weekRef.getDate() + 7);
    setWeekRef(nw);
    load(nw);
  };

  return { weekRef, slots, loading, loadErr, load: () => load(weekRef), prevWeek, nextWeek };
}
