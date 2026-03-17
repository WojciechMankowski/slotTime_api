import { patchUser } from "../../API/serviceUser";
import React, { useState, useEffect } from "react";
import Input from "../Input";
import Select from "../Select";
import Button from "../Button";
import Label from "../Label";
import { UserOut } from "../../Types/types";
import { getLang, t } from "../../Helper/i18n";

const UpdateFormUser = ({ user }: { user: UserOut }) => {
  const [userId, setUserId] = useState(user.id);
  const [username, setUsername] = useState(user.username);
  const [password, setPassword] = useState("");
  const [alias, setAlias] = useState(user.alias);
  const [selectedCompany, setSelectedCompany] = useState(user.company_alias);
  const [role, setRole] = useState(user.role);
  const roles = ["client", "admin"];
  const exampleCompanies = ["Firma A", "Firma B", "Firma C (Przykładowa)"];

  const update = (e: React.FormEvent) => {
    e.preventDefault();
  };
  return (
    <div className="bg-white p-6 rounded-md shadow-sm slot-form-card">
      <h2 className="text-2xl font-bold mb-4">
        {t("form_add_user", getLang())}
      </h2>
      <form
        className="flex flex-col gap-6"
        //   onSubmit={handleSubmit}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group w-full">
            <Label label={t("user_name_login", getLang())} />
            <Input
              type="text"
              name="username"
              value={username}
              onChange={(val) => setUsername(String(val))}
            />
          </div>
          <div className="form-group w-full">
            <Label label={t("password", getLang())} />
            <Input
              type="password"
              name="password"
              value={password}
              onChange={(val) => setPassword(String(val))}
            />
          </div>
          <div className="form-group w-full">
            <Label label={t("alias", getLang())} />
            <Input
              type="text"
              name="alias"
              value={alias}
              onChange={(val) => setAlias(String(val))}
            />
          </div>
          <div className="form-group w-full">
            <Label label={t("company", getLang())} />
            <Select
              name="company_select"
              options={exampleCompanies}
              onChange={(val) => setSelectedCompany(val)}
            />
          </div>
          <div className="form-group w-full">
            <Label label={t("role", getLang())} />
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
            text={t("add_user", getLang())}
            onClick={() => {}}
          />
        </div>
      </form>
    </div>
  );
};

export default UpdateFormUser;
