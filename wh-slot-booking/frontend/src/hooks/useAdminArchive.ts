import { useState } from "react";
import { getArchiveSlots } from "../API/serviceSlot";
import { getApiError } from "../Helper/helper";
import type { Slot } from "../Types/SlotType";

const iso = (d: Date) => d.toISOString().slice(0, 10);

export default function useAdminArchive() {
  const today = new Date();
  const minus30 = new Date(today);
  minus30.setDate(today.getDate() - 30);

  const [dateFrom, setDateFrom] = useState(iso(minus30));
  const [dateTo, setDateTo] = useState(iso(today));
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const load = async () => {
    setLoadErr(null);
    setLoading(true);
    try {
      const data = await getArchiveSlots({
        status: statusFilter,
        date_from: dateFrom,
        date_to: dateTo,
      });
      setSlots(data);
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
    setDateFrom,
    setDateTo,
    setStatusFilter,
    load,
  };
}
