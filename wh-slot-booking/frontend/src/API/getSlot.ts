import { api } from "./api";
import { Slot } from "../Types/types";

export const getSlotsAdmin = async (dateFrom: string, dateTo: string) => {
  const res = await api.get("/api/slots", {
    params: { date_from: dateFrom, date_to: dateTo },
  });
  //   console.table(res.data);
  return res.data;
};

export const assignDock = async (slotID: number, dockId: number) => {
  const res = await api.post(`/api/slots/${slotID}/assign-dock`, {
    dock_id: dockId,
  });
  //   console.table(res.data);
  return res.data;
};
