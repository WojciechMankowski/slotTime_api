import React from 'react'
import { Lang, t } from '../../Helper/i18n'
import type { NoticeFilters } from '../../Types/NoticeType'

interface Props {
  lang: Lang
  filters: NoticeFilters
  companies: string[]
  loading: boolean
  onFilterChange: <K extends keyof NoticeFilters>(key: K, value: NoticeFilters[K]) => void
  onApply: () => void
}

const STATUSES = [
  '--',
  'RESERVED_CONFIRMED',
  'APPROVED_WAITING_DETAILS',
  'BOOKED',
  'COMPLETED',
  'CANCELLED',
]

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-[var(--border)] text-sm bg-gray-50 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600/15'

export default function NoticeFiltersBar({
  lang,
  filters,
  companies,
  loading,
  onFilterChange,
  onApply,
}: Props) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-[0.85rem] text-[var(--text-muted)] font-medium">
          {t('date_from', lang)}
        </label>
        <input
          type="date"
          className={inputClass}
          value={filters.dateFrom}
          onChange={e => onFilterChange('dateFrom', e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[0.85rem] text-[var(--text-muted)] font-medium">
          {t('date_to', lang)}
        </label>
        <input
          type="date"
          className={inputClass}
          value={filters.dateTo}
          onChange={e => onFilterChange('dateTo', e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[0.85rem] text-[var(--text-muted)] font-medium">
          {t('status', lang)}
        </label>
        <select
          className={inputClass}
          value={filters.status}
          onChange={e => onFilterChange('status', e.target.value)}
        >
          {STATUSES.map(s => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[0.85rem] text-[var(--text-muted)] font-medium">
          {t('company', lang)}
        </label>
        <select
          className={inputClass}
          value={filters.companyAlias}
          onChange={e => onFilterChange('companyAlias', e.target.value)}
        >
          <option value="--">--</option>
          {companies.map(c => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <button
        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-none rounded-lg px-5 py-2 text-sm font-medium cursor-pointer transition-all duration-200 shadow-md shadow-blue-600/30 hover:-translate-y-[1px] active:translate-y-0 disabled:opacity-70"
        onClick={onApply}
        disabled={loading}
      >
        {loading ? '...' : t('filter_slots', lang)}
      </button>
    </div>
  )
}
