import { useState, useEffect } from "react";
import { getDokAdmin } from "../API/serviceDok";
import { getApiError } from "../Helper/helper";
import type { DokTyp } from "../Types/DokType";

const emptyDock: DokTyp = {
  id: 0,
  name: "",
  alias: "",
  is_active: true,
};

export default function useAdminDocks() {
  const [doks, setDocks] = useState<DokTyp[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [isEdit, setIsEdit] = useState(false);
  const [dok, setDock] = useState<DokTyp>({ ...emptyDock });

  const load = async () => {
    setLoadErr(null);
    setLoading(true);
    try {
      const rs = await getDokAdmin();
      setDocks(rs);
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
    doks,
    loading,
    loadErr,
    isEdit,
    dok,
    setIsEdit,
    setDock,
    reload: load,
  };
}