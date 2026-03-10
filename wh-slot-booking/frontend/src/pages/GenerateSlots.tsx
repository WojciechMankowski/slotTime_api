import { useEffect, useState } from 'react'
import { api } from '../API/api'

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

export default function GenerateSlots() {
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
      <h2>Generowanie slotów</h2>

      {/* ===============================
          TWO COLUMNS
      =============================== */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* ===============================
            LEFT – PARAMETERS
        =============================== */}
        <div className="card">
          <h3>Parametry slotów</h3>

          <label>Szablon (opcjonalnie)</label>
          <select
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

          <hr />

          <label>Data od</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />

          <label>Data do</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />

          <label>Start</label>
          <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />

          <label>Koniec</label>
          <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />

          <label>Interwał (min)</label>
          <input
            type="number"
            min={5}
            value={interval}
            onChange={e => setInterval(Number(e.target.value))}
          />

          <label>Typ slotu</label>
          <select value={slotType} onChange={e => setSlotType(e.target.value as SlotType)}>
            <option value="ANY">ANY</option>
            <option value="INBOUND">INBOUND</option>
            <option value="OUTBOUND">OUTBOUND</option>
          </select>

          <label>Parallel slots</label>
          <input
            type="number"
            min={1}
            value={parallelSlots}
            onChange={e => setParallelSlots(Number(e.target.value))}
          />

          <button className="primary" onClick={generate} disabled={loading}>
            {loading ? 'Generowanie…' : 'Generuj sloty'}
          </button>

          {error && (
            <div style={{ marginTop: 10, color: 'red' }}>
              {error}
            </div>
          )}
        </div>

        {/* ===============================
            RIGHT – INFO / PLACEHOLDER
        =============================== */}
        <div className="card">
          <h3>Limity dzienne (Inbound / Outbound)</h3>
          <p style={{ opacity: 0.7 }}>
            (tu w kolejnym kroku podepniemy DayCapacity – jak w starym narzędziu)
          </p>
        </div>
      </div>

      {/* ===============================
          REPORT
      =============================== */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Raport (ostatnia operacja)</h3>

        {report.length === 0 ? (
          <div style={{ opacity: 0.6 }}>Brak danych</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Requested</th>
                <th>Generated</th>
                <th>Skipped</th>
              </tr>
            </thead>
            <tbody>
              {report.map(r => (
                <tr key={r.date}>
                  <td>{r.date}</td>
                  <td>{r.requested}</td>
                  <td>{r.generated}</td>
                  <td>{r.skipped_due_to_capacity}</td>
                </tr>
              ))}
              <tr style={{ fontWeight: 'bold' }}>
                <td>SUMA</td>
                <td>{total.requested}</td>
                <td>{total.generated}</td>
                <td>{total.skipped}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
