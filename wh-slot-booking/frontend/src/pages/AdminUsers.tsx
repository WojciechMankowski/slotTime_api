import React, { useEffect, useState } from 'react'
import { api } from '../API/api'
import { t, Lang, errorText } from '../Helper/i18n'
import type { UserOut, Company } from '../Types/types'

export default function AdminUsers({ lang }: { lang: Lang }) {
  const [items, setItems] = useState<UserOut[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [username, setUsername] = useState('newclient')
  const [password, setPassword] = useState('pass')
  const [alias, setAlias] = useState('New User')
  const [role, setRole] = useState<'client' | 'admin'>('client')
  const [companyId, setCompanyId] = useState<number | ''>('')
  const [err, setErr] = useState<string | null>(null)

  const load = async () => {
    const [u, c] = await Promise.all([api.get('/api/users'), api.get('/api/companies')])
    setItems(u.data)
    setCompanies(c.data)
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    setErr(null)
    try {
      const payload: any = { username, password, alias, role }
      if (role === 'client') payload.company_id = companyId || null
      const res = await api.post('/api/users', payload)
      setItems([...items, res.data])
      setUsername('newclient')
      setPassword('pass')
      setAlias('New User')
      setCompanyId('')
    } catch (ex: any) {
      const detail = ex?.response?.data?.detail
      const code = detail?.error_code || 'ERROR'
      const field = detail?.field ? ` (${detail.field})` : ''
      setErr((errorText[code] ? errorText[code][lang] : code) + field)
    }
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>{t('users', lang)}</h2>

      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 10 }}>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" />
        <input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="alias" />
        <select value={role} onChange={(e) => setRole(e.target.value as any)}>
          <option value="client">client</option>
          <option value="admin">admin</option>
        </select>
        {role === 'client' && (
          <select value={companyId} onChange={(e) => setCompanyId(Number(e.target.value))}>
            <option value="">company...</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.alias} - {c.name}</option>)}
          </select>
        )}
        <button onClick={create}>{t('create', lang)}</button>
      </div>

      {err && <div style={{ background: '#fee', padding: 10, border: '1px solid #f99', marginBottom: 10 }}>{err}</div>}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Username</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Alias</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Role</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Company</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Warehouse</th>
          </tr>
        </thead>
        <tbody>
          {items.map(u => (
            <tr key={u.id}>
              <td style={{ borderBottom: '1px solid #f0f0f0' }}>{u.username}</td>
              <td style={{ borderBottom: '1px solid #f0f0f0' }}>{u.alias}</td>
              <td style={{ borderBottom: '1px solid #f0f0f0' }}>{u.role}</td>
              <td style={{ borderBottom: '1px solid #f0f0f0' }}>{u.company_alias || '-'}</td>
              <td style={{ borderBottom: '1px solid #f0f0f0' }}>{u.warehouse_alias || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 10, fontSize: 12, color: '#555' }}>
        Response stabilny: warehouse_id/company_id optional; UI pokazuje aliasy.
      </div>
    </div>
  )
}
