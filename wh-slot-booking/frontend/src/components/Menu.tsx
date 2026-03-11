import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { t, Lang } from '../Helper/i18n'
import { Me } from '../Types/types'

const Menu = ({ lang, me }: { lang: Lang; me: Me }) => {
    const [isOpen, setIsOpen] = useState(false)
    const toggleMenu = () => setIsOpen(!isOpen)
    const closeMenu = () => setIsOpen(false)

    return (
        <>
            <button className="hamburger-btn" onClick={toggleMenu} aria-label="Toggle menu">
                {isOpen ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                )}
            </button>
            <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={closeMenu} />
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h4>Menu</h4>
                    <button className="close-btn-mobile" onClick={closeMenu} aria-label="Close menu">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="sidebar-user-info">
                    <div className="user-name">{me.username} ({me.alias})</div>
                    <div className="user-details">
                        <div><strong>{t('role', lang)}:</strong> {me.role}</div>
                        <div><strong>{t('warehouse', lang)}:</strong> {me.warehouse.alias}</div>
                        <div><strong>{t('company', lang)}:</strong> {me.company?.alias ?? '-'}</div>
                    </div>
                </div>

                <div className="sidebar-nav">
                    <NavLink to="/slots" onClick={closeMenu}>{t('slots', lang)}</NavLink>

                    {me.role !== 'client' && (
                        <>
                            <NavLink to="/generate" onClick={closeMenu}>{t('generate_slots', lang)}</NavLink>
                            <NavLink to="/admin/companies" onClick={closeMenu}>{t('companies', lang)}</NavLink>
                            <NavLink to="/admin/users" onClick={closeMenu}>{t('users', lang)}</NavLink>
                            <NavLink to="/admin/docks" onClick={closeMenu}>{t('docks', lang)}</NavLink>
                        </>
                    )}
                </div>
            </aside>
        </>
    )
}

export default Menu