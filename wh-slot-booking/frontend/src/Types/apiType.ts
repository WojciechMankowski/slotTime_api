import { DayReport } from "./DayReport";

export interface SlotGenerateResponse {
  generated_count: number;
  skipped_due_to_capacity: number;
  days: DayReport[];
}

export interface AssignDockResponse {
  id: number;
  dock_id: number;
  dock_alias: string | null;
}
export interface CompanyResponse {
  id: number;
  name: string;
  alias: string;
  is_active: boolean;
}
