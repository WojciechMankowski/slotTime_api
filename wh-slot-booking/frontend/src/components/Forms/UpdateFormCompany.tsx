import React, { useState } from "react";
import { t, errorText } from "../../Helper/i18n";
import { patchCompany } from "../../API/serviceCopany";
import { getApiError } from "../../Helper/helper";
import Overlay from "../UI/Overlay";
import Spinner from "../UI/Spinner";
import ErrorBanner from "../UI/ErrorBanner";
import Input from "../UI/Input";
import Button from "../UI/Button";
import Checkbox from "../UI/Checkbox";
import { UpdateFormCompanyProps } from "../../Types/Props";

export default function UpdateFormCompany({
  company,
  lang,
  onClose,
  onSuccess,
}: UpdateFormCompanyProps) {
  const [name, setName] = useState(company.name);
  const [alias, setAlias] = useState(company.alias);
  const [isActive, setIsActive] = useState(company.is_active);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUpdating(true);
    try {
      await patchCompany(company.id, {
        id: company.id,
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
            {t("edit_company", lang)}
          </h3>
          <p className="text-blue-200 text-sm">{company.alias}</p>
        </div>

        {/* Body */}
        <form className="px-7 py-6" onSubmit={handleSubmit}>
          <div className="space-y-4 mb-5">
            <Input
              label={t("company_name", lang)}
              type="text"
              name="nameCompany"
              value={name}
              onChange={(val) => setName(String(val))}
            />
            <Input
              label={t("alias", lang)}
              type="text"
              name="aliasCompany"
              value={alias}
              onChange={(val) => setAlias(String(val))}
            />
            <Checkbox
              id="companyIsActive"
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
