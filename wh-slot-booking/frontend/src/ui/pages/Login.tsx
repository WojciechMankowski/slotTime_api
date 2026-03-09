import React, { useState } from 'react'
import { api, setToken } from '../api'
import { t, Lang, errorText } from '../i18n'

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
      className="login-bg"
      style={{ backgroundImage: 'url(/logo-MCG-background.png)' }}   // ← TU PODMIENIASZ ZDJĘCIE
    >
      <div className="login-overlay">
        <div className="card login-card">
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <img
              src="/static/MCG-logo.png"
              alt="Logo"
              style={{ height: 52, marginBottom: 8 }}
            />
            <h2 style={{ margin: '0 0 4px' }}>
              {t('login_title', lang)}
            </h2>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              System awizacji i slotów czasowych
            </div>
          </div>

          <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
            <div>
              <label htmlFor="username">{t('username', lang)}</label>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="password">{t('password', lang)}</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="primary"
              disabled={loading}
              style={{ marginTop: 6 }}
            >
              {loading ? '...' : t('sign_in', lang)}
            </button>

            {err && (
              <div
                style={{
                  color: 'var(--danger)',
                  fontSize: 13,
                  textAlign: 'center',
                  marginTop: 4,
                }}
              >
                {err}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
