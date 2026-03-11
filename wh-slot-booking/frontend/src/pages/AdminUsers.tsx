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
    <div className="bg-white rounded-xl border border-[var(--border)] shadow-sm p-5 mb-6">
      <h2 className="text-xl font-bold mt-0 mb-4">{t('users', lang)}</h2>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2 mb-4">
        <input 
          className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-sm bg-gray-50 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600/15"
          value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
        <input 
          className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-sm bg-gray-50 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600/15"
          value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" />
        <input 
          className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-sm bg-gray-50 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600/15"
          value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="alias" />
        <select 
          className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-sm bg-gray-50 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600/15"
          value={role} onChange={(e) => setRole(e.target.value as any)}>
          <option value="client">client</option>
          <option value="admin">admin</option>
        </select>
        {role === 'client' && (
          <select 
            className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-sm bg-gray-50 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600/15"
            value={companyId} onChange={(e) => setCompanyId(Number(e.target.value))}>
            <option value="">company...</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.alias} - {c.name}</option>)}
          </select>
        )}
        <button 
          className="bg-white border border-[var(--border)] text-[var(--text-main)] rounded-full px-4 py-1.5 text-sm font-medium cursor-pointer transition-all duration-200 hover:border-gray-400 hover:-translate-y-[1px] active:translate-y-0"
          onClick={create}
        >
          {t('create', lang)}
        </button>
      </div>

      {err && (
        <div className="bg-red-50 text-red-700 px-3 py-2.5 rounded-lg border border-red-200 mb-4 text-sm">
          {err}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[0.85rem] text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Username</th>
              <th className="px-4 py-3 font-semibold">Alias</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Company</th>
              <th className="px-4 py-3 font-semibold">Warehouse</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2.5">{u.username}</td>
                <td className="px-4 py-2.5">{u.alias}</td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wide border ${u.role === 'admin' ? 'bg-purple-50 text-purple-800 border-purple-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-2.5">{u.company_alias || '-'}</td>
                <td className="px-4 py-2.5">{u.warehouse_alias || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-[12px] text-gray-500 text-center">
        Response stabilny: warehouse_id/company_id optional; UI pokazuje aliasy.
      </div>
    </div>
  )
}
