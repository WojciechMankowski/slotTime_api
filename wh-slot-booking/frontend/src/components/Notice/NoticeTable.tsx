import React from 'react'
import { Lang, t } from '../../Helper/i18n'
import type { SlotWithNotice } from '../../Types/NoticeType'
import NoticeDetails from './NoticeDetails'

interface Props {
  lang: Lang
  notices: SlotWithNotice[]
  isExpanded: (id: number) => boolean
  onToggle: (id: number) => void
}

function formatDt(dt: string): string {
  return new Date(dt).toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Mapowanie enum -> klucz i18n
const STATUS_I18N: Record<string, string> = {
  AVAILABLE: 'available',
  BOOKED: 'booked',
  APPROVED_WAITING_DETAILS: 'approved_waiting_details',
  RESERVED_CONFIRMED: 'reserved_confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

const TYPE_I18N: Record<string, string> = {
  INBOUND: 'inbound',
  OUTBOUND: 'outbound',
  ANY: 'any',
}

const STATUS_COLORS: Record<string, string> = {
  RESERVED_CONFIRMED: 'bg-green-50 text-green-800 border-green-200',
  APPROVED_WAITING_DETAILS: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  BOOKED: 'bg-blue-50 text-blue-800 border-blue-200',
  COMPLETED: 'bg-gray-100 text-gray-600 border-gray-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
}

const TYPE_COLORS: Record<string, string> = {
  INBOUND: 'text-blue-700 bg-blue-50',
  OUTBOUND: 'text-orange-700 bg-orange-50',
  ANY: 'text-gray-600 bg-gray-100',
}

const COLUMNS_COUNT = 8

export default function NoticeTable({ lang, notices, isExpanded, onToggle }: Props) {
  if (notices.length === 0) {
    return (
      <div className="text-center text-gray-400 italic py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
        {t('no_notices', lang)}
      </div>
    )
  }

  const translateStatus = (raw: string) => {
    const key = STATUS_I18N[raw]
    return key ? t(key as keyof typeof t, lang) : raw
  }

  const translateType = (raw: string) => {
    const key = TYPE_I18N[raw]
    return key ? t(key as keyof typeof t, lang) : raw
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[0.85rem] text-left">
        <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
          <tr>
            <th className="px-4 py-3 font-semibold w-8"></th>
            <th className="px-4 py-3 font-semibold">{t('date', lang)}</th>
            <th className="px-4 py-3 font-semibold">{t('start', lang)} / {t('end', lang)}</th>
            <th className="px-4 py-3 font-semibold">{t('type', lang)}</th>
            <th className="px-4 py-3 font-semibold">{t('status', lang)}</th>
            <th className="px-4 py-3 font-semibold">{t('company', lang)}</th>
            <th className="px-4 py-3 font-semibold">{t('reserved_by', lang)}</th>
            <th className="px-4 py-3 font-semibold">{t('dock', lang)}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {notices.map(slot => {
            const expanded = isExpanded(slot.id)
            const statusClass = STATUS_COLORS[slot.status] || 'bg-gray-50 text-gray-700 border-gray-200'
            const typeClass = TYPE_COLORS[slot.slot_type] || 'text-gray-600 bg-gray-100'

            return (
              <React.Fragment key={slot.id}>
                <tr
                  className={`cursor-pointer transition-colors ${
                    expanded ? 'bg-blue-50/30' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => onToggle(slot.id)}
                >
                  <td className="px-4 py-2.5 text-center">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`inline-block transition-transform duration-200 text-gray-400 ${
                        expanded ? 'rotate-90' : ''
                      }`}
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </td>
                  <td className="px-4 py-2.5 font-medium">
                    {new Date(slot.start_dt).toLocaleDateString('pl-PL')}
                  </td>
                  <td className="px-4 py-2.5">
                    {formatDt(slot.start_dt).split(', ')[1]} - {formatDt(slot.end_dt).split(', ')[1]}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${typeClass}`}>
                      {translateType(slot.slot_type)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border tracking-wide ${statusClass}`}
                    >
                      {translateStatus(slot.status)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-medium">
                    {slot.reserved_by_company_alias || '-'}
                  </td>
                  <td className="px-4 py-2.5">
                    {slot.reserved_by_alias || '-'}
                  </td>
                  <td className="px-4 py-2.5">
                    {slot.dock_alias || '-'}
                  </td>
                </tr>

                {expanded && (
                  <NoticeDetails
                    lang={lang}
                    notice={slot.notice}
                    colSpan={COLUMNS_COUNT}
                  />
                )}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}