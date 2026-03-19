import { useState, useCallback } from 'react'
import type { NoticeFilters } from '../Types/NoticeType'

const today = new Date().toISOString().slice(0, 10)

const DEFAULT_FILTERS: NoticeFilters = {
  dateFrom: today,
  dateTo: today,
  status: '--',
  companyAlias: '--',
}

export function useNoticeFilters(initial?: Partial<NoticeFilters>) {
  const [filters, setFilters] = useState<NoticeFilters>({
    ...DEFAULT_FILTERS,
    ...initial,
  })

  const updateFilter = useCallback(<K extends keyof NoticeFilters>(
    key: K,
    value: NoticeFilters[K],
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  return { filters, updateFilter, resetFilters }
}
