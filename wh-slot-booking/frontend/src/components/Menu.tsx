import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { t, Lang } from '../Helper/i18n'
import { Me } from '../Types/types'

const Menu = ({ lang, me }: { lang: Lang; me: Me }) => {
  const [isOpen, setIsOpen] = useState(false)
  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  const linkBase =
    'flex items-center py-3 px-4 rounded-xl text-[0.95rem] font-medium text-[var(--text-main)] no-underline transition-all duration-200 hover:bg-[var(--accent-soft)] hover:text-[var(--accent-dark)] hover:translate-x-1'
  const linkActive =
    'bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dark)] text-white shadow-lg shadow-blue-600/25 translate-x-1'

  return (
    <>
      <button
        className="bg-transparent border-none rounded-lg cursor-pointer text-[var(--text-main)] p-1.5 flex items-center justify-center transition-all duration-200 mr-1 hover:bg-blue-600/10 hover:text-[var(--accent)]"
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        )}
      </button>

      {/* overlay */}
      <div
        className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[999] transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeMenu}
      />

      {/* sidebar */}
      <aside
        className={`fixed top-0 w-[300px] h-screen bg-[var(--card-bg)] shadow-[4px_0_25px_rgba(15,23,42,0.15)] z-[1000] p-6 flex flex-col gap-1 overflow-y-auto transition-[left] duration-300 ease-in-out ${
          isOpen ? 'left-0' : '-left-[320px]'
        }`}
      >
        {/* header */}
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-[var(--border)]">
          <h4 className="text-[0.85rem] uppercase font-bold tracking-wider text-[var(--text-muted)] m-0">
            Menu
          </h4>
          <button
            className="bg-transparent border-none rounded-full w-11 h-11 flex items-center justify-center text-[var(--text-muted)] cursor-pointer transition-all duration-200 hover:bg-red-600/10 hover:text-[var(--danger)] hover:rotate-90"
            onClick={closeMenu}
            aria-label="Close menu"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* user info */}
        <div className="bg-[var(--bg)] p-4 rounded-xl mb-8 border border-[var(--border)]">
          <div className="font-bold text-base text-[var(--text-main)] mb-2 break-all">
            {me.username} ({me.alias})
          </div>
          <div className="text-[0.8rem] text-[var(--text-muted)] flex flex-col gap-1">
            <div>
              <strong className="text-[var(--text-main)] font-semibold">{t('role', lang)}:</strong> {me.role}
            </div>
            <div>
              <strong className="text-[var(--text-main)] font-semibold">{t('warehouse', lang)}:</strong> {me.warehouse.alias}
            </div>
            <div>
              <strong className="text-[var(--text-main)] font-semibold">{t('company', lang)}:</strong> {me.company?.alias ?? '-'}
            </div>
          </div>
        </div>

        {/* navigation */}
        <div className="flex flex-col gap-1">
          <NavLink to="/" onClick={closeMenu} end className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}>
            {t('book_slot', lang)}
          </NavLink>

          {me.role !== 'client' && (
            <>
              <NavLink to="/slots" onClick={closeMenu} className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}>
                {t('slots', lang)}
              </NavLink>
              <NavLink to="/generate" onClick={closeMenu} className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}>
                {t('generate_slots', lang)}
              </NavLink>
              <NavLink to="/admin/companies" onClick={closeMenu} className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}>
                {t('companies', lang)}
              </NavLink>
              <NavLink to="/admin/users" onClick={closeMenu} className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}>
                {t('users', lang)}
              </NavLink>
              <NavLink to="/admin/docks" onClick={closeMenu} className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}>
                {t('docks', lang)}
              </NavLink>
              <NavLink to="/test" onClick={closeMenu} className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}>
                {t('test', lang)}
              </NavLink>
            </>
          )}
        </div>
      </aside>
    </>
  )
}

export default Menu