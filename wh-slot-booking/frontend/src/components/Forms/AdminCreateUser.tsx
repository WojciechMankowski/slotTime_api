import React, { useState, useEffect } from "react";
import Input from "../UI/Input";
import Button from "../UI/Button";
import Label from "../UI/Label";
import Select from "../UI/Select";
import { createUser } from "../../API/serviceUser";
import { getCompanies } from "../../API/serviceCopany";
import { CompanyResponse } from "../../Types/apiType";
import { t, getLang } from "../../Helper/i18n";

const AdminCreateUser = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [alias, setAlias] = useState("");
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [role, setRole] = useState<"client" | "admin">("client");
  const [companies, setCompanies] = useState<CompanyResponse[]>([]);

  const roles = ["client", "admin"];

  useEffect(() => {
    getCompanies()
      .then((data) => {
        setCompanies(data);
        if (data.length > 0) setCompanyId(data[0].id);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUser({
        username,
        password,
        alias,
        role,
        company_id: companyId,
      });
      setUsername("");
      setPassword("");
      setAlias("");
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Błąd tworzenia użytkownika:", err);
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
            <Label label={t('company', getLang())} />
            <Select
              name="company_select"
              options={companies.map((c) => ({ value: String(c.id), label: c.name }))}
              onChange={(val) => setCompanyId(Number(val))}
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
        </div>
        <div className="mt-4 text-right">
          <Button
            type="submit"
            className="w-full md:w-[200px] primary pt-5"
            text={t('add_user', getLang())}
          />
        </div>
      </form>
    </div>
  );
};

export default AdminCreateUser;
