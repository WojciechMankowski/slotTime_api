import React, { useState } from "react";
import { DokTyp } from "../../Types/DokType";
import { Lang, t, errorText } from "../../Helper/i18n";
import { patchDock } from "../../API/serviceDok";
import { getApiError } from "../../Helper/helper";
import Overlay from "../UI/Overlay";
import Spinner from "../UI/Spinner";
import ErrorBanner from "../UI/ErrorBanner";
import Input from "../UI/Input";

interface UpdateFormDockProps {
  dock: DokTyp;
  lang: Lang;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UpdateFormDock({
  dock,
  lang,
  onClose,
  onSuccess,
}: UpdateFormDockProps) {
  const [name, setName] = useState(dock.name);
  const [alias, setAlias] = useState(dock.alias);
  const [isActive, setIsActive] = useState(dock.is_active);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUpdating(true);
    try {
      await patchDock(dock.id, {
        id: dock.id,
        name,
        alias,
        is_active: isActive,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Overlay onClose={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-br from-blue-600 to-blue-800 px-7 py-5">
          <h3 className="text-xl font-bold text-white mb-0.5">
            {t("edit_dock", lang)}
          </h3>
          <p className="text-blue-200 text-sm">{dock.alias}</p>
        </div>

        {/* Body */}
        <form className="px-7 py-6" onSubmit={handleSubmit}>
          <div className="space-y-4 mb-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {t("dock_name", lang)}
              </label>
              <Input
                type="text"
                name="nameDock"
                value={name}
                onChange={(val) => setName(String(val))}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {t("alias", lang)}
              </label>
              <Input
                type="text"
                name="aliasDock"
                value={alias}
                onChange={(val) => setAlias(String(val))}
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={() => setIsActive(!isActive)}
                className="w-5 h-5 text-blue-600 bg-white border-gray-300 rounded cursor-pointer focus:ring-blue-500 focus:ring-2 transition-colors duration-200"
              />
              <label
                htmlFor="isActive"
                className="text-sm font-medium text-gray-700 cursor-pointer select-none"
              >
                {isActive
                  ? t("active_male", lang)
                  : t("inactive_male", lang)}
              </label>
            </div>
          </div>

          {error && <ErrorBanner msg={errorText[error] ? errorText[error][lang] : error} compact />}

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={updating}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {t("cancel_btn", lang)}
            </button>
            <button
              type="submit"
              disabled={updating}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-colors shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {updating ? (
                <>
                  <Spinner />
                  {t("saving", lang)}
                </>
              ) : (
                t("save_changes", lang)
              )}
            </button>
          </div>
        </form>
      </div>
    </Overlay>
  );
}