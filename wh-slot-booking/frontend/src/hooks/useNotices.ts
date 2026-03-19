import { useState, useCallback } from 'react'
import type { SlotWithNotice, NoticeFilters } from '../Types/NoticeType'
import { getNotices } from '../API/serviceNotice'
import axios from 'axios'

interface UseNoticesReturn {
  notices: SlotWithNotice[]
  loading: boolean
  error: string | null
  load: (filters: NoticeFilters) => Promise<void>
}

function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail
    if (detail?.error_code) {
      return detail.error_code
    }
    if (typeof detail === 'string') return detail

    const status = err.response?.status
    if (status === 401) return 'SESSION_EXPIRED'
    if (status === 403) return 'FORBIDDEN'
    if (status === 404) return 'NOT_FOUND'
  }
  return 'UNKNOWN_ERROR'
}

export function useNotices(): UseNoticesReturn {
  const [notices, setNotices] = useState<SlotWithNotice[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (filters: NoticeFilters) => {
    setLoading(true)
    setError(null)

    try {
      const data = await getNotices({
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        status: filters.status,
        companyAlias: filters.companyAlias,
      })
      setNotices(data)
    } catch (err) {
      setError(extractErrorMessage(err))
      setNotices([])
    } finally {
      setLoading(false)
    }
  }, [])

  return { notices, loading, error, load }
}
