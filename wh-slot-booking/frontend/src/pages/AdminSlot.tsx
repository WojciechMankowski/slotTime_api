import React from "react";
import { t, Lang } from "../Helper/i18n";
import useAdminSlots from "../hooks/useAdminSlots";
import ErrorBanner from "../components/UI/ErrorBanner";
import SlotForm from "../components/Forms/SlotForms";
import FilterSlotAdmin from "../components/FilertSlotAdmin";
import TableAdminSlot from "../components/Admin/AdminSlotTable";

export default function AdminSlot({ lang }: { lang: Lang }) {
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
    setStartOd,
    setEndDo,
    setTypeSlot,
    setStatusFilter,
    loadDataSlot,
    onDockChange,
    onStatusChange,
    onApprove,
    handleCreateSlot,
  } = useAdminSlots(lang);

  return (
    <div className="p-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          {t("slots", lang)}
        </h1>
        <p className="text-gray-500 text-sm">
          {t("system_subtitle", lang)} (Admin)
        </p>
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

        <TableAdminSlot
          rows={slotsAdmin}
          docks={dockAdmin}
          lang={lang}
          onDockChange={onDockChange}
          onStatusChange={onStatusChange}
          onApprove={onApprove}
        />
      </div>
    </div>
  );
}