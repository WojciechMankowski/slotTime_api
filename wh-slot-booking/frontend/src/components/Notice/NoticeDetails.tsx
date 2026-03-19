import React from 'react'
import { Lang, t } from '../../Helper/i18n'
import type { NoticeData } from '../../Types/NoticeType'

interface Props {
  lang: Lang
  notice: NoticeData
  colSpan: number
}

export default function NoticeDetails({ lang, notice, colSpan }: Props) {
  // Klucze bez * (widok tylko do odczytu, nie formularz)
  const fields: Array<{ labelKey: string; value: string | number | null }> = [
    { labelKey: 'notice_order_number', value: notice.numer_zlecenia },
    { labelKey: 'notice_vehicle_reg',  value: notice.rejestracja_auta },
    { labelKey: 'notice_trailer_reg',  value: notice.rejestracja_naczepy },
    { labelKey: 'notice_pallet_count', value: notice.ilosc_palet },
    { labelKey: 'notice_driver_name',  value: notice.kierowca_imie_nazwisko },
    { labelKey: 'notice_driver_phone', value: notice.kierowca_tel },
    { labelKey: 'notice_notes',        value: notice.uwagi },
  ]

  return (
    <tr>
      <td colSpan={colSpan} className="px-0 py-0">
        <div className="bg-blue-50/60 border-t border-b border-blue-100 px-6 py-4">
          <div className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-3">
            {t('notice_details', lang)}
          </div>

          {/* Referencja osobno - szersze pole */}
          <div className="mb-3">
            <div className="text-[0.75rem] text-gray-500 font-medium mb-0.5">
              {t('notice_reference', lang)}
            </div>
            <div className="text-sm text-gray-900 font-medium">
              {notice.referencja || <span className="text-gray-300 italic">-</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
            {fields.map(({ labelKey, value }) => (
              <div key={labelKey}>
                <div className="text-[0.75rem] text-gray-500 font-medium mb-0.5">
                  {t(labelKey as keyof typeof t, lang)}
                </div>
                <div className="text-sm text-gray-900 font-medium">
                  {value ?? <span className="text-gray-300 italic">-</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </td>
    </tr>
  )
}