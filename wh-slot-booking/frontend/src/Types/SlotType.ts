export type SlotType = "INBOUND" | "OUTBOUND" | "ANY";

export interface Slot {
  id: number;
  start_dt: string;
  end_dt: string;
  slot_type: "INBOUND" | "OUTBOUND" | "ANY";
  original_slot_type: "INBOUND" | "OUTBOUND" | "ANY";
  status: "AVAILABLE" | "RESERVED" | "CANCELLED";
  dock_id: number;
  dock_alias: string;
  reserved_by_user_id: number;
  reserved_by_alias: string;
  reserved_by_company_alias: string;
}
