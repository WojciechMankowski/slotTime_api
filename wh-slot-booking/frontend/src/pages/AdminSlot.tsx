import React from "react";
import { useNavigate } from "react-router-dom";
import { t, Lang } from "../Helper/i18n";
import useAdminSlots from "../hooks/useAdminSlots";
import ErrorBanner from "../components/UI/ErrorBanner";
import SlotForm from "../components/Forms/SlotForms";
import FilterSlotAdmin from "../components/FilertSlotAdmin";
import TableAdminSlot from "../components/Admin/AdminSlotTable";

export default function AdminSlot({ lang, initialDate }: { lang: Lang; initialDate?: string }) {
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
    handleCreateSlot,
  } = useAdminSlots(lang, initialDate);

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

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 overflow-hidden">
        {errorDock && <ErrorBanner msg={errorDock} compact />}
        {errorStatus && <ErrorBanner msg={errorStatus} compact />}
        {errorApprove && <ErrorBanner msg={errorApprove} compact />}
        {errorCancelAction && <ErrorBanner msg={errorCancelAction} compact />}

        <TableAdminSlot
          rows={slotsAdmin}
          docks={dockAdmin}
          lang={lang}
          onDockChange={onDockChange}
          onStatusChange={onStatusChange}
          onApprove={onApprove}
          onApproveCancel={onApproveCancel}
          onRejectCancel={onRejectCancel}
        />
      </div>
    </div>
  );
}