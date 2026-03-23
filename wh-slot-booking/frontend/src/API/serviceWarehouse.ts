import { api } from "./api";
import { Warehouse } from "../Types/types";

export interface WarehouseCreate {
  name: string;
  alias: string;
  location?: string;
  is_active: boolean;
}

export type WarehousePatch = Partial<WarehouseCreate>;

export const getWarehouses = async (): Promise<Warehouse[]> => {
  const res = await api.get("/api/warehouses");
  return res.data;
};

export const createWarehouse = async (data: WarehouseCreate): Promise<Warehouse> => {
  const res = await api.post("/api/warehouses", data);
  return res.data;
};

export const patchWarehouse = async (id: number, data: WarehousePatch): Promise<Warehouse> => {
  const res = await api.patch(`/api/warehouses/${id}`, data);
  return res.data;
};

export const deleteWarehouse = async (id: number): Promise<void> => {
  await api.delete(`/api/warehouses/${id}`);
};
