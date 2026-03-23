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
    </div>
  );
}
