import { FormCompanyProps } from "../../Types/Props";
import React, { useState, useEffect } from "react";
import Input from "../Input";
import Button from "../Button";
import Label from "../Label";
import { createCompany } from "../../API/serviceCopany";

const CreateNewCompany: React.FC<FormCompanyProps> = (
  serverError,
  initialValues,
) => {
  const [nameCompany, setNameCompany] = useState("");
  const [alias, setAlias] = useState("");
  const [error, setError] = useState("");

  const create_company = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (nameCompany === "") {
      setError("Nazwa firmy jest potrzebna do utworzenia nowego klienta");
      return;
    }

    await createCompany(nameCompany, alias);
    setNameCompany("");
    setAlias("");
  };

  return (
    <div className="bg-white p-6 rounded-md shadow-sm slot-form-card">
      <h2 className="text-2xl font-bold">Formularz tworzenie nowej firmy</h2>
      <form className="flex flex-col gap-6" onSubmit={create_company}>
        <div className="form-group col-span-1 md:col-span-2 grid-3">
           <div className="form-group w-full">
          <Label label="Nazwa firmy" />
          <Input
            type="text"
            name="name_copany"
            value={nameCompany}
            onChange={(val) => {
              setNameCompany(String(val));
            }}
          /></div>
           <div className="form-group w-full">
          <Label label="Alias (opcjonalne)" />
          <Input
            type="text"
            name="alias"
            value={alias}
            onChange={(val) => {
              setAlias(String(val));
            }}
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>} </div>
          <div className="mt-2 text-right">
            <Button
              type="submit"
              className="w-[100%] md:w-[150px] primary pt-5"
              text="Utwórz nową firmę"
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
