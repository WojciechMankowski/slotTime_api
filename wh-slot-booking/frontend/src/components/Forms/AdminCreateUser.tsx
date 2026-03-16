import React, { useState } from "react";
import Input from "../Input";
import Button from "../Button";
import Label from "../Label";
import Select from "../Select";
import { createUser } from "../../API/serviceUser";

const AdminCreateUser = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [alias, setAlias] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("Firma A");
  const [role, setRole] = useState< "client" | "admin">("client");

  const exampleCompanies = ["Firma A", "Firma B", "Firma C (Przykładowa)"];
  const roles = ["client", "admin"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ username, password, alias, company: selectedCompany, role });
    const res = createUser({
      username: username,
      password: password,
      alias: alias,
      role: role,
      company_id: 1,
      warehouse_id: 1,
    });
  };

  return (
    <div className="bg-white p-6 rounded-md shadow-sm slot-form-card">
      <h2 className="text-2xl font-bold mb-4">
        Formularz dodawania nowych użytkowników
      </h2>
      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group w-full">
            <Label label="Nazwa użytkownika (Login)" />
            <Input
              type="text"
              name="username"
              value={username}
              onChange={(val) => setUsername(String(val))}
            />
          </div>
          <div className="form-group w-full">
            <Label label="Hasło" />
            <Input
              type="password"
              name="password"
              value={password}
              onChange={(val) => setPassword(String(val))}
            />
          </div>
          <div className="form-group w-full">
            <Label label="Alias" />
            <Input
              type="text"
              name="alias"
              value={alias}
              onChange={(val) => setAlias(String(val))}
            />
          </div>
          <div className="form-group w-full">
            <Label label="Firma" />
            <Select
              name="company_select"
              options={exampleCompanies}
              onChange={(val) => setSelectedCompany(val)}
            />
          </div>
          <div className="form-group w-full">
            <Label label="Rola" />
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
            text="Dodaj użytkownika"
            onClick={() => {}}
          />
        </div>
      </form>
    </div>
  );
};

export default AdminCreateUser;
