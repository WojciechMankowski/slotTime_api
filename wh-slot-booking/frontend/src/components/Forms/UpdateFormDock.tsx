import { patchUser } from "../../API/serviceUser";
import React, { useState, useEffect } from "react";
import Input from "../Input";
import Select from "../Select";
import Button from "../Button";
import Label from "../Label";
import { DokTyp } from "../../Types/DokType";
import { getLang, t } from "../../Helper/i18n";
import { patchDock } from "../../API/serviceDok";
const UpdateFormDock = ({
  setIsEdit,
  dock,
  onSuccess,
}: {
  setIsEdit: React.Dispatch<React.SetStateAction<boolean>>;
  dock: DokTyp;
  onSuccess?: () => void;
}) => {
  const [name, setName] = useState(dock.name);
  const [alias, setAlias] = useState(dock.alias);
  const [isActive, setIstActive] = useState(dock.is_active);

  const update = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await patchDock(dock.id, {
        id: dock.id,
        name: name,
        alias: alias,
        is_active: isActive,
      });
      if (onSuccess) onSuccess();
      setIsEdit(false);
    } catch (err) {
      console.error("Błąd aktualizacji doku:", err);
    }
  };

  const handleCheckboxChange = () => {
    setIstActive(!isActive);
  };

  return (
    <div className="bg-white p-6 rounded-md shadow-sm slot-form-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-l font-bold mb-4">Edycja doku {name}</h3>
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
            <Label label={t("dock_name", getLang())} />
            <Input
              type="text"
              name="nameDock"
              value={name}
              onChange={(val) => setName(String(val))}
            />
          </div>
          <div className="form-group w-full">
            <Label label={t("alias", getLang())} />
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
              {isActive
                ? t("active_male", getLang())
                : t("inactive_male", getLang())}
            </label>
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

export default UpdateFormDock;
