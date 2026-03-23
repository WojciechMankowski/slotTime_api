import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { t, Lang } from "../Helper/i18n";
import { Me } from "../Types/types";
import useAdminSlots from "../hooks/useAdminSlots";
import ErrorBanner from "../components/UI/ErrorBanner";
import SlotForm from "../components/Forms/SlotForms";
import FilterSlotAdmin from "../components/FilertSlotAdmin";
import TableAdminSlot from "../components/Admin/AdminSlotTable";
import ConfirmDeleteModal from "../components/UI/ConfirmDeleteModal";
import { api } from "../API/api";

type DayCap = { id: number; date: string; slot_type: "INBOUND" | "OUTBOUND" | "ANY"; capacity: number };

export default function AdminSlot({ lang, me, initialDate }: { lang: Lang; me: Me; initialDate?: string }) {
  const nav = useNavigate();
  const {
    startOd,
    endDo,
    slotsAdmin,
    dockAdmin,
    errorCreate,
    errorLoad,
    errorDock,
    errorStatus,
    errorApprove,
    errorCancelAction,
    errorDelete,
    setStartOd,
    setEndDo,
    setTypeSlot,
    setStatusFilter,
    loadDataSlot,
    onDockChange,
    onStatusChange,
    onApprove,
    onApproveCancel,
    onRejectCancel,
    onDeleteSlot,
    handleCreateSlot,
  } = useAdminSlots(lang, initialDate);

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null);

  // Bulk delete state
  const [bulkDateFrom, setBulkDateFrom] = useState(new Date().toISOString().slice(0, 10));
  const [bulkDateTo, setBulkDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkType, setBulkType] = useState("");
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkErr, setBulkErr] = useState<string | null>(null);
  const [bulkResult, setBulkResult] = useState<number | null>(null);

  const [dayCaps, setDayCaps] = useState<DayCap[]>([]);
  useEffect(() => {
    if (!startOd || !endDo) return;
    api
      .get<DayCap[]>("/api/day-capacity", { params: { date_from: startOd, date_to: endDo } })
      .then(res => setDayCaps(res.data))
      .catch(() => setDayCaps([]));
  }, [startOd, endDo]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await onDeleteSlot(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleBulkDelete = async () => {
    setBulkLoading(true);
    setBulkErr(null);
    setBulkResult(null);
    try {
      const params: Record<string, string> = { date_from: bulkDateFrom, date_to: bulkDateTo };
      if (bulkStatus) params.status = bulkStatus;
      if (bulkType) params.slot_type = bulkType;
      const res = await api.delete<{ deleted: number }>("/api/slots", { params });
      setBulkResult(res.data.deleted);
      setBulkConfirm(false);
      loadDataSlot(startOd, endDo);
    } catch (err: any) {
      setBulkErr(err?.response?.data?.detail?.error_code ?? "ERROR");
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            {t("slots", lang)}
          </h1>
          <p className="text-gray-500 text-sm">
            {t("system_subtitle", lang)} (Admin)
          </p>
        </div>
        <button
          onClick={() => nav("/admin/archive")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 px-4 py-2 rounded-xl transition-all shrink-0"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="21 8 21 21 3 21 3 8" />
            <rect x="1" y="3" width="22" height="5" />
            <line x1="10" y1="12" x2="14" y2="12" />
          </svg>
          {t("archive_link", lang)}
        </button>
      </div>

      {/* Create form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="bg-linear-to-br from-indigo-600 to-indigo-800 px-7 py-4">
          <h2 className="text-lg font-bold text-white leading-none">
            {t("add_new_slots", lang)}
          </h2>
        </div>
        <div className="p-7">
          <SlotForm serverError={errorCreate} />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <FilterSlotAdmin
          lang={lang}
          startOd={startOd}
          endDo={endDo}
          onChange={(start, end) => loadDataSlot(start, end)}
          setStartOd={setStartOd}
          setEndDo={setEndDo}
          setStatus={setStatusFilter}
          setTypeSlot={setTypeSlot}
        />
        {errorLoad && <ErrorBanner msg={errorLoad} />}
      </div>

      {/* Bulk delete — superadmin only */}
      {me.role === "superadmin" && (
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-5 mb-6">
          <h3 className="text-sm font-bold text-red-700 mb-3 flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
            {t("bulk_delete_section", lang)}
          </h3>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("date_from", lang)}</label>
              <input type="date" value={bulkDateFrom} onChange={e => setBulkDateFrom(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("date_to", lang)}</label>
              <input type="date" value={bulkDateTo} onChange={e => setBulkDateTo(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("status", lang)}</label>
              <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400 min-w-[180px]">
                <option value="">{t("all_statuses_opt", lang)}</option>
                <option value="AVAILABLE">{t("available", lang)}</option>
                <option value="BOOKED">{t("booked", lang)}</option>
                <option value="APPROVED_WAITING_DETAILS">{t("approved_waiting_details", lang)}</option>
                <option value="RESERVED_CONFIRMED">{t("reserved_confirmed", lang)}</option>
                <option value="CANCEL_PENDING">{t("cancel_pending", lang)}</option>
                <option value="COMPLETED">{t("completed", lang)}</option>
                <option value="CANCELLED">{t("cancelled", lang)}</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("type", lang)}</label>
              <select value={bulkType} onChange={e => setBulkType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400 min-w-[140px]">
                <option value="">{t("all_types_opt", lang)}</option>
                <option value="INBOUND">{t("inbound", lang)}</option>
                <option value="OUTBOUND">{t("outbound", lang)}</option>
                <option value="ANY">{t("any", lang)}</option>
              </select>
            </div>
            <button
              onClick={() => { setBulkErr(null); setBulkResult(null); setBulkConfirm(true); }}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold rounded-lg px-5 py-2 text-sm transition-colors shadow-sm"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              </svg>
              {t("bulk_delete_btn", lang)}
            </button>
          </div>
          {bulkErr && <p className="mt-2 text-xs text-red-600 font-semibold">{bulkErr}</p>}
          {bulkResult !== null && (
            <p className="mt-2 text-xs text-emerald-700 font-semibold">
              ✓ {t("bulk_deleted_msg", lang)}: <strong>{bulkResult}</strong>
            </p>
          )}
        </div>
      )}

      {/* Summary */}
      {slotsAdmin.length > 0 && (() => {
        const byStatus = slotsAdmin.reduce<Record<string, number>>((acc, s) => {
          acc[s.status] = (acc[s.status] ?? 0) + 1;
          return acc;
        }, {});
        const byType = slotsAdmin.reduce<Record<string, number>>((acc, s) => {
          const key = s.original_slot_type;
          acc[key] = (acc[key] ?? 0) + 1;
          return acc;
        }, {});

        const STATUS_STYLE: Record<string, string> = {
          AVAILABLE:                "bg-emerald-100 text-emerald-800",
          BOOKED:                   "bg-amber-100 text-amber-800",
          APPROVED_WAITING_DETAILS: "bg-blue-100 text-blue-800",
          RESERVED_CONFIRMED:       "bg-indigo-100 text-indigo-800",
          COMPLETED:                "bg-gray-100 text-gray-600",
          CANCELLED:                "bg-red-100 text-red-700",
          CANCEL_PENDING:           "bg-orange-100 text-orange-700",
        };
        const STATUS_LABEL: Record<string, keyof typeof import("../Helper/i18n").dict> = {
          AVAILABLE:                "available",
          BOOKED:                   "booked",
          APPROVED_WAITING_DETAILS: "approved_waiting_details",
          RESERVED_CONFIRMED:       "reserved_confirmed",
          COMPLETED:                "completed",
          CANCELLED:                "cancelled",
          CANCEL_PENDING:           "cancel_pending",
        };

        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              {/* Total */}
              <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700 pr-4 border-r border-gray-200">
                <span className="text-2xl font-black text-indigo-600">{slotsAdmin.length}</span>
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{t("slots", lang)}</span>
              </div>

              {/* By status */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(byStatus).map(([status, count]) => (
                  <span
                    key={status}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLE[status] ?? "bg-gray-100 text-gray-600"}`}
                  >
                    {t(STATUS_LABEL[status] ?? status as any, lang)}
                    <span className="font-black ml-0.5">{count}</span>
                  </span>
                ))}
              </div>

              {/* By type */}
              {Object.keys(byType).length > 0 && (
                <div className="flex flex-wrap gap-2 pl-4 border-l border-gray-200">
                  {Object.entries(byType).map(([type, count]) => (
                    <span key={type} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                      {type === "INBOUND" ? t("inbound", lang) : type === "OUTBOUND" ? t("outbound", lang) : t("any", lang)}
                      <span className="font-black ml-0.5">{count}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Daily limits */}
      {dayCaps.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-6 overflow-x-auto">
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12.01" y2="8" /><line x1="12" y1="12" x2="12" y2="16" />
            </svg>
            {t("daily_limits", lang)}
          </h3>
          <table className="w-full text-xs text-left">
            <thead className="text-[0.65rem] uppercase tracking-widest text-gray-400 font-bold border-b border-gray-100">
              <tr>
                <th className="pb-2 pr-4">{t("date", lang)}</th>
                <th className="pb-2 pr-4">{t("type", lang)}</th>
                <th className="pb-2">{t("capacity", lang)}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {dayCaps.map(cap => (
                <tr key={cap.id}>
                  <td className="py-1.5 pr-4 font-bold text-gray-900">{cap.date.slice(5)}</td>
                  <td className="py-1.5 pr-4 text-gray-600">
                    {cap.slot_type === "INBOUND"
                      ? t("inbound", lang)
                      : cap.slot_type === "OUTBOUND"
                      ? t("outbound", lang)
                      : t("any", lang)}
                  </td>
                  <td className="py-1.5 font-bold text-indigo-700">{cap.capacity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 overflow-hidden">
        {errorDock && <ErrorBanner msg={errorDock} compact />}
        {errorStatus && <ErrorBanner msg={errorStatus} compact />}
        {errorApprove && <ErrorBanner msg={errorApprove} compact />}
        {errorCancelAction && <ErrorBanner msg={errorCancelAction} compact />}
        {errorDelete && <ErrorBanner msg={errorDelete} compact />}

        <TableAdminSlot
          rows={slotsAdmin}
          docks={dockAdmin}
          lang={lang}
          onDockChange={onDockChange}
          onStatusChange={onStatusChange}
          onApprove={onApprove}
          onApproveCancel={onApproveCancel}
          onRejectCancel={onRejectCancel}
          onDelete={me.role === "superadmin" ? (id) => {
            const slot = slotsAdmin.find(s => s.id === id);
            const label = slot
              ? new Date(slot.start_dt).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })
              : String(id);
            setDeleteTarget({ id, label });
          } : undefined}
        />
      </div>

      {deleteTarget && (
        <ConfirmDeleteModal
          lang={lang}
          title={deleteTarget.label}
          isDeleting={false}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {bulkConfirm && (
        <ConfirmDeleteModal
          lang={lang}
          title={`${bulkDateFrom} → ${bulkDateTo}${bulkStatus ? ` · ${bulkStatus}` : ""}${bulkType ? ` · ${bulkType}` : ""}`}
          isDeleting={bulkLoading}
          onConfirm={handleBulkDelete}
          onCancel={() => setBulkConfirm(false)}
        />
      )}
    </div>
  );
}
