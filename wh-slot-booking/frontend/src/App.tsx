import React, { useEffect, useState } from 'react'
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { api, setToken } from './API/api'
import { getLang, setLang, t, Lang } from './Helper/i18n'
import type { Me } from './Types/types'

import Login from './pages/Login'

import Slots from './pages/Slots'
import AdminCompanies from './pages/AdminCompanies'
import AdminUsers from './pages/AdminUsers'
import AdminDocks from './pages/AdminDocks'
import GenerateSlots from './pages/GenerateSlots'
import Header from './components/Header'


export default function App() {
  const [me, setMe] = useState<Me | null>(null)
  const [lang, setLangState] = useState<Lang>(getLang())
  const nav = useNavigate()

  const loadMe = async () => {
    try {
      const res = await api.get('/api/me')
      setMe(res.data)
    } catch {
      setMe(null)
    }
  }

  useEffect(() => {
    loadMe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onLogout = () => {
    setToken(null)
    setMe(null)
    nav('/login')
  }

  const onLang = (l: Lang) => {
    setLang(l)
    setLangState(l)
  }

  if (!me) {
    return (
      <Routes>
        <Route path="/login" element={<Login lang={lang} onLoggedIn={loadMe} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h4>Menu</h4>

        <NavLink to="/slots">{t('slots', lang)}</NavLink>

        {me.role !== 'client' && (
          <>
            <NavLink to="/generate">Generowanie slotów</NavLink>
            <NavLink to="/admin/companies">{t('companies', lang)}</NavLink>
            <NavLink to="/admin/users">{t('users', lang)}</NavLink>
            <NavLink to="/admin/docks">{t('docks', lang)}</NavLink>
          </>
        )}
      </aside>

      <div className="main">
        <Header me={me} lang={lang} onLang={onLang} onLogout={onLogout} />

        {/* container = max-width dla contentu (tabele, formularze itd.) */}
        <div className="container" style={{ paddingBottom: '2rem' }}>
          <Routes>
            <Route path="/slots" element={<Slots lang={lang} me={me} />} />

            {/* główny route (zgodnie z ustaleniami: /generate) */}
            <Route
              path="/generate"
              element={me.role !== 'client' ? <GenerateSlots lang={lang} /> : <Navigate to="/slots" replace />}
            />

            {/* kompatybilność wstecz: stare ścieżki */}
            <Route path="/admin/generate-slots" element={<Navigate to="/generate" replace />} />
            <Route path="/admin/generateslots" element={<Navigate to="/generate" replace />} />

            <Route
              path="/admin/companies"
              element={me.role !== 'client' ? <AdminCompanies lang={lang} /> : <Navigate to="/slots" replace />}
            />

            <Route
              path="/admin/users"
              element={me.role !== 'client' ? <AdminUsers lang={lang} /> : <Navigate to="/slots" replace />}
            />

            <Route
              path="/admin/docks"
              element={me.role !== 'client' ? <AdminDocks lang={lang} /> : <Navigate to="/slots" replace />}
            />

            <Route path="*" element={<Navigate to="/slots" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}
