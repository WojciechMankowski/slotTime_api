import React, { useEffect, useState } from 'react'
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { api, setToken } from '../API/api'
import { getLang, setLang, t, Lang } from '../Helper/i18n'
import type { Me } from '../Types/types'
import Menu from './Menu'

function Header({
    me,
    lang,
    onLang,
    onLogout,
}: {
    me: Me
    lang: Lang
    onLang: (l: Lang) => void
    onLogout: () => void
}) {
    const [isLangOpen, setIsLangOpen] = useState(false);

    return (
        <header className="header">
            {/* container = max-width jak w starym index.html */}
            <div
                className="container"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    width: '100%',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Menu lang={lang} me={me} />
                    <img
                        src={me.warehouse.logo_path || '/static/app_logo.png'}
                        alt="logo"
                        style={{ height: 32 }}
                    />
                </div>

                <div style={{ flex: 1 }}>
                    <div className="title">Slot Booking</div>
                </div>

                <div className="custom-lang-select-container">
                    <button
                        className="custom-lang-select-btn"
                        onClick={() => setIsLangOpen(!isLangOpen)}
                    >
                        {lang === 'pl' ? (
                            <img src="https://flagcdn.com/w20/pl.png" alt="PL" width="20" />
                        ) : (
                            <img src="https://flagcdn.com/w20/gb.png" alt="EN" width="20" />
                        )}
                        <span>{lang.toUpperCase()}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </button>

                    {isLangOpen && (
                        <div className="custom-lang-dropdown">
                            <div
                                className={`lang-option ${lang === 'pl' ? 'active' : ''}`}
                                onClick={() => {
                                    onLang('pl' as Lang);
                                    setIsLangOpen(false);
                                }}
                            >
                                <img src="https://flagcdn.com/w20/pl.png" alt="PL" width="20" />
                                <span>PL</span>
                            </div>
                            <div
                                className={`lang-option ${lang === 'en' ? 'active' : ''}`}
                                onClick={() => {
                                    onLang('en' as Lang);
                                    setIsLangOpen(false);
                                }}
                            >
                                <img src="https://flagcdn.com/w20/gb.png" alt="EN" width="20" />
                                <span>EN</span>
                            </div>
                        </div>
                    )}
                </div>

                <button className="outline" onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {t('logout', lang)}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                </button>
            </div>
        </header>
    )
}

export default Header
