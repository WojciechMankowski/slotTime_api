import React, { useState } from "react";
import { patchUser } from "../../API/serviceUser";
import { UserOut } from "../../Types/types";
import { Lang, t, errorText } from "../../Helper/i18n";
import { getApiError } from "../../Helper/helper";
import Overlay from "../UI/Overlay";
import Spinner from "../UI/Spinner";
import ErrorBanner from "../UI/ErrorBanner";
import Input from "../UI/Input";

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
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roles = ["client", "admin"];

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
        // Optional: payload could include password if provided
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
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {t("user_name_login", lang)}
              </label>
              <Input
                type="text"
                name="username"
                value={username}
                onChange={(val) => setUsername(String(val))}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {t("alias", lang)}
              </label>
              <Input
                type="text"
                name="alias"
                value={alias}
                onChange={(val) => setAlias(String(val))}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {t("role", lang)}
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {t("password", lang)} ({t("leave_empty_to_keep", lang)})
              </label>
              <Input
                type="password"
                name="password"
                value={password}
                onChange={(val) => setPassword(String(val))}
                placeholder="••••••••"
              />
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
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm transition-colors shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
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
