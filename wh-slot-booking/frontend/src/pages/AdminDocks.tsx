import React, { useEffect, useState } from 'react'
import { api } from '../API/api'
import { t, Lang, errorText } from '../Helper/i18n'
import type { Dock } from '../Types/types'

export default function AdminDocks({ lang }: { lang: Lang }) {
  const [items, setItems] = useState<Dock[]>([])
  const [name, setName] = useState('Dock X')
  const [alias, setAlias] = useState('X')
  const [isActive, setIsActive] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const load = async () => {
    const res = await api.get('/api/docks')
    setItems(res.data)
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    setErr(null)
    try {
      const res = await api.post('/api/docks', { name, alias, is_active: isActive })
      setItems([...items, res.data])
      setName('Dock X'); setAlias('X'); setIsActive(true)
    } catch (ex: any) {
      const code = ex?.response?.data?.detail?.error_code || 'ERROR'
      setErr((errorText[code] ? errorText[code][lang] : code))
    }
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>{t('docks', lang)}</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="name" />
        <input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="alias" />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          {t('is_active', lang)}
        </label>
        <button onClick={create}>{t('create', lang)}</button>
      </div>
      {err && <div style={{ background: '#fee', padding: 10, border: '1px solid #f99', marginBottom: 10 }}>{err}</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Alias</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Name</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>{t('is_active', lang)}</th>
          </tr>
        </thead>
        <tbody>
          {items.map(d => (
            <tr key={d.id}>
              <td style={{ borderBottom: '1px solid #f0f0f0' }}>{d.alias}</td>
              <td style={{ borderBottom: '1px solid #f0f0f0' }}>{d.name}</td>
              <td style={{ borderBottom: '1px solid #f0f0f0' }}>{d.is_active ? 'true' : 'false'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 10, fontSize: 12, color: '#555' }}>
        Client widzi tylko aktywne docki (AC-DCK2).
      </div>
    </div>
  )
}
