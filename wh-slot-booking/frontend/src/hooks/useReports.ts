import { useState } from "react";
import { api } from "../API/api";

export interface ReportSummary {
  total: number;
  available: number;
  booked: number;
  approved_waiting_details: number;
  reserved_confirmed: number;
  completed: number;
  cancelled: number;
  cancel_pending: number;
  inbound: number;
  outbound: number;
  any: number;
  utilization_pct: number;
}

export interface ReportDayRow {
  date: string;
  total: number;
  available: number;
  booked: number;
  approved_waiting_details: number;
  reserved_confirmed: number;
  completed: number;
  cancelled: number;
  cancel_pending: number;
  inbound: number;
  outbound: number;
  any: number;
  utilization_pct: number;
}

export interface ReportCompanyRow {
  company_id: number;
  company_name: string;
  company_alias: string;
  total_reservations: number;
  completed: number;
  cancelled: number;
  active: number;
  inbound: number;
  outbound: number;
  any: number;
}

export interface ReportWarehouseRow {
  warehouse_id: number;
  warehouse_name: string;
  warehouse_alias: string;
  total: number;
  available: number;
  booked: number;
  approved_waiting_details: number;
  reserved_confirmed: number;
  completed: number;
  cancelled: number;
  cancel_pending: number;
  inbound: number;
  outbound: number;
  any: number;
  utilization_pct: number;
}

export default function useReports(isSuperadmin = false) {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [dateFrom, setDateFrom] = useState(monthAgo);
  const [dateTo, setDateTo] = useState(today);

  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [daily, setDaily] = useState<ReportDayRow[]>([]);
  const [byCompany, setByCompany] = useState<ReportCompanyRow[]>([]);
  const [byWarehouse, setByWarehouse] = useState<ReportWarehouseRow[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { date_from: dateFrom, date_to: dateTo };
      const requests: Promise<any>[] = [
        api.get<ReportSummary>("/api/reports/summary", { params }),
        api.get<ReportDayRow[]>("/api/reports/daily", { params }),
        api.get<ReportCompanyRow[]>("/api/reports/by-company", { params }),
      ];
      if (isSuperadmin) {
        requests.push(api.get<ReportWarehouseRow[]>("/api/reports/by-warehouse", { params }));
      }
      const [summaryRes, dailyRes, byCompanyRes, byWarehouseRes] = await Promise.all(requests);
      setSummary(summaryRes.data);
      setDaily(dailyRes.data);
      setByCompany(byCompanyRes.data);
      if (byWarehouseRes) setByWarehouse(byWarehouseRes.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail?.error_code ?? "ERROR");
    } finally {
      setLoading(false);
    }
  };

  return {
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    summary, daily, byCompany, byWarehouse,
    loading, error,
    generate,
  };
}
