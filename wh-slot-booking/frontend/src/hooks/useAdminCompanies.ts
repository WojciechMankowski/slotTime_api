import { useState, useEffect } from "react";
import { getCompanies } from "../API/serviceCopany";
import { getApiError } from "../Helper/helper";
import type { CompanyResponse } from "../Types/apiType";

export default function useAdminCompanies() {
  const [companies, setCompanies] = useState<CompanyResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const load = async () => {
    setLoadErr(null);
    setLoading(true);
    try {
      const rs = await getCompanies();
      setCompanies(rs);
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
    companies,
    loading,
    loadErr,
    reload: load,
  };
}