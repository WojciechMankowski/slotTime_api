import React, { useState, useEffect } from "react";
import Input from "../UI/Input";
import Button from "../UI/Button";
import Label from "../UI/Label";
import Select from "../UI/Select";
import { createUser } from "../../API/serviceUser";
import { getCompanies } from "../../API/serviceCopany";
import { getWarehouses } from "../../API/serviceWarehouse";
import { CompanyResponse } from "../../Types/apiType";
import { Warehouse } from "../../Types/types";
import { t, getLang } from "../../Helper/i18n";
import { getApiError } from "../../Helper/helper";

const AdminCreateUser = ({ onSuccess, isSuperadmin }: { onSuccess?: () => void; isSuperadmin?: boolean }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [alias, setAlias] = useState("");
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [warehouseId, setWarehouseId] = useState<number | null>(null);
  const [role, setRole] = useState<"client" | "admin">("client");
  const [companies, setCompanies] = useState<CompanyResponse[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const roles = ["client", "admin"];

  useEffect(() => {
    getCompanies()
      .then((data) => {
        setCompanies(data);
        if (data.length > 0) setCompanyId(data[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isSuperadmin) {
      getWarehouses().then(setWarehouses).catch(() => {});
    }
  }, [isSuperadmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim()) { setError(t("user_name", getLang()) + ": " + t("notice_required_field", getLang())); return; }
    if (!password.trim()) { setError(t("password", getLang()) + ": " + t("notice_required_field", getLang())); return; }
    setSubmitting(true);
    try {
      await createUser({
        username,
        password,
        alias,
        role,
        company_id: role === "client" ? companyId : null,
        warehouse_id: role === "admin" ? warehouseId : null,
      });
      setUsername("");
      setPassword("");
      setAlias("");
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-md shadow-sm slot-form-card">
      <h2 className="text-2xl font-bold mb-4">
        {t('form_add_user', getLang())}
      </h2>
      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group w-full">
            <Label label={t('user_name_login', getLang())} />
            <Input
              type="text"
              name="username"
              value={username}
              onChange={(val) => setUsername(String(val))}
            />
          </div>
          <div className="form-group w-full">
            <Label label={t('password', getLang())} />
            <Input
              type="password"
              name="password"
              value={password}
              onChange={(val) => setPassword(String(val))}
            />
          </div>
          <div className="form-group w-full">
            <Label label={t('alias', getLang())} />
            <Input
              type="text"
              name="alias"
              value={alias}
              onChange={(val) => setAlias(String(val))}
            />
          </div>
          <div className="form-group w-full">
            <Label label={t('role', getLang())} />
            <Select
              name="role_select"
              options={roles}
              onChange={(val) => setRole(val as "client" | "admin")}
            />
          </div>
          {role === "client" && (
            <div className="form-group w-full">
              <Label label={t('company', getLang())} />
              <Select
                name="company_select"
                options={companies.map((c) => ({ value: String(c.id), label: c.name }))}
                onChange={(val) => setCompanyId(Number(val))}
              />
            </div>
          )}
          {role === "admin" && isSuperadmin && (
            <div className="form-group w-full">
              <Label label={t('warehouse', getLang())} />
              <Select
                name="warehouse_select"
                options={[
                  { value: "", label: t("none", getLang()) },
                  ...warehouses.map((w) => ({ value: String(w.id), label: `${w.name} (${w.alias})` })),
                ]}
                onChange={(val) => setWarehouseId(val ? Number(val) : null)}
              />
            </div>
          )}
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="mt-4 text-right">
          <Button
            type="submit"
            className="w-full md:w-[200px] primary pt-5"
            text={submitting ? t("saving", getLang()) : t("add_user", getLang())}
            disabled={submitting}
          />
        </div>
      </form>
    </div>
  );
};

export default AdminCreateUser;
