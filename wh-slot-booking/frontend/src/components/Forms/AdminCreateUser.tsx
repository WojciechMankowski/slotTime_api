import React, { useState } from "react";
import Input from "../UI/Input";
import Button from "../UI/Button";
import Label from "../UI/Label";
import Select from "../UI/Select";
import { createUser } from "../../API/serviceUser";
import { t, getLang } from "../../Helper/i18n";

const AdminCreateUser = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [alias, setAlias] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("Firma A");
  const [role, setRole] = useState< "client" | "admin">("client");

  const exampleCompanies = ["Firma A", "Firma B", "Firma C (Przykładowa)"];
  const roles = ["client", "admin"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUser({
        username: username,
        password: password,
        alias: alias,
        role: role,
        company_id: 1,
        warehouse_id: 1,
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
              onChange={(val)=> setPassword(String(val))}
            />
          </div>
          <div className="form-group w-full">
            <Label label={t('alias', getLang())} />
            <Input
              type="text"
              name="alias"
              value={alias}
              onChange={(val)  => setAlias(String(val))}
            />
          </div>
          <div className="form-group w-full">
            <Label label={t('company', getLang())} />
            <Select
              name="company_select"
              options={exampleCompanies}
              onChange={(val)  => setSelectedCompany(val)}
            />
          </div>
          <div className="form-group w-full">
            <Label label={t('role', getLang())} />
            <Select
              name="role_select"
              options={roles}
              onChange={(val)  => setRole(val as "client" | "admin")}
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
