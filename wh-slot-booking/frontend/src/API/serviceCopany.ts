import { api } from "./api";
import { CompanyResponse } from "../Types/apiType";

export const createCompany = async (
  name_company: string,
  alias: string | null,
): Promise<CompanyResponse> => {
  try {
    const res = await api.post("/api/companies", {
      name: name_company,
      alias: alias,
      is_active: true,
    });
    return res.data;
  } catch (error) {
    console.error("Błąd generowania slotów:", error);
    throw error;
  }
};
export const getCompanies = async (): Promise<CompanyResponse> => {
  try {
    const res = await api.get("/api/companies");
    return res.data;
  } catch (error) {
    console.error("Błąd generowania slotów:", error);
    throw error;
  }
};
