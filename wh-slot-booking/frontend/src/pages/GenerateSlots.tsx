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
    <div>
      <h2 className="text-2xl font-bold mb-6">Generowanie slotów</h2>

      {/* ===============================
          TWO COLUMNS
      =============================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ===============================
            LEFT – PARAMETERS
        =============================== */}
        <div className="bg-white rounded-xl border border-[var(--border)] shadow-sm p-6">
          <h3 className="text-lg font-bold mt-0 mb-4">Parametry slotów</h3>

          <div className="flex flex-col gap-1 mb-4">
            <label className="text-[0.85rem] text-[var(--text-muted)] font-medium">Szablon (opcjonalnie)</label>
            <select
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] text-sm bg-gray-50 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600/15"
              value={selectedTemplateId ?? ''}
              onChange={e =>
                setSelectedTemplateId(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">— brak —</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <hr className="border-t border-[var(--border)] my-5" />

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col gap-1">
              <label className="text-[0.85rem] text-[var(--text-muted)] font-medium">Data od</label>
              <input type="date" className="w-full px-3 py-2 rounded-lg border border-[var(--border)] text-sm bg-gray-50 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600/15" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[0.85rem] text-[var(--text-muted)] font-medium">Data do</label>
              <input type="date" className="w-full px-3 py-2 rounded-lg border border-[var(--border)] text-sm bg-gray-50 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600/15" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[0.85rem] text-[var(--text-muted)] font-medium">Start</label>
              <input type="time" className="w-full px-3 py-2 rounded-lg border border-[var(--border)] text-sm bg-gray-50 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600/15" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[0.85rem] text-[var(--text-muted)] font-medium">Koniec</label>
              <input type="time" className="w-full px-3 py-2 rounded-lg border border-[var(--border)] text-sm bg-gray-50 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600/15" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-[0.85rem] text-[var(--text-muted)] font-medium">Interwał (min)</label>
              <input
                type="number"
                min={5}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] text-sm bg-gray-50 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600/15"
                value={interval}
                onChange={e => setInterval(Number(e.target.value))}
              />
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-[0.85rem] text-[var(--text-muted)] font-medium">Parallel slots</label>
              <input
                type="number"
                min={1}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] text-sm bg-gray-50 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600/15"
                value={parallelSlots}
                onChange={e => setParallelSlots(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 mb-6">
            <label className="text-[0.85rem] text-[var(--text-muted)] font-medium">Typ slotu</label>
            <select className="w-full px-3 py-2 rounded-lg border border-[var(--border)] text-sm bg-gray-50 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600/15" value={slotType} onChange={e => setSlotType(e.target.value as SlotType)}>
              <option value="ANY">ANY</option>
              <option value="INBOUND">INBOUND</option>
              <option value="OUTBOUND">OUTBOUND</option>
            </select>
          </div>

          <button 
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white border-none rounded-lg px-4 py-2.5 text-sm font-medium cursor-pointer transition-all duration-200 shadow-md shadow-blue-600/30 hover:-translate-y-[1px] active:translate-y-0 disabled:opacity-70" 
            onClick={generate} 
            disabled={loading}
          >
            {loading ? 'Generowanie…' : 'Generuj sloty'}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm text-center font-medium">
              {error}
            </div>
          )}
        </div>

        {/* ===============================
            RIGHT – INFO / PLACEHOLDER
        =============================== */}
        <div className="bg-white rounded-xl border border-[var(--border)] shadow-sm p-6">
          <h3 className="text-lg font-bold mt-0 mb-2">Limity dzienne (Inbound / Outbound)</h3>
          <p className="opacity-70 text-sm m-0">
            (tu w kolejnym kroku podepniemy DayCapacity – jak w starym narzędziu)
          </p>
        </div>
      </div>

      {/* ===============================
          REPORT
      =============================== */}
      <div className="bg-white rounded-xl border border-[var(--border)] shadow-sm p-6 mt-6">
        <h3 className="text-lg font-bold mt-0 mb-4">Raport (ostatnia operacja)</h3>

        {report.length === 0 ? (
          <div className="opacity-60 text-sm py-4 italic text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            Brak danych (uruchom generowanie, aby zobaczyć wynik)
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[0.85rem] text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Data</th>
                  <th className="px-4 py-3 font-semibold">Requested</th>
                  <th className="px-4 py-3 font-semibold">Generated</th>
                  <th className="px-4 py-3 font-semibold">Skipped</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {report.map(r => (
                  <tr key={r.date} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 font-medium">{r.date}</td>
                    <td className="px-4 py-2.5">{r.requested}</td>
                    <td className="px-4 py-2.5">
                      <span className={`font-semibold ${r.generated > 0 ? 'text-green-600' : ''}`}>
                        {r.generated}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-orange-500">{r.skipped_due_to_capacity}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                  <td className="px-4 py-3">SUMA</td>
                  <td className="px-4 py-3">{total.requested}</td>
                  <td className="px-4 py-3 text-green-600">{total.generated}</td>
                  <td className="px-4 py-3 text-orange-500">{total.skipped}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
