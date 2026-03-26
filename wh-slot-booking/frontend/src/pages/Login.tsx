import React, { useState } from 'react'
import { api, setToken, setRefreshToken } from '../API/api'
import { t, Lang, errorText } from '../Helper/i18n'

export default function Login({
  lang,
  onLoggedIn,
}: {
  lang: Lang
  onLoggedIn: () => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    setErr(null)
    setLoading(true)
    try {
      const res = await api.post('/api/login', { email, password })
      setToken(res.data.access_token)
      setRefreshToken(res.data.refresh_token)
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
      style={{ backgroundImage: 'url(/logo-MCG-background.png)' }}
    >
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm">
        <div className="w-full max-w-sm mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* Nagłówek karty */}
          <div className="bg-linear-to-br from-blue-600 to-blue-800 px-8 py-6 text-center">
            <img
              src="/static/MCG-logo.png"
              alt="Logo"
              className="h-8 mx-auto mb-3 brightness-0 invert"
            />
            <h2 className="text-lg font-bold text-white tracking-wide">
              {t('login_title', lang)}
            </h2>
            <p className="text-blue-200 text-xs mt-0.5">
              {t('system_subtitle', lang)}
            </p>
          </div>

          {/* Formularz */}
          <div className="px-8 py-7">
            <form onSubmit={submit} className="grid gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {t('email', lang)}
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 focus:bg-white transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {t('password', lang)}
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 focus:bg-white transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-linear-to-r from-blue-600 to-blue-700 text-white border-none rounded-lg px-4 py-2.5 text-sm font-semibold cursor-pointer transition-all duration-200 shadow-md shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/30 hover:-translate-y-px active:translate-y-0 disabled:opacity-60 mt-1"
                disabled={loading}
              >
                {loading ? t('loading', lang) : t('sign_in', lang)}
              </button>

              {err && (
                <div role="alert" className="text-red-600 text-[13px] text-center bg-red-50 border border-red-200 rounded-lg py-2 px-3">
                  {err}
                </div>
              )}
            </form>
          </div>

        </div>
      </div>
    </div>
  )
}
