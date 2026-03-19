import React from "react";
import { t, Lang } from "../Helper/i18n";
import useAdminCompanies from "../hooks/useAdminCompanies";
import ErrorBanner from "../components/UI/ErrorBanner";
import Spinner from "../components/UI/Spinner";
import CreateNewCompany from "../components/Forms/CreateNewCompany";
import AdminCompaniesTable from "../components/Admin/AdminCompaniesTable";

export default function AdminCompanies({ lang }: { lang: Lang }) {
  const { companies, loading, loadErr, reload } = useAdminCompanies();

  return (
    <div className="p-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          {t("companies", lang)}
        </h1>
        <p className="text-gray-500 text-sm">
          {t("system_subtitle", lang)} (Admin)
        </p>
      </div>

      {/* Create form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="bg-linear-to-br from-indigo-600 to-indigo-800 px-7 py-4">
          <h2 className="text-lg font-bold text-white leading-none">
            {t("create_new_company", lang)}
          </h2>
        </div>
        <div className="p-7">
          <CreateNewCompany serverError={null} 
          // onSuccess={reload} 
          />
        </div>
      </div>

      {loadErr && <ErrorBanner msg={loadErr} />}

      {/* Companies cards */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
          <Spinner />
          <span className="text-sm font-medium">{t("loading", lang)}</span>
        </div>
      ) : (
        <AdminCompaniesTable
          rows={companies}
          lang={lang}
        />
      )}
    </div>
  );
}