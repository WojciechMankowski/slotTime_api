import React from "react";
import { t, Lang, errorText } from "../Helper/i18n";
import Button from "../components/UI/Button";

interface CompanyBlockedProps {
  lang: Lang;
  onLogout: () => void;
}

export default function CompanyBlocked({ lang, onLogout }: CompanyBlockedProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-(--bg) gap-4">
      <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-10 max-w-md w-full text-center">
        <div className="flex justify-center mb-4 text-red-400 opacity-60">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {errorText["COMPANY_INACTIVE"][lang]}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {lang === "pl"
            ? "Skontaktuj się z administratorem systemu."
            : "Please contact your system administrator."}
        </p>
        <Button
          type="button"
          onClick={onLogout}
          className="outline"
          text={t("logout", lang)}
        />
      </div>
    </div>
  );
}
