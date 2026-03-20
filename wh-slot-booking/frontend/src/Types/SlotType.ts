export type SlotType = "INBOUND" | "OUTBOUND" | "ANY" | "ALL";

export interface Slot {
  id: number;
  start_dt: string;
  end_dt: string;
  slot_type: "INBOUND" | "OUTBOUND" | "ANY";
  original_slot_type: "INBOUND" | "OUTBOUND" | "ANY";
  status: "AVAILABLE" | "BOOKED" | "APPROVED_WAITING_DETAILS" | "RESERVED_CONFIRMED" | "COMPLETED" | "CANCELLED" | "CANCEL_PENDING";
  dock_id: number | null;
  dock_alias: string | null;
  reserved_by_user_id: number | null;
  reserved_by_alias: string | null;
  reserved_by_company_alias: string | null;
  reserved_by_company_name: string | null;
}


type SlotTypeFilter = "ALL" | "INBOUND" | "OUTBOUND" | "ANY";
export type Tab = "available" | "my";
