import React, { useState } from "react";
import { Lang, t, errorText } from "../Helper/i18n";
import SlotForm from "../components/Forms/SlotForms";
import FilterSlotAdmin from "../components/FilertSlotAdmin";
import TableAdminSlot from "../components/Admin/AdminSlotTable";
import { getSlotsAdmin, assignDock, createSlot, patchSlot, approveSlot } from "../API/serviceSlot";
import { Slot } from "../Types/SlotType";
import { getDokAdmin } from "../API/serviceDok";
import { DokTyp } from "../Types/DokType";
import axios from "axios";

function getApiErrorMessage(error: unknown, lang: Lang): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;

    // FastAPI zwraca { error_code: "...", field?: "..." }
    if (detail?.error_code) {
      const field = detail.field ? ` (${detail.field})` : "";
      const msg = errorText[detail.error_code] ? errorText[detail.error_code][lang] : detail.error_code;
      return `${msg}${field}`;
    }

    // Czasem detail to po prostu string
    if (typeof detail === "string") return detail;

    // Standardowe kody HTTP
    const status = error.response?.status;
    if (status === 401) return errorText.INVALID_TOKEN[lang];
    if (status === 403) return errorText.FORBIDDEN[lang];
    if (status === 404) return errorText.NOT_FOUND[lang];
    if (status === 409) return errorText.DATA_CONFLICT[lang];

    return error.message || errorText.CONNECTION_ERROR[lang];
  }

  return errorText.UNEXPECTED_ERROR[lang];
}

// ============================================================
// Komponent
// ============================================================

export default function AdminSlot({ lang }: { lang: Lang }) {
  const now = new Date().toISOString().split("T")[0];

  const [startOd, setStartOd] = useState(now);
  const [endDo, setEndDo] = useState(now);
  const [slotsAdmin, setSlotsAdmin] = useState<Slot[]>([]);
  const [dockAdmin, setDockAdmin] = useState<DokTyp[]>([]);
  const [typeSlot, setTypeSlot] = useState<string>("--");
  const [status, setStatus] = useState<string>("--");

  const [errorCreate, setErrorCreate] = useState<string | null>(null);
  const [errorLoad, setErrorLoad] = useState<string | null>(null);
  const [errorDock, setErrorDock] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [errorApprove, setErrorApprove] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const loadDataSlot = async (start: string, end: string) => {
    setErrorLoad(null);
    setStartOd(start);
    setEndDo(end);

    try {
      let [slots, docks] = await Promise.all([
        getSlotsAdmin(start, end),
        getDokAdmin(),
      ]);
      if (typeSlot !== "--") {
        slots = slots.filter((slot) => slot.slot_type === typeSlot);
      }
      if (status !== "--") {
        slots = slots.filter((slot) => slot.status === status);
      }
      setSlotsAdmin(slots);
      setDockAdmin(docks);
    } catch (error) {
      setErrorLoad(getApiErrorMessage(error, lang));
    }
  };

  const onDockChange = async (slotId: number, newDock: number) => {
    setErrorDock(null);

    try {
      await assignDock(slotId, newDock);
      // odśwież tabelę po udanym przypisaniu
      await loadDataSlot(startOd, endDo);
    } catch (error) {
      setErrorDock(getApiErrorMessage(error, lang));
    }
  };

  const onStatusChange = async (slotId: number, newStatus: string) => {
    setErrorStatus(null);
    try {
      const slot = slotsAdmin.find((s) => s.id === slotId);
      if (!slot) return;

      await patchSlot(slotId, {
        ...slot,
        status: newStatus as any,
      });
      await loadDataSlot(startOd, endDo);
    } catch (error) {
      setErrorStatus(getApiErrorMessage(error, lang));
    }
  };

  const onApprove = async (slotId: number) => {
    setErrorApprove(null);
    try {
      await approveSlot(slotId);
      await loadDataSlot(startOd, endDo);
    } catch (error) {
      setErrorApprove(getApiErrorMessage(error, lang));
    }
  };

  const handleCreateSlot = async (formData: {
    dateFrom: string;
    timeFrom: string;
    timeTo: string;
    slotType: "INBOUND" | "OUTBOUND" | "ANY";
    intervalMinutes: number;
    parallelSlots: number;
  }) => {
    setErrorCreate(null);
    setIsCreating(true);

    try {
      await createSlot(
        formData.dateFrom,
        formData.timeFrom,
        formData.timeTo,
        formData.slotType,
        formData.intervalMinutes,
        formData.parallelSlots,
      );
      // odśwież listę po udanym generowaniu
      await loadDataSlot(startOd, endDo);
    } catch (error) {
      setErrorCreate(getApiErrorMessage(error, lang));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      {/* ===== Page header ===== */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          {t("slots", lang)}
        </h1>
        <p className="text-gray-500 text-sm">{t("system_subtitle", lang)} (Admin)</p>
      </div>

      {/* ===== Slot Creation Form ===== */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-linear-to-br from-indigo-600 to-indigo-800 px-7 py-4">
          <h2 className="text-lg font-bold text-white leading-none">
            {t('add_new_slots', lang)}
          </h2>
        </div>
        <div className="p-7">
          <SlotForm serverError={errorCreate} />
        </div>
      </div>

      {/* ===== Filters ===== */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col gap-4">
        <FilterSlotAdmin
          lang={lang}
          startOd={startOd}
          endDo={endDo}
          onChange={(start, end) => loadDataSlot(start, end)}
          setStartOd={setStartOd}
          setEndDo={setEndDo}
          setStatus={setStatus}
          setTypeSlot={setTypeSlot}
        />
        {errorLoad && <ErrorBanner msg={errorLoad} />}
      </div>

      {/* ===== Main Table Section ===== */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 overflow-hidden">
        {errorDock && <ErrorBanner msg={errorDock} compact />}
        {errorStatus && <ErrorBanner msg={errorStatus} compact />}
        {errorApprove && <ErrorBanner msg={errorApprove} compact />}
        
        <TableAdminSlot
          columns={[t('start', lang), t('end', lang), t('type', lang), t('status', lang), t('dock', lang), t('company', lang), t('action', lang)]}
          rows={slotsAdmin}
          docks={dockAdmin}
          onDockChange={onDockChange}
          onStatusChange={onStatusChange}
          onApprove={onApprove}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared UI Components (matching ClientBooking)                        */
/* ------------------------------------------------------------------ */

function ErrorBanner({ msg, compact }: { msg: string; compact?: boolean }) {
  return (
    <div className={`flex items-center gap-3 bg-red-50 border border-red-300 text-red-700 rounded-xl px-5 py-3 shadow-sm ${compact ? "text-sm mb-4" : "mt-2"}`}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {msg}
    </div>
  );
}

