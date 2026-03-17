import { api } from "./api";
import { DokTyp } from "../Types/DokType";
import { Me } from "../Types/types";

export const getDokAdmin = async (): Promise<DokTyp[]> => {
  try {
    const res = await api.get<DokTyp[]>("/api/docks");
    return res.data;
  } catch (error) {
    console.error("Błąd podczas pobierania dokumentów admina:", error);
    throw error;
  }
};

export const createDock = async (payload: {
  name: string;
  alias: string;
  is_active?: boolean;
}): Promise<DokTyp> => {
  const res = await api.post<DokTyp>("/api/docks", payload);
  return res.data;
};

export const patchDock = async (dockId: number, payload: DokTyp): Promise<DokTyp> => {
  const res = await api.patch<DokTyp>(`/api/docks/${dockId}`, payload)
  return res.data
}