import { patchUser } from "../../API/serviceUser";
import React, { useState, useEffect } from "react";
import Input from "../Input";
import Select from "../Select";
import Button from "../Button";
import Label from "../Label";
import { UserOut } from "../../Types/types";
import { getLang, t } from "../../Helper/i18n";

const UpdateFormUser = ({
  user,
  setIsEdit,
  onSuccess,
}: {
  user: UserOut;
  setIsEdit: React.Dispatch<React.SetStateAction<boolean>>;
  onSuccess?: () => void;
}) => {
  const [userId, setUserId] = useState(user.id);
  const [username, setUsername] = useState(user.username);
  const [password, setPassword] = useState("");
  const [alias, setAlias] = useState(user.alias);
  const [selectedCompany, setSelectedCompany] = useState(user.company_alias);
  const [role, setRole] = useState(user.role);
  const roles = ["client", "admin"];
  const exampleCompanies = ["Firma A", "Firma B", "Firma C (Przykładowa)"];

  const update = async (e: React.FormEvent) => {
    e.preventDefault();
    const newData = {
      id: userId,
      username: username,
      alias: alias,
      role: role,
      warehouse_id: user.warehouse_id,
      company_id: user.company_id,
      company_alias: selectedCompany,
      warehouse_alias: user.warehouse_alias,
    };
    try {
      await patchUser(userId, newData);
      if (onSuccess) onSuccess();
      setIsEdit(false);
    } catch (err) {
      console.error("Błąd aktualizacji użytkownika:", err);
    }
  };
  return (
    <div className="bg-white p-6 rounded-md shadow-sm slot-form-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-l font-bold mb-4">Edycja użytkownika {username}</h3>
        <Button
          text="X"
          onClick={() => {
            setIsEdit(false);
          }}
        />
      </div>

      <form className="flex flex-col gap-6" onSubmit={update}>
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
              defaultValue={role}
            />
          </div>
        </div>
        <div className="mt-4 text-right">
          <Button
            type="submit"
            className="w-full md:w-[200px] primary pt-5"
            text={t("save_user", getLang())}
          />
        </div>
      </form>
    </div>
  );
};

export default UpdateFormUser;
