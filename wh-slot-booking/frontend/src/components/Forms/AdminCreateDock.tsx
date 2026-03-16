import React, { useState } from "react";
import Input from "../Input";
import Button from "../Button";
import Label from "../Label";
import { createDock } from "../../API/serviceDok";
import { t, getLang } from "../../Helper/i18n";

const AdminCrareDock = () => {
  const [name, setName] = useState("");
  const [alias, setAlias] = useState("");
  const [isActive, setIstActive] = useState(true);

  const handleCheckboxChange = () => {
    setIstActive(!isActive);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    const res = createDock({
        name: name, alias: alias, is_active: isActive
    })
    console.log(res)
  }
  return (
    <div className="bg-white p-6 rounded-md shadow-sm slot-form-card">
      <h2 className="text-2xl font-bold mb-4">
        {t('form_add_dock', getLang())}
      </h2>
      <form
        className="flex flex-col gap-6"
           onSubmit={handleSubmit}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group w-full">
            <Label label={t('dock_name', getLang())} />
            <Input
              type="text"
              name="nameDock"
              value={name}
              onChange={(val) => setName(String(val))}
            />
          </div>
          <div className="form-group w-full">
            <Label label={t('alias', getLang())} />
            <Input
              type="text"
              name="nameDock"
              value={alias}
              onChange={(val) => setAlias(String(val))}
            />
          </div>
          <div className="form-group w-full">
            <input
              type="checkbox"
              id="moj-checkbox"
              checked={isActive}
              onChange={handleCheckboxChange}
              className="w-5 h-5 text-blue-600 bg-white border-gray-300 rounded cursor-pointer focus:ring-blue-500 focus:ring-2 transition-colors duration-200"
            />
            <label
              htmlFor="moj-checkbox"
              className="ml-3 text-sm font-medium text-gray-700 cursor-pointer select-none"
            >
              {isActive ? t('active_male', getLang()) : t('inactive_male', getLang())}
            </label>
          </div>
        </div>
        <div className="mt-4 text-right">
          <Button
            type="submit"
            className="w-full md:w-[200px] primary pt-5"
            text={t('add_new_dock', getLang())}
            onClick={() => {}}
          />
        </div>
      </form>
    </div>
  );
};

export default AdminCrareDock;
