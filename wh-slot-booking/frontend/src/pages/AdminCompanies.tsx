import React, { useEffect, useState } from 'react'
import { api } from '../API/api'
import { t, Lang, errorText } from '../Helper/i18n'
import type { Company } from '../Types/types'
import CreateNewCompany from "../components/Forms/CreateNewCompany";
import AdminCompaniesTable from "../components/Admin/AdminCompaniesTable";
import { getCompanies } from "../API/serviceCopany";
import { CompanyResponse } from "../Types/apiType";
export default function AdminCompanies({ lang }: { lang: Lang }) {
 const now = new Date().toISOString().split("T")[0];
  const [companies, setCompanies] = useState<CompanyResponse[]>([]);

  const load = async () => {
    try {
      const rs = await getCompanies();
      setCompanies(rs);
    } catch (err) {
      console.error("Błąd ładowania firm:", err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      {/* ===== Page header ===== */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          {t("companies", lang)}
        </h1>
        <p className="text-gray-500 text-sm">{t("system_subtitle", lang)} (Admin)</p>
      </div>

      {/* ===== Create New Company Form ===== */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-linear-to-br from-indigo-600 to-indigo-800 px-7 py-4">
          <h2 className="text-lg font-bold text-white leading-none">
            {t('create_new_company', lang)}
          </h2>
        </div>
        <div className="p-7">
          <CreateNewCompany serverError={null} />
        </div>
      </div>

      {/* ===== Companies Table Section ===== */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 overflow-hidden">
        <AdminCompaniesTable
          rows={companies}
          columns={[t('name', lang), t('alias', lang), t('active', lang)]}
        />
      </div>
    </div>
  );
}
