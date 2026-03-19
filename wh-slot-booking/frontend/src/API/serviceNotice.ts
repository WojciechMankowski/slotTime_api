import { api } from './api'
import type { SlotWithNotice } from '../Types/NoticeType'

interface GetNoticesParams {
  dateFrom: string
  dateTo: string
  status?: string
  companyAlias?: string
}

export const getNotices = async (params: GetNoticesParams): Promise<SlotWithNotice[]> => {
  const query: Record<string, string> = {
    date_from: params.dateFrom,
    date_to: params.dateTo,
  }

  if (params.status && params.status !== '--') {
    query.status = params.status
  }
  if (params.companyAlias && params.companyAlias !== '--') {
    query.company_alias = params.companyAlias
  }

  const res = await api.get<SlotWithNotice[]>('/api/slots/notices', { params: query })
  return res.data
}

export const getNotice = async (slotId: number): Promise<SlotWithNotice> => {
  const res = await api.get<SlotWithNotice>(`/api/slots/${slotId}/notice`)
  return res.data
}