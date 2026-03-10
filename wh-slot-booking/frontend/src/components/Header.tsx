import React, { useEffect, useState } from 'react'
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { api, setToken } from '../API/api'
import { getLang, setLang, t, Lang } from '../Helper/i18n'
import type { Me } from '../Types/types'


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
                <img
                    src={me.warehouse.logo_path || '/static/app_logo.png'}
                    alt="logo"
                    style={{ height: 32 }}
                />

                <div style={{ flex: 1 }}>
                    <div className="title">WH Slot Booking</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {t('role', lang)}: {me.role} | {t('warehouse', lang)}: {me.warehouse.alias}{' '}
                        | {t('company', lang)}: {me.company?.alias ?? '-'}
                    </div>
                </div>

                <select value={lang} onChange={(e) => onLang(e.target.value as Lang)} style={{ width: 90 }}>
                    <option value="pl">PL</option>
                    <option value="en">EN</option>
                </select>

                <button className="outline" onClick={onLogout}>
                    {t('logout', lang)}
                </button>
            </div>
        </header>
    )
}

export default Header
