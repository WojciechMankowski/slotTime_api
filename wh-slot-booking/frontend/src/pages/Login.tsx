import React, { useState } from 'react'
import { api, setToken } from '../API/api'
import { t, Lang, errorText } from '../Helper/i18n'

export default function Login({
  lang,
  onLoggedIn,
}: {
  lang: Lang
  onLoggedIn: () => void
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    setErr(null)
    setLoading(true)
    try {
      const res = await api.post('/api/login', { username, password })
      setToken(res.data.access_token)
      await onLoggedIn()
    } catch (ex: any) {
      const code = ex?.response?.data?.detail?.error_code || 'BAD_CREDENTIALS'
      setErr(errorText[code] ? errorText[code][lang] : code)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center"
      style={{ backgroundImage: 'url(/logo-MCG-background.png)' }}   // ← TU PODMIENIASZ ZDJĘCIE
    >
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100/75 backdrop-blur-[2px]">
        <div className="w-full max-w-[420px] mx-auto bg-white rounded-xl border border-[var(--border)] shadow-lg p-6">
          <div className="text-center mb-4">
            <img
              src="/static/MCG-logo.png"
              alt="Logo"
              className="h-[52px] mx-auto mb-2"
            />
            <h2 className="m-0 mb-1 text-2xl font-bold text-[var(--text-main)]">
              {t('login_title', lang)}
            </h2>
            <div className="text-[var(--text-muted)] text-[13px]">
              {t('system_subtitle', lang)}
            </div>
          </div>

          <form onSubmit={submit} className="grid gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="username" className="text-[0.85rem] text-[var(--text-muted)] block">
                {t('username', lang)}
              </label>
              <input
                id="username"
                className="w-full px-2.5 py-2 rounded-lg border border-[var(--border)] text-sm bg-gray-50 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/15 focus:bg-white"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-[0.85rem] text-[var(--text-muted)] block">
                {t('password', lang)}
              </label>
              <input
                id="password"
                type="password"
                className="w-full px-2.5 py-2 rounded-lg border border-[var(--border)] text-sm bg-gray-50 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/15 focus:bg-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-none rounded-full px-4 py-2 text-sm cursor-pointer transition-all duration-200 shadow-md shadow-blue-600/30 hover:-translate-y-[1px] active:translate-y-0 disabled:opacity-70 mt-1.5 font-medium"
              disabled={loading}
            >
              {loading ? '...' : t('sign_in', lang)}
            </button>

            {err && (
              <div className="text-red-600 text-[13px] text-center mt-1">
                {err}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
