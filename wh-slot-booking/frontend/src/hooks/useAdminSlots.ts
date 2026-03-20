import { useState, useEffect } from "react";
import { getSlotsAdmin, assignDock, createSlot, patchSlot, approveSlot, patchSlotStatus, cancelSlot, rejectCancelSlot } from "../API/serviceSlot";
import { getDokAdmin } from "../API/serviceDok";
import { errorText, Lang } from "../Helper/i18n";
import type { Slot } from "../Types/SlotType";
import type { DokTyp } from "../Types/DokType";
import axios from "axios";

function getApiErrorMessage(error: unknown, lang: Lang): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (detail?.error_code) {
      const field = detail.field ? ` (${detail.field})` : "";
      const msg = errorText[detail.error_code]
        ? errorText[detail.error_code][lang]
        : detail.error_code;
      return `${msg}${field}`;
    }
    if (typeof detail === "string") return detail;
    const status = error.response?.status;
    if (status === 401) return errorText.INVALID_TOKEN[lang];
    if (status === 403) return errorText.FORBIDDEN[lang];
    if (status === 404) return errorText.NOT_FOUND[lang];
    if (status === 409) return errorText.DATA_CONFLICT[lang];
    return error.message || errorText.CONNECTION_ERROR[lang];
  }
  return errorText.UNEXPECTED_ERROR[lang];
}

export default function useAdminSlots(lang: Lang, initialDate?: string) {
  const now = new Date().toISOString().split("T")[0];

  const [startOd, setStartOd] = useState(initialDate ?? now);
  const [endDo, setEndDo] = useState(initialDate ?? now);
  const [slotsAdmin, setSlotsAdmin] = useState<Slot[]>([]);
  const [dockAdmin, setDockAdmin] = useState<DokTyp[]>([]);
  const [typeSlot, setTypeSlot] = useState<string>("--");
  const [statusFilter, setStatusFilter] = useState<string>("--");

  const [errorCreate, setErrorCreate] = useState<string | null>(null);
  const [errorLoad, setErrorLoad] = useState<string | null>(null);
  const [errorDock, setErrorDock] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [errorApprove, setErrorApprove] = useState<string | null>(null);
  const [errorCancelAction, setErrorCancelAction] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (initialDate) loadDataSlot(initialDate, initialDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      if (statusFilter !== "--") {
        slots = slots.filter((slot) => slot.status === statusFilter);
      } else {
        slots = slots.filter((slot) => slot.status !== "COMPLETED" && slot.status !== "CANCELLED");
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
      await patchSlotStatus(slotId, newStatus);
      await loadDataSlot(startOd, endDo);
      console.log(`Aktualizacja dla slotu: ${slot.id}`)
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

  const onApproveCancel = async (slotId: number) => {
    setErrorCancelAction(null);
    try {
      await cancelSlot(slotId);
      await loadDataSlot(startOd, endDo);
    } catch (error) {
      setErrorCancelAction(getApiErrorMessage(error, lang));
    }
  };

  const onRejectCancel = async (slotId: number) => {
    setErrorCancelAction(null);
    try {
      await rejectCancelSlot(slotId);
      await loadDataSlot(startOd, endDo);
    } catch (error) {
      setErrorCancelAction(getApiErrorMessage(error, lang));
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
      await loadDataSlot(startOd, endDo);
    } catch (error) {
      setErrorCreate(getApiErrorMessage(error, lang));
    } finally {
      setIsCreating(false);
    }
  };

  return {
    startOd,
    endDo,
    slotsAdmin,
    dockAdmin,
    typeSlot,
    statusFilter,
    errorCreate,
    errorLoad,
    errorDock,
    errorStatus,
    errorApprove,
    errorCancelAction,
    isCreating,
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
  };
}