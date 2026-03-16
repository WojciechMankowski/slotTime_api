import React, { useEffect, useState } from "react";
import { t, Lang, errorText } from "../Helper/i18n";
import type { UserOut, Company } from "../Types/types";
import { getUsers } from "../API/serviceUser";
import AdminCreateUser from "../components/Forms/AdminCreateUser";
import AdminUsersTable from "../components/Admin/AdminUsersTable";

export default function AdminUsers({ lang }: { lang: Lang }) {
  const [users, setCompanies] = useState<UserOut[]>([]);

  const load = async () => {
    try {
      const rs = await getUsers();
      setCompanies(rs);
    } catch (err) {
      console.error("Błąd ładowania firm:", err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="bg-white rounded-xl border border-[var(--border)] shadow-sm p-5 mb-6">
      <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200 pt-2">
        <AdminCreateUser />
      </div>
      <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200 pt-4"></div>
      <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200">
        <AdminUsersTable
          columns={[t('user_name', lang), t('alias', lang), t('role', lang), t('company', lang), t('warehouse', lang)]}
          rows={users}
        />
      </div>
    </div>
  );
}
