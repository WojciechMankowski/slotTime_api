export interface NoticeData {
  numer_zlecenia: string
  referencja: string
  rejestracja_auta: string
  rejestracja_naczepy: string
  ilosc_palet: number
  kierowca_imie_nazwisko: string | null
  kierowca_tel: string | null
  uwagi: string | null
}

export interface SlotWithNotice {
  id: number
  start_dt: string
  end_dt: string
  slot_type: 'INBOUND' | 'OUTBOUND' | 'ANY'
  original_slot_type: 'INBOUND' | 'OUTBOUND' | 'ANY'
  status: string
  dock_id: number | null
  dock_alias: string | null
  reserved_by_user_id: number | null
  reserved_by_alias: string | null
  reserved_by_company_alias: string | null
  notice: NoticeData
}

export interface NoticeFilters {
  dateFrom: string
  dateTo: string
  status: string
  companyAlias: string
}