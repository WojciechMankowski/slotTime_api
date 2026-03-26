import { useState, useEffect } from "react";
import { getUsers } from "../API/serviceUser";
import { getApiError } from "../Helper/helper";
import type { UserOut } from "../Types/types";

const emptyUser: UserOut = {
  id: 0,
  username: "",
  alias: "",
  role: "client",
  warehouse_id: null,
  company_id: null,
  company_alias: null,
  warehouse_alias: null,
};

export default function useAdminUsers() {
  const [users, setUsers] = useState<UserOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [isEdit, setIsEdit] = useState(false);
  const [user, setUser] = useState<UserOut>({ ...emptyUser });

  const load = async () => {
    setLoadErr(null);
    setLoading(true);
    try {
      const rs = await getUsers();
      setUsers(rs);
    } catch (err) {
      setLoadErr(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return {
    users,
    loading,
    loadErr,
    isEdit,
    user,
    setIsEdit,
    setUser,
    reload: load,
  };
}