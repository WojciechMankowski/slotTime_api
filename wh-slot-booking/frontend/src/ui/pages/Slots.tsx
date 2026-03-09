import React, { useEffect, useState } from 'react'
import { api } from '../api'
import { t, Lang, errorText } from '../i18n'
import type { Me, Slot, Dock } from '../types' 

function fmt(dt: string) {
  return new Date(dt).toLocaleString()
}

function minutesBetween(start: string, end: string) {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return (eh * 60 + em) - (sh * 60 + sm)
}

export default function Slots({ lang, me }: { lang: Lang; me: Me }) {
  const today = new Date()
  const iso = (d: Date) => d.toISOString().slice(0, 10)

  const [dateFrom, setDateFrom] = useState(iso(today))
  const [dateTo, setDateTo] = useState(iso(today))
  const [items, setItems] = useState<Slot[]>([])
  const [docks, setDocks] = useState<Dock[]>([])
  const [err, setErr] = useState<string | null>(null)

  /* ===== ADMIN: single slot ===== */
  const [singleDate, setSingleDate] = useState(iso(today))
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('09:00')
  const [slotType, setSlotType] =
    useState<'INBOUND' | 'OUTBOUND' | 'ANY'>('INBOUND')
  const [parallelSlots, setParallelSlots] = useState(1)

  const load = async () => {
    setErr(null)
    const res = await api.get('/api/slots', {
      params: { date_from: dateFrom, date_to: dateTo },
    })
    setItems(res.data)
  }

  const loadDocks = async () => {
    try {
      const res = await api.get('/api/docks')
      setDocks(res.data)
    } catch {}
  }

  useEffect(() => {
    load()
    loadDocks()
  }, [])

  /* ===== CREATE SINGLE SLOT (via /generate) ===== */
  const createSingleSlot = async () => {
    setErr(null)

    const interval = minutesBetween(startTime, endTime)
    if (interval <= 0) {
      setErr('Koniec musi być po starcie')
      return
    }

    try {
      await api.post('/api/slots/generate', {
        date_from: singleDate,
        date_to: singleDate,
        start_time: startTime,
        end_time: endTime,
        interval_minutes: interval,
        slot_type: slotType,
        parallel_slots: parallelSlots,
      })

      await load()
    } catch (ex: any) {
      const detail = ex?.response?.data?.detail
      setErr(typeof detail === 'string' ? detail : JSON.stringify(detail))
    }
  }

  return (
    <div>
      <h2>{t('slots', lang)}</h2>

      {/* ===== ADMIN CARD ===== */}
      {me.role !== 'client' && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3>Dodaj slot (pojedynczy)</h3>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
            Tworzenie slotu ręcznie – przez endpoint <code>/generate</code>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input type="date" value={singleDate} onChange={e => setSingleDate(e.target.value)} />
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />

            <select value={slotType} onChange={e => setSlotType(e.target.value as any)}>
              <option value="INBOUND">INBOUND</option>
              <option value="OUTBOUND">OUTBOUND</option>
              <option value="ANY">ANY</option>
            </select>

            <input
              type="number"
              min={1}
              value={parallelSlots}
              onChange={e => setParallelSlots(Number(e.target.value))}
              style={{ width: 90 }}
              title="Równoległe sloty"
            />

            <button className="primary" onClick={createSingleSlot}>
              + Utwórz slot
            </button>
          </div>
        </div>
      )}

      {/* ===== FILTER ===== */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        <button onClick={load}>{t('load', lang)}</button>
      </div>

      {err && (
        <div style={{ background: '#fee', padding: 10, border: '1px solid #f99', marginBottom: 10 }}>
          {err}
        </div>
      )}

      {/* ===== TABLE ===== */}
      <table className="slots-table">
        <thead>
          <tr>
            <th>Start</th>
            <th>Koniec</th>
            <th>Typ</th>
            <th>Status</th>
            <th>Dok</th>
            <th>Rezerwacja</th>
          </tr>
        </thead>
        <tbody>
          {items.map(s => (
            <tr key={s.id}>
              <td>{fmt(s.start_dt)}</td>
              <td>{fmt(s.end_dt)}</td>
              <td>{s.slot_type}</td>
              <td>{s.status}</td>
              <td>{s.dock_alias || '-'}</td>
              <td>
                {s.reserved_by_company_alias
                  ? `${s.reserved_by_company_alias} / ${s.reserved_by_alias}`
                  : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
