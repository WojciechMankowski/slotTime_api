import React, { useState, useEffect } from "react";
import { Lang } from "../../Helper/i18n";
import { getUsers } from "../../API/serviceUser";
import {UserOut} from '../../Types/types'
import AdminCreateUser from "../../components/Forms/AdminCreateUser";
import AdminUsersTable from "../../components/Admin/AdminUsersTable";

const AdminUser = () => {
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
    <>
      <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200 pt-2">
        <AdminCreateUser  />
      </div>
      <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200 pt-4">

      </div>
      <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200">
       <AdminUsersTable 
       columns={['Nazwa użytkownika', 'Alias', "Rola", "Firma", "Magazyn"]}
       rows={users}
       />
      </div>
    </>
  );
}

export default AdminUser