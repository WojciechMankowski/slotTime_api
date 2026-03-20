import { useEffect, useState } from 'react'
import { api } from '../API/api'
import { t, Lang, errorText } from '../Helper/i18n'

type SlotType = 'INBOUND' | 'OUTBOUND' | 'ANY'

type Template = {
  id: number
  name: string
  start_hour: number
  end_hour: number
  slot_minutes: number
  slot_type: SlotType
  parallel_slots?: number
}

type ReportRow = {
  date: string
  requested: number
  generated: number
  skipped_due_to_capacity: number
}

export default function GenerateSlots({ lang }: { lang: Lang }) {
  /* ===============================
     TEMPLATES
  =============================== */
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)

  /* ===============================
     COMMON FIELDS (EDITABLE)
  =============================== */
  const today = new Date().toISOString().slice(0, 10)

  const [dateFrom, setDateFrom] = useState(today)
  const [dateTo, setDateTo] = useState(today)

  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('16:00')
  const [interval, setInterval] = useState(30)
  const [slotType, setSlotType] = useState<SlotType>('ANY')
  const [parallelSlots, setParallelSlots] = useState(1)

  /* ===============================
     REPORT
  =============================== */
  const [report, setReport] = useState<ReportRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  /* ===============================
     LOAD TEMPLATES
  =============================== */
  useEffect(() => {
    api.get('/api/templates').then(res => {
      setTemplates(res.data)
    })
  }, [])

  /* ===============================
     APPLY TEMPLATE (EDITABLE!)
  =============================== */
  useEffect(() => {
    if (!selectedTemplateId) return

    const t = templates.find(t => t.id === selectedTemplateId)
    if (!t) return

    setStartTime(`${String(t.start_hour).padStart(2, '0')}:00`)
    setEndTime(`${String(t.end_hour).padStart(2, '0')}:00`)
    setInterval(t.slot_minutes)
    setSlotType(t.slot_type)
    setParallelSlots(t.parallel_slots ?? 1)
  }, [selectedTemplateId, templates])

  /* ===============================
     GENERATE
  =============================== */
  const generate = async () => {
    setError(null)
    setLoading(true)
    setReport([])

    try {
      const res = await api.post('/api/slots/generate', {
        date_from: dateFrom,
        date_to: dateTo,
        start_time: startTime,
        end_time: endTime,
        interval_minutes: interval,
        slot_type: slotType,
        parallel_slots: parallelSlots,
      })

      setReport(res.data.days)
    } catch (e: any) {
      setError(e?.response?.data?.detail?.error_code || 'ERROR')
    } finally {
      setLoading(false)
    }
  }

  const total = report.reduce(
    (acc, r) => {
      acc.requested += r.requested
      acc.generated += r.generated
      acc.skipped += r.skipped_due_to_capacity
      return acc
    },
    { requested: 0, generated: 0, skipped: 0 }
  )

  /* ===============================
     RENDER
  =============================== */
  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      {/* ===== Page header ===== */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          {t("generate_slots", lang)}
        </h1>
        <p className="text-gray-500 text-sm">{t("system_subtitle", lang)} (Admin)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ===============================
            LEFT – PARAMETERS
        =============================== */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden h-fit">
          <div className="bg-linear-to-br from-indigo-600 to-indigo-800 px-7 py-4">
            <h2 className="text-lg font-bold text-white leading-none">
              {t('slot_params', lang)}
            </h2>
          </div>
          
          <div className="p-7">
            <div className="flex flex-col gap-1.5 mb-6">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('template_optional', lang)}</label>
              <select
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                value={selectedTemplateId ?? ''}
                onChange={e =>
                  setSelectedTemplateId(e.target.value ? Number(e.target.value) : null)
                }
              >
                <option value="">{t('none', lang)}</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('date_from', lang)}</label>
                <input type="date" className="w-full px-4 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('date_to', lang)}</label>
                <input type="date" className="w-full px-4 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('start', lang)}</label>
                <input type="time" className="w-full px-4 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('end', lang)}</label>
                <input type="time" className="w-full px-4 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('interval_minutes', lang)}</label>
                <input
                  type="number"
                  min={5}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={interval}
                  onChange={e => setInterval(Number(e.target.value))}
                />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('parallel_slots', lang)}</label>
                <input
                  type="number"
                  min={1}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={parallelSlots}
                  onChange={e => setParallelSlots(Number(e.target.value))}
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('type', lang)}</label>
                <select className="w-full px-4 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white" value={slotType} onChange={e => setSlotType(e.target.value as SlotType)}>
                  <option value="ANY">ANY</option>
                  <option value="INBOUND">INBOUND</option>
                  <option value="OUTBOUND">OUTBOUND</option>
                </select>
              </div>
            </div>

            <button 
              className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl px-6 py-3.5 text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-60" 
              onClick={generate} 
              disabled={loading}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
              </svg>
              {loading ? t('generating', lang) : t('generate_slots', lang)}
            </button>

            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-bold flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {t(error as any, lang) || error}
              </div>
            )}
          </div>
        </div>

        {/* ===============================
            RIGHT – INFO / PLACEHOLDER
        =============================== */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="text-blue-600" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              {t('daily_limits', lang)}
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              {t('daily_limits_desc', lang)}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-hidden">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('report_latest', lang)}</h3>

            {report.length === 0 ? (
              <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <svg className="mx-auto mb-3 opacity-30" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
                </svg>
                <p className="text-xs font-medium">{t('no_data_generate', lang)}</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-[0.65rem] uppercase tracking-widest text-gray-400 font-bold border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-3 font-bold">{t('date', lang)}</th>
                      <th className="px-3 py-3 font-bold">{t('req', lang) || 'REQ'}</th>
                      <th className="px-3 py-3 font-bold">{t('gen', lang) || 'GEN'}</th>
                      <th className="px-3 py-3 font-bold">{t('skip', lang) || 'SKIP'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {report.map(r => (
                      <tr key={r.date} className="hover:bg-gray-50 transition-colors italic-none">
                        <td className="px-3 py-2.5 font-bold text-gray-900">{r.date.slice(5)}</td>
                        <td className="px-3 py-2.5 text-gray-500">{r.requested}</td>
                        <td className="px-3 py-2.5 font-bold text-emerald-600">{r.generated}</td>
                        <td className="px-3 py-2.5 text-orange-500 font-medium">{r.skipped_due_to_capacity}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-black text-gray-900 border-t-2 border-gray-200">
                      <td className="px-3 py-3 uppercase">{t('sum', lang)}</td>
                      <td className="px-3 py-3">{total.requested}</td>
                      <td className="px-3 py-3 text-emerald-700">{total.generated}</td>
                      <td className="px-3 py-3 text-orange-600">{total.skipped}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
