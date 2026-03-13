import React, { useState, useEffect } from "react";
import { Lang } from "../Helper/i18n";
import CreateNewCompany from "../components/Forms/CreateNewCompany";
import AdminCompaniesTable from "../components/Admin/AdminCompaniesTable";
import { getCompanies } from "../API/serviceCopany";
import { Company } from "../Types/types";
import { CompanyResponse } from "../Types/apiType";

export default function TestPage({ lang }: { lang: Lang }) {
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
    <>
      <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200 pt-2">
        <CreateNewCompany serverError={null} />
      </div>
      <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200 pt-4">

      </div>
      <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200">
        <AdminCompaniesTable
          rows={companies}
          columns={["Nazwa", "Alias", "Aktywne"]}
        />
      </div>
    </>
  );
}
// TODO akcja anulowania rezerwacji
