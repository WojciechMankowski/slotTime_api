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
    <div className="bg-white rounded-xl border border-(--border) shadow-sm p-5 mb-6">
      <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200 pt-2">
        <AdminCreateUser onSuccess={load} />
      </div>

      <div className="flex gap-6 mt-4">
        <div className="flex-1 overflow-x-auto shadow-sm rounded-lg border border-gray-200">
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
          <div className="w-96 overflow-x-auto shadow-sm rounded-lg border border-gray-200 pt-4">
            <UpdateFormUser user={user} setIsEdit={setIsEdit} onSuccess={load} />
          </div>
        )}
      </div>
    </div>
  );
}
