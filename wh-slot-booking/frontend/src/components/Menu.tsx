import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { t, Lang } from "../Helper/i18n";
import { Me, Warehouse } from "../Types/types";
import { api, setWarehouseId, getWarehouseId } from "../API/api";

const Menu = ({ lang, me }: { lang: Lang; me: Me }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWh, setSelectedWh] = useState<number | null>(getWarehouseId());

  useEffect(() => {
    if (me.role === "superadmin") {
      api.get<Warehouse[]>("/api/warehouses").then(res => setWarehouses(res.data));
    }
  }, [me.role]);

  const handleWarehouseChange = (id: number | null) => {
    setSelectedWh(id);
    setWarehouseId(id);
  };
  const toggleMenu = () => {
    const next = !isOpen;
    setIsOpen(next);
    document.body.style.overflow = next ? "hidden" : "";
  };
  const closeMenu = () => {
    setIsOpen(false);
    document.body.style.overflow = "";
  };

  const linkBase =
    "flex items-center py-2 px-3 rounded-xl text-[0.88rem] font-medium text-(--text-main) no-underline transition-all duration-200 hover:bg-(--accent-soft) hover:text-(--accent-dark) hover:translate-x-1";
  const linkActive =
    "bg-linear-to-br from-(--accent) to-(--accent-dark) text-white shadow-lg shadow-blue-600/25 translate-x-1";

  const sectionLabel =
    "text-[0.65rem] uppercase font-bold tracking-widest text-(--text-muted) mt-3 mb-0.5 px-3";

  return (
    <>
      <button
        className="bg-transparent border-none rounded-lg cursor-pointer text-(--text-main) p-1.5 flex items-center justify-center transition-all duration-200 mr-1 hover:bg-blue-600/10 hover:text-(--accent)"
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
        className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-20000 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeMenu}
      />

      {/* sidebar */}
      <aside
        className={`fixed top-0 w-[300px] h-screen bg-(--card-bg) shadow-[4px_0_25px_rgba(15,23,42,0.15)] z-20001 px-4 py-4 flex flex-col gap-0 overflow-y-auto transition-[left,opacity,visibility] duration-300 ease-in-out ${
          isOpen ? "left-0 opacity-100 visible" : "-left-[320px] opacity-0 invisible"
        }`}
      >
        {/* header */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-(--border)">
          <h4 className="text-[0.8rem] uppercase font-bold tracking-wider text-(--text-muted) m-0">
            Menu
          </h4>
          <button
            className="bg-transparent border-none rounded-full w-8 h-8 flex items-center justify-center text-(--text-muted) cursor-pointer transition-all duration-200 hover:bg-red-600/10 hover:text-(--danger) hover:rotate-90"
            onClick={closeMenu}
            aria-label="Close menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* user info */}
        <div className="bg-(--bg) px-3 py-2.5 rounded-xl mb-3 border border-(--border)">
          <div className="font-bold text-sm text-(--text-main) mb-1 break-all">
            {me.username} ({me.alias})
          </div>
          <div className="text-[0.75rem] text-(--text-muted) flex flex-col gap-0.5">
            <div>
              <strong className="text-(--text-main) font-semibold">{t("role", lang)}:</strong>{" "}
              {me.role}
            </div>
            <div>
              <strong className="text-(--text-main) font-semibold">{t("warehouse", lang)}:</strong>{" "}
              {me.warehouse?.alias ?? "-"}
            </div>
            <div>
              <strong className="text-(--text-main) font-semibold">{t("company", lang)}:</strong>{" "}
              {me.company?.alias ?? "-"}
            </div>
          </div>
        </div>

        {/* warehouse selector for superadmin */}
        {me.role === "superadmin" && (
          <div className="mb-3">
            <label className="text-[0.65rem] uppercase font-bold tracking-widest text-(--text-muted) px-1 mb-1 block">
              {t("select_warehouse", lang)}
            </label>
            <select
              value={selectedWh ?? ""}
              onChange={e => handleWarehouseChange(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 rounded-xl border border-(--border) text-sm font-medium bg-(--bg) text-(--text-main) focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">— {t("select_warehouse", lang)} —</option>
              {warehouses.map(wh => (
                <option key={wh.id} value={wh.id}>{wh.name} ({wh.alias})</option>
              ))}
            </select>
            {!selectedWh && (
              <p className="text-[0.7rem] text-orange-600 font-medium mt-1 px-1">
                {t("warehouse_required", lang)}
              </p>
            )}
          </div>
        )}

        {/* navigation */}
        <div className="flex flex-col gap-1">

          {/* === OPERACJE === */}
          <div className={sectionLabel}>{t("slots", lang)}</div>

          <NavLink
            to="/slots"
            onClick={closeMenu}
            className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}
          >
            {t("slots", lang)}
          </NavLink>

          <NavLink
            to="/notices"
            onClick={closeMenu}
            className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}
          >
            {t("notices_title", lang)}
          </NavLink>

          {me.role !== "client" && (
            <>
              <NavLink
                to="/calendar"
                onClick={closeMenu}
                className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}
              >
                {t("calendar", lang)}
              </NavLink>

              <NavLink
                to="/admin/archive"
                onClick={closeMenu}
                className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}
              >
                {t("archive", lang)}
              </NavLink>

              <NavLink
                to="/generate"
                onClick={closeMenu}
                className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}
              >
                {t("generate_slots", lang)}
              </NavLink>

              {/* === ADMINISTRACJA === */}
              <div className={sectionLabel}>{t("admin_section", lang)}</div>

              <NavLink
                to="/admin/companies"
                onClick={closeMenu}
                className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}
              >
                {t("companies", lang)}
              </NavLink>

              <NavLink
                to="/admin/users"
                onClick={closeMenu}
                className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}
              >
                {t("users", lang)}
              </NavLink>

              <NavLink
                to="/admin/docks"
                onClick={closeMenu}
                className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}
              >
                {t("docks", lang)}
              </NavLink>

              <NavLink
                to="/admin/reports"
                onClick={closeMenu}
                className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}
              >
                {t("reports", lang)}
              </NavLink>

              {me.role === "superadmin" && (
                <NavLink
                  to="/admin/warehouses"
                  onClick={closeMenu}
                  className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}
                >
                  {t("warehouses", lang)}
                </NavLink>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
};

export default Menu;