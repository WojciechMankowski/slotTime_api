import { FormCompanyProps } from "../../Types/Props";
import React, { useState, useEffect } from "react";
import Input from "../UI/Input";
import Button from "../UI/Button";
import Label from "../UI/Label";
import { createCompany } from "../../API/serviceCopany";
import { t, getLang } from "../../Helper/i18n";

const CreateNewCompany: React.FC<FormCompanyProps> = () => {
  const [nameCompany, setNameCompany] = useState("");
  const [alias, setAlias] = useState("");
  const [error, setError] = useState("");

  const formData = {
    username: "",
    password: "",
    alias: "",
    role: "admin",
    company_id: 0,
    warehouse_id: 0,
  };
  // pobranie nazw firm 
  // pobranie magazynów 


  const create_company = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (nameCompany === "") {
      setError(t('company_name_required', getLang()));
      return;
    }

    await createCompany(nameCompany, alias);
    setNameCompany("");
    setAlias("");
  };

  return (
    <div className="bg-white p-6 rounded-md shadow-sm slot-form-card">
      <h2 className="text-2xl font-bold">{t('form_add_company', getLang())}</h2>
      <form className="flex flex-col gap-6" onSubmit={create_company}>
        <div className="form-group col-span-1 md:col-span-2 grid-3">
          <div className="form-group w-full">
            <Label label={t('company_name', getLang())} />
            <Input
              type="text"
              name="name_copany"
              value={nameCompany}
              onChange={(val)  => {
                setNameCompany(String(val));
              }}
            />
          </div>
          <div className="form-group w-full">
            <Label label={t('alias_optional', getLang())} />
            <Input
              type="text"
              name="alias"
              value={alias}
              onChange={(val)  => {
                setAlias(String(val));
              }}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}{" "}
          </div>
          <div className="mt-2 text-right">
            <Button
              type="submit"
              className="w-[100%] md:w-[150px] primary pt-5"
              text={t('create_new_company', getLang())}
              onClick={() => {
                create_company;
              }}
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateNewCompany;
