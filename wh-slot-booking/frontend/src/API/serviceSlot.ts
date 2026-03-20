import { api } from "./api";
import { Slot } from "../Types/SlotType";
import { SlotType } from "../Types/SlotType";
import { AssignDockResponse, SlotGenerateResponse } from "../Types/apiType";
import { calculateEndDate } from "../Helper/calculateEndDate";

export const getSlotsAdmin = async (
  dateFrom: string,
  dateTo: string,
): Promise<Slot[]> => {
  try {
    const res = await api.get<Slot[]>("/api/slots", {
      params: { date_from: dateFrom, date_to: dateTo },
    });
    return res.data;
  } catch (error) {
    console.error("Błąd pobierania slotów:", error);
    throw error;
  }
};

export const assignDock = async (
  slotId: number,
  dockId: number,
): Promise<AssignDockResponse> => {
  try {
    const res = await api.post<AssignDockResponse>(
      `/api/slots/${slotId}/assign-dock`,
      { dock_id: dockId },
    );
    return res.data;
  } catch (error) {
    console.error(`Błąd przypisania doku ${dockId} do slotu ${slotId}:`, error);
    throw error;
  }
};

export const createSlot = async (
  dateFrom: string,
  timeFrom: string,
  timeTo: string,
  slotType: SlotType,
  intervalMinutes: number,
  parallelSlots: number = 1,
): Promise<SlotGenerateResponse> => {
  const dateTo = calculateEndDate(dateFrom, timeFrom, timeTo);

  try {
    const res = await api.post<SlotGenerateResponse>("/api/slots/generate", {
      date_from: dateFrom,
      date_to: dateTo,
      start_time: timeFrom,
      end_time: timeTo,
      interval_minutes: intervalMinutes,
      slot_type: slotType,
      parallel_slots: parallelSlots,
      template_id: null,
    });
    return res.data;
  } catch (error) {
    console.error("Błąd generowania slotów:", error);
    throw error;
  }
};

export const patchSlot = async (slotId: number, payload: Slot): Promise<Slot> => {
  console.log(`Wywołanie api dla id: ${slotId}`)
  const res = await api.patch<Slot>(`/api/slots/${slotId}`, payload)
  return res.data
}

export const reserveSlot = async (slotId: number, payload: Slot): Promise<Slot> => {
  const res = await api.post<Slot>(`/api/slots/${slotId}/reserve`, payload)
  return res.data
}

export const approveSlot = async (slotId: number): Promise<Slot> => {
  const res = await api.post<Slot>(`/api/slots/${slotId}/approve`)
  return res.data
}


export const cancelSlot = async (slotId: number): Promise<Slot> => {
  const res = await api.post<Slot>(`/api/slots/${slotId}/cancel`)
  return res.data
}

export const requestCancelSlot = async (slotId: number): Promise<Slot> => {
  const res = await api.post<Slot>(`/api/slots/${slotId}/request-cancel`)
  return res.data
}

export const rejectCancelSlot = async (slotId: number): Promise<Slot> => {
  const res = await api.post<Slot>(`/api/slots/${slotId}/reject-cancel`)
  return res.data
}

export const getArchiveSlots = async (params: {
  status?: string;
  date_from?: string;
  date_to?: string;
}): Promise<Slot[]> => {
  const res = await api.get<Slot[]>("/api/slots/archive", { params });
  return res.data;
}

export const patchSlotStatus = async (slotId: number, status: string): Promise<Slot> => {
  const res = await api.patch<Slot>(`/api/slots/${slotId}/status`, { status });
  return res.data;
};

export interface NoticePayload {
  numer_zlecenia: string;
  referencja: string;
  rejestracja_auta: string;
  rejestracja_naczepy: string;
  ilosc_palet: number;
  kierowca_imie_nazwisko?: string;
  kierowca_tel?: string;
  uwagi?: string;
}

export const postNotice = async (slotId: number, payload: NoticePayload): Promise<NoticePayload> => {
  const res = await api.post<NoticePayload>(`/api/slots/${slotId}/notice`, payload)
  return res.data
}

export const getNotice = async (slotId: number): Promise<NoticePayload> => {
  const res = await api.get<NoticePayload>(`/api/slots/${slotId}/notice`)
  return res.data
}