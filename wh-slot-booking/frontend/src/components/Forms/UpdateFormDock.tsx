import { patchUser } from "../../API/serviceUser";
import React, { useState, useEffect } from "react";
import Input from "../Input";
import Select from "../Select";
import Button from "../Button";
import Label from "../Label";
import { DokTyp } from "../../Types/DokType";
import { getLang, t } from "../../Helper/i18n";
import { patchDock } from "../../API/serviceDok";
import axios from "axios";

function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (detail?.error_code) return detail.error_code;
    if (typeof detail === "string") return detail;
    if (error.response?.status === 403) return "COMPANY_INACTIVE";
    return error.message || "CONNECTION_ERROR";
  }
  return "UNKNOWN_ERROR";
}

const UpdateFormDock = ({
  setIsEdit,
  dock,
  onSuccess,
}: {
  setIsEdit: React.Dispatch<React.SetStateAction<boolean>>;
  dock: DokTyp;
  onSuccess?: () => void;
}) => {
  const [name, setName] = useState(dock.name);
  const [alias, setAlias] = useState(dock.alias);
  const [isActive, setIstActive] = useState(dock.is_active);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUpdating(true);
    try {
      await patchDock(dock.id, {
        id: dock.id,
        name: name,
        alias: alias,
        is_active: isActive,
      });
      if (onSuccess) onSuccess();
      setIsEdit(false);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setUpdating(false);
    }
  };

  const handleCheckboxChange = () => {
    setIstActive(!isActive);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900 mb-0">{t("edit_dock", getLang())} {name}</h3>
        <button
          onClick={() => setIsEdit(false)}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-150"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-300 text-red-700 rounded-xl px-5 py-3 mb-5 shadow-sm">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <span className="font-medium">{error}</span>
        </div>
      )}

      <form className="flex flex-col gap-6" onSubmit={update}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("dock_name", getLang())}</label>
            <Input
              type="text"
              name="nameDock"
              value={name}
              onChange={(val) => setName(String(val))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("alias", getLang())}</label>
            <Input
              type="text"
              name="nameDock"
              value={alias}
              onChange={(val) => setAlias(String(val))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("active", getLang())}</label>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={handleCheckboxChange}
                className="w-5 h-5 text-blue-600 bg-white border-gray-300 rounded cursor-pointer focus:ring-blue-500 focus:ring-2 transition-colors duration-200"
              />
              <label
                htmlFor="isActive"
                className="text-sm font-medium text-gray-700 cursor-pointer select-none"
              >
                {isActive
                  ? t("active_male", getLang())
                  : t("inactive_male", getLang())}
              </label>
            </div>
          </div>
        </div>
        <div className="mt-4 text-right">
          <button
            type="submit"
            disabled={updating}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg px-5 py-2 text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            {updating ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t("saving", getLang())}
              </>
            ) : (
              t("save_user", getLang())
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateFormDock;
