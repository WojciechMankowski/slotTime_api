import React, { useEffect, useState } from "react";
import { t, Lang} from "../Helper/i18n";
import type { UserOut} from "../Types/types";
import { getUsers } from "../API/serviceUser";
import AdminCreateUser from "../components/Forms/AdminCreateUser";
import AdminUsersTable from "../components/Admin/AdminUsersTable";
import UpdateFormUser from "../components/Forms/UpdateFormUser";

export default function AdminUsers({ lang }: { lang: Lang }) {
  const [users, setUsers] = useState<UserOut[]>([]);
  const [user, setUser] = useState<UserOut>({
    id: 0,
    username: "",
    alias: "",
    role: "client",
    warehouse_id: null,
    company_id: null,
    company_alias: null,
    warehouse_alias: null,
  });
  const [isEdit, setIsEdit] = useState(false);

  const load = async () => {
    try {
      const rs = await getUsers();
      setUsers(rs);
    } catch (err) {
      console.error("Błąd ładowania użytkowników:", err);
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
          {t("users", lang)}
        </h1>
        <p className="text-gray-500 text-sm">{t("system_subtitle", lang)} (Admin)</p>
      </div>

      {/* ===== Create New User Form ===== */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-linear-to-br from-indigo-600 to-indigo-800 px-7 py-4">
          <h2 className="text-lg font-bold text-white leading-none">
            {t('add_user', lang)}
          </h2>
        </div>
        <div className="p-7">
          <AdminCreateUser onSuccess={load} />
        </div>
      </div>

      {/* ===== Main Section: Table + Optional Edit Sidebar ===== */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 overflow-hidden italic-none">
          <AdminUsersTable
            columns={[
              t("user_name", lang),
              t("alias", lang),
              t("role", lang),
              t("company", lang),
              t("warehouse", lang),
              "",
            ]}
            rows={users}
            isEdit={isEdit}
            setIsEdit={setIsEdit}
            setUser={setUser}
          />
        </div>

        {isEdit && (
          <div className="w-full lg:w-96 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 h-fit shrink-0 overflow-hidden">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('edit', lang)}</h3>
            <UpdateFormUser user={user} setIsEdit={setIsEdit} onSuccess={load} />
          </div>
        )}
      </div>
    </div>
  );
}
