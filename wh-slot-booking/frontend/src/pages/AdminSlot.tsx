import React, { useState } from "react";
import { Lang, t } from "../Helper/i18n";
import SlotForm from "../components/Forms/SlotForms";
import FilterSlotAdmin from "../components/FilertSlotAdmin";
import TableAdminSlot from "../components/Admin/AdminSlotTable";
import { getSlotsAdmin, assignDock, createSlot, patchSlot } from "../API/serviceSlot";
import { Slot } from "../Types/SlotType";
import { getDokAdmin } from "../API/serviceDok";
import { DokTyp } from "../Types/DokType";
import axios from "axios";

function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;

    // FastAPI zwraca { error_code: "...", field?: "..." }
    if (detail?.error_code) {
      const field = detail.field ? ` (${detail.field})` : "";
      return `${detail.error_code}${field}`;
    }

    // Czasem detail to po prostu string
    if (typeof detail === "string") return detail;

    // Standardowe kody HTTP
    const status = error.response?.status;
    if (status === 401) return "Sesja wygasła - zaloguj się ponownie";
    if (status === 403) return "Brak uprawnień do tej operacji";
    if (status === 404) return "Nie znaleziono zasobu";
    if (status === 409) return "Konflikt danych - odśwież i spróbuj ponownie";

    return error.message || "Błąd połączenia z serwerem";
  }

  return "Wystąpił nieoczekiwany błąd";
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
      setErrorLoad(getApiErrorMessage(error));
    }
  };

  const onDockChange = async (slotId: number, newDock: number) => {
    setErrorDock(null);

    try {
      await assignDock(slotId, newDock);
      // odśwież tabelę po udanym przypisaniu
      await loadDataSlot(startOd, endDo);
    } catch (error) {
      setErrorDock(getApiErrorMessage(error));
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
      setErrorStatus(getApiErrorMessage(error));
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
      setErrorCreate(getApiErrorMessage(error));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <div className="w-full bg-white p-6 rounded-md shadow-sm mt-4">
        <SlotForm serverError={errorCreate} />
      </div>

      <div className="w-full bg-white p-6 rounded-md shadow-sm mt-4">
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
        {errorLoad && <p className="text-red-600 text-sm mt-2">{errorLoad}</p>}
      </div>

      <div className="w-full bg-white p-6 rounded-md shadow-sm mt-4">
        {errorDock && <p className="text-red-600 text-sm mb-2">{errorDock}</p>}
        {errorStatus && <p className="text-red-600 text-sm mb-2">{errorStatus}</p>}
        <TableAdminSlot
          columns={[t('start', lang), t('end', lang), t('type', lang), t('status', lang), t('dock', lang), t('company', lang), t('reservation', lang)]}
          rows={slotsAdmin}
          docks={dockAdmin}
          onDockChange={onDockChange}
          onStatusChange={onStatusChange}
        />
      </div>
    </>
  );
}

