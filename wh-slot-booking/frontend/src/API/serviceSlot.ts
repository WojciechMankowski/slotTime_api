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