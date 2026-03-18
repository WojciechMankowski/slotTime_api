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
            <button 
                className="bg-transparent border-none rounded-lg cursor-pointer text-(--text-main) p-1.5 flex items-center justify-center transition-all duration-200 mr-1 hover:bg-blue-600/10 hover:text-(--accent)" 
                onClick={toggleMenu} 
                aria-label="Toggle menu"
            >
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
            <div 
                className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-999 transition-opacity duration-350 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
                onClick={closeMenu} 
            />
            <aside 
                className={`fixed top-0 w-[300px] h-screen bg-(--card-bg) shadow-[4px_0_25px_rgba(15,23,42,0.15)] z-1000 p-6 flex flex-col gap-1 overflow-y-auto transition-[left] duration-350 ease-in-out ${isOpen ? 'left-0' : '-left-[320px]'}`}
            >
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-(--border)">
                    <h4 className="text-[0.85rem] uppercase font-bold tracking-wider text-(--text-muted) m-0">Menu</h4>
                    <button 
                        className="bg-transparent border-none rounded-full w-11 h-11 flex items-center justify-center text-(--text-muted) cursor-pointer transition-all duration-200 hover:bg-red-600/10 hover:text-(--danger) hover:rotate-90" 
                        onClick={closeMenu} 
                        aria-label="Close menu"
                    >
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="bg-(--bg) p-4 rounded-xl mb-8 border border-(--border)">
                    <div className="font-bold text-base text-(--text-main) mb-2 break-all">{me.username} ({me.alias})</div>
                    <div className="text-[0.8rem] text-(--text-muted) flex flex-col gap-1">
                        <div><strong className="text-(--text-main) font-semibold">{t('role', lang)}:</strong> {me.role}</div>
                        <div><strong className="text-(--text-main) font-semibold">{t('warehouse', lang)}:</strong> {me.warehouse.alias}</div>
                        <div><strong className="text-(--text-main) font-semibold">{t('company', lang)}:</strong> {me.company?.alias ?? '-'}</div>
                    </div>
                </div>

                <div className="flex flex-col gap-1 [&>a]:flex [&>a]:items-center [&>a]:py-3 [&>a]:px-4 [&>a]:rounded-xl [&>a]:text-[0.95rem] [&>a]:font-medium [&>a]:text-(--text-main) [&>a]:no-underline [&>a]:transition-all [&>a]:duration-200 hover:[&>a]:bg-(--accent-soft) hover:[&>a]:text-(--accent-dark) hover:[&>a]:translate-x-1 [&>a.active]:bg-linear-to-br [&>a.active]:from-(--accent) [&>a.active]:to-(--accent-dark) [&>a.active]:text-white [&>a.active]:shadow-lg [&>a.active]:shadow-blue-600/25 [&>a.active]:translate-x-1">
                    {/* Widok rezerwacji: dostępny dla wszystkich */}
                    <NavLink to="/" onClick={closeMenu} end>{t('book_slot', lang)}</NavLink>

                    {me.role !== 'client' && (
                        <>
                            <NavLink to="/slots" onClick={closeMenu}>{t('slots', lang)}</NavLink>
                            <NavLink to="/generate" onClick={closeMenu}>{t('generate_slots', lang)}</NavLink>
                            <NavLink to="/admin/companies" onClick={closeMenu}>{t('companies', lang)}</NavLink>
                            <NavLink to="/admin/users" onClick={closeMenu}>{t('users', lang)}</NavLink>
                            <NavLink to="/admin/docks" onClick={closeMenu}>{t('docks', lang)}</NavLink>
                            <NavLink to="/test" onClick={closeMenu}>{t('test', lang)}</NavLink>
                        </>
                    )}
                </div>

            </aside>
        </>
    )
}

export default Menu