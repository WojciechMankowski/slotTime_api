import { DayReport } from "./DayReport";

export type SlotTypeValue = 'INBOUND' | 'OUTBOUND' | 'ANY'

export interface SlotTemplate {
  id: number
  name: string
  start_hour: number
  end_hour: number
  slot_minutes: number
  slot_type: SlotTypeValue
  is_active: boolean
}

export interface SlotTemplateCreate {
  name: string
  start_hour: number
  end_hour: number
  slot_minutes: number
  slot_type: SlotTypeValue
  is_active: boolean
}

export type SlotTemplatePatch = Partial<SlotTemplateCreate>

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
