export type Role = 'superadmin' | 'admin' | 'client'

export interface Warehouse {
  id: number
  name: string
  alias: string
  logo_path?: string | null
}

export interface Company {
  id: number
  name: string
  alias: string
  is_active: boolean
}

export interface Me {
  id: number
  username: string
  alias: string
  role: Role
  company: Company | null
  warehouse: Warehouse
}

export interface Slot {
  id: number
  start_dt: string
  end_dt: string
  slot_type: 'INBOUND'|'OUTBOUND'|'ANY'
  original_slot_type: 'INBOUND'|'OUTBOUND'|'ANY'
  status: 'AVAILABLE'|'BOOKED'|'APPROVED_WAITING_DETAILS'|'RESERVED_CONFIRMED'|'COMPLETED'|'CANCELLED'
  dock_id: number | null
  dock_alias: string | null
  reserved_by_user_id: number | null
  reserved_by_alias: string | null
  reserved_by_company_alias: string | null
}

export interface Dock {
  id: number
  name: string
  alias: string
  is_active: boolean
}

export interface UserOut {
  id: number
  username: string
  alias: string
  role: Role
  warehouse_id: number | null
  company_id: number | null
  company_alias: string | null
  warehouse_alias: string | null
}
