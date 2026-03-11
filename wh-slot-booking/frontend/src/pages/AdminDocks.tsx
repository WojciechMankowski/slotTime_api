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
    <div className="bg-white rounded-xl border border-[var(--border)] shadow-sm p-5 mb-6">
      <h2 className="text-xl font-bold mt-0 mb-4">{t('docks', lang)}</h2>
      <div className="flex gap-2 flex-wrap items-center mb-4">
        <input 
          className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-sm bg-gray-50 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600/15"
          value={name} onChange={(e) => setName(e.target.value)} placeholder="name" 
        />
        <input 
          className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-sm bg-gray-50 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600/15"
          value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="alias" 
        />
        <label className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
          <input 
            type="checkbox" 
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-600 cursor-pointer"
            checked={isActive} 
            onChange={(e) => setIsActive(e.target.checked)} 
          />
          {t('is_active', lang)}
        </label>
        <button 
          className="bg-white border border-[var(--border)] text-[var(--text-main)] rounded-full px-4 py-1.5 text-sm font-medium cursor-pointer transition-all duration-200 hover:border-gray-400 hover:-translate-y-[1px] active:translate-y-0 ml-1"
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
            {items.map(d => (
              <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2.5">{d.alias}</td>
                <td className="px-4 py-2.5">{d.name}</td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border uppercase tracking-wide ${d.is_active ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                    {d.is_active ? 'true' : 'false'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-[12px] text-gray-500 text-center">
        Client widzi tylko aktywne docki (AC-DCK2).
      </div>
    </div>
  )
}
