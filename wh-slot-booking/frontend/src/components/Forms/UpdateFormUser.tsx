import React, { useState, useEffect } from "react";
import { patchUser } from "../../API/serviceUser";
import { getCompanies } from "../../API/serviceCopany";
import { CompanyResponse } from "../../Types/apiType";
import { UserOut } from "../../Types/types";
import { Lang, t, errorText } from "../../Helper/i18n";
import { getApiError } from "../../Helper/helper";
import Overlay from "../UI/Overlay";
import Spinner from "../UI/Spinner";
import ErrorBanner from "../UI/ErrorBanner";
import Input from "../UI/Input";
import Button from "../UI/Button";
import Select from "../UI/Select";
import Label from "../UI/Label";

interface UpdateFormUserProps {
  user: UserOut;
  lang: Lang;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function UpdateFormUser({
  user,
  lang,
  onClose,
  onSuccess,
}: UpdateFormUserProps) {
  const [username, setUsername] = useState(user.username);
  const [password, setPassword] = useState("");
  const [alias, setAlias] = useState(user.alias);
  const [role, setRole] = useState(user.role);
  const [companyId, setCompanyId] = useState<number | null>(user.company_id);
  const [companies, setCompanies] = useState<CompanyResponse[]>([]);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roles = ["client", "admin"];

  useEffect(() => {
    getCompanies()
      .then(setCompanies)
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUpdating(true);
    try {
      await patchUser(user.id, {
        ...user,
        username,
        alias,
        role: role as any,
        company_id: companyId,
      });
      if (onSuccess) onSuccess();
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
        <div className="bg-linear-to-br from-indigo-600 to-indigo-800 px-7 py-5">
          <h3 className="text-xl font-bold text-white mb-0.5">
            {t("edit_user", lang)}
          </h3>
          <p className="text-indigo-200 text-sm">{user.username}</p>
        </div>

        {/* Body */}
        <form className="px-7 py-6" onSubmit={handleSubmit}>
          <div className="space-y-4 mb-5">
            <Input
              label={t("user_name_login", lang)}
              type="text"
              name="username"
              value={username}
              onChange={(val) => setUsername(String(val))}
            />
            <Input
              label={t("alias", lang)}
              type="text"
              name="alias"
              value={alias}
              onChange={(val) => setAlias(String(val))}
            />
            <div className="flex flex-col gap-1">
              <Label label={t("role", lang)} />
              <Select
                name="role_select"
                options={roles}
                defaultValue={role}
                onChange={(val) => setRole(val as any)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label label={t("company", lang)} />
              <Select
                name="company_select"
                options={[
                  { value: "", label: "—" },
                  ...companies.map((c) => ({ value: String(c.id), label: c.name })),
                ]}
                defaultValue={companyId != null ? String(companyId) : ""}
                onChange={(val) => setCompanyId(val ? Number(val) : null)}
              />
            </div>
            <Input
              label={`${t("password", lang)} (${t("leave_empty_to_keep", lang)})`}
              type="password"
              name="password"
              value={password}
              onChange={(val) => setPassword(String(val))}
              placeholder="••••••••"
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
