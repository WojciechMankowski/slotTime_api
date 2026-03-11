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
    <div className="bg-white rounded-xl border border-[var(--border)] shadow-sm p-5 mb-6">
      <h2 className="text-xl font-bold mt-0 mb-4">{t('companies', lang)}</h2>
      <div className="flex gap-2 flex-wrap mb-4">
        <input 
          className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-sm bg-gray-50 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600/15"
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="name" 
        />
        <input 
          className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-sm bg-gray-50 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600/15"
          value={alias} 
          onChange={(e) => setAlias(e.target.value)} 
          placeholder="alias (optional)" 
        />
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
              <th className="px-4 py-3 font-semibold">Alias</th>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">{t('is_active', lang)}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(c => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2.5">{c.alias}</td>
                <td className="px-4 py-2.5">{c.name}</td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border uppercase tracking-wide ${c.is_active ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                    {c.is_active ? 'true' : 'false'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
