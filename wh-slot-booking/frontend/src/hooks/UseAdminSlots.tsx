import { useState, useEffect } from "react";
import {
  getSlotsAdmin,
  assignDock,
  createSlot,
  patchSlot,
  approveSlot,
} from "../API/serviceSlot";
import { getDokAdmin } from "../API/serviceDok";
import { Lang, errorText } from "../Helper/i18n";
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

export default function useAdminSlots(lang: Lang) {
  const now = new Date().toISOString().split("T")[0];

  const [startOd, setStartOd] = useState(now);
  const [endDo, setEndDo] = useState(now);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [docks, setDocks] = useState<DokTyp[]>([]);
  const [typeSlot, setTypeSlot] = useState<string>("--");
  const [status, setStatus] = useState<string>("--");

  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [createErr, setCreateErr] = useState<string | null>(null);
  const [dockErr, setDockErr] = useState<string | null>(null);
  const [statusErr, setStatusErr] = useState<string | null>(null);
  const [approveErr, setApproveErr] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const load = async (start: string, end: string) => {
    setLoadErr(null);
    setStartOd(start);
    setEndDo(end);
    try {
      let [slotsData, docksData] = await Promise.all([
        getSlotsAdmin(start, end),
        getDokAdmin(),
      ]);
      if (typeSlot !== "--") {
        slotsData = slotsData.filter((s) => s.slot_type === typeSlot);
      }
      if (status !== "--") {
        slotsData = slotsData.filter((s) => s.status === status);
      }
      setSlots(slotsData);
      setDocks(docksData);
    } catch (err) {
      setLoadErr(getApiErrorMessage(err, lang));
    }
  };

  useEffect(() => {
    load(now, now);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const reload = () => load(startOd, endDo);

  const onDockChange = async (slotId: number, newDock: number) => {
    setDockErr(null);
    try {
      await assignDock(slotId, newDock);
      await reload();
    } catch (err) {
      setDockErr(getApiErrorMessage(err, lang));
    }
  };

  const onStatusChange = async (slotId: number, newStatus: string) => {
    setStatusErr(null);
    try {
      const slot = slots.find((s) => s.id === slotId);
      if (!slot) return;
      await patchSlot(slotId, { ...slot, status: newStatus as any });
      await reload();
    } catch (err) {
      setStatusErr(getApiErrorMessage(err, lang));
    }
  };

  const onApprove = async (slotId: number) => {
    setApproveErr(null);
    try {
      await approveSlot(slotId);
      await reload();
    } catch (err) {
      setApproveErr(getApiErrorMessage(err, lang));
    }
  };

  const handleCreate = async (formData: {
    dateFrom: string;
    timeFrom: string;
    timeTo: string;
    slotType: "INBOUND" | "OUTBOUND" | "ANY";
    intervalMinutes: number;
    parallelSlots: number;
  }) => {
    setCreateErr(null);
    setIsCreating(true);
    try {
      await createSlot(
        formData.dateFrom,
        formData.timeFrom,
        formData.timeTo,
        formData.slotType,
        formData.intervalMinutes,
        formData.parallelSlots
      );
      await reload();
    } catch (err) {
      setCreateErr(getApiErrorMessage(err, lang));
    } finally {
      setIsCreating(false);
    }
  };

  return {
    slots,
    docks,
    startOd,
    endDo,
    typeSlot,
    status,
    loadErr,
    createErr,
    dockErr,
    statusErr,
    approveErr,
    isCreating,
    setStartOd,
    setEndDo,
    setTypeSlot,
    setStatus,
    load,
    reload,
    onDockChange,
    onStatusChange,
    onApprove,
    handleCreate,
  };
}