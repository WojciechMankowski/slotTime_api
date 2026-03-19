import React, { useState } from "react";
import { DokTyp } from "../../Types/DokType";
import { Lang, t, errorText } from "../../Helper/i18n";
import { patchDock } from "../../API/serviceDok";
import { getApiError } from "../../Helper/helper";
import Overlay from "../UI/Overlay";
import Spinner from "../UI/Spinner";
import ErrorBanner from "../UI/ErrorBanner";
import Input from "../UI/Input";
import Button from "../UI/Button";
import Checkbox from "../UI/Checkbox";

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
            <Input
              label={t("dock_name", lang)}
              type="text"
              name="nameDock"
              value={name}
              onChange={(val) => setName(String(val))}
            />
            <Input
              label={t("alias", lang)}
              type="text"
              name="aliasDock"
              value={alias}
              onChange={(val) => setAlias(String(val))}
            />
            <Checkbox
              id="isActive"
              checked={isActive}
              onChange={setIsActive}
              label={isActive ? t("active_male", lang) : t("inactive_male", lang)}
            />
          </div>

          {error && <ErrorBanner msg={errorText[error] ? errorText[error][lang] : error} compact />}

          <div className="flex gap-3 mt-4">
            <Button
              type="button"
              onClick={onClose}
              disabled={updating}
              className="outline w-full"
              text={t("cancel_btn", lang)}
            />
            <Button
              type="submit"
              disabled={updating}
              className="primary w-full"
              text={updating ? <><Spinner />{t("saving", lang)}</> : t("save_changes", lang)}
            />
          </div>
        </form>
      </div>
    </Overlay>
  );
}
