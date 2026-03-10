import React, { useEffect, useState } from 'react'
import { api } from '../API/api'
import { t, Lang, errorText } from '../Helper/i18n'
import type { Company } from '../Types/types'

export default function AdminCompanies({ lang }: { lang: Lang }) {
  const [items, setItems] = useState<Company[]>([])
  const [name, setName] = useState('New Company')
  const [alias, setAlias] = useState('')
  const [err, setErr] = useState<string | null>(null)

  const load = async () => {
    const res = await api.get('/api/companies')
    setItems(res.data)
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    setErr(null)
    try {
      const res = await api.post('/api/companies', { name, alias: alias || null, is_active: true })
      setItems([...items, res.data])
      setName('New Company')
      setAlias('')
    } catch (ex: any) {
      const code = ex?.response?.data?.detail?.error_code || 'ERROR'
      setErr((errorText[code] ? errorText[code][lang] : code))
    }
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>{t('companies', lang)}</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="name" />
        <input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="alias (optional)" />
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
          {items.map(c => (
            <tr key={c.id}>
              <td style={{ borderBottom: '1px solid #f0f0f0' }}>{c.alias}</td>
              <td style={{ borderBottom: '1px solid #f0f0f0' }}>{c.name}</td>
              <td style={{ borderBottom: '1px solid #f0f0f0' }}>{c.is_active ? 'true' : 'false'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
