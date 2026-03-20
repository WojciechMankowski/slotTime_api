import React, { useState } from "react";
import Input from "../UI/Input";
import Button from "../UI/Button";
import Label from "../UI/Label";
import Checkbox from "../UI/Checkbox";
import { createDock } from "../../API/serviceDok";
import { t, getLang } from "../../Helper/i18n";

const AdminCreateDock = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [name, setName] = useState("");
  const [alias, setAlias] = useState("");
  const [isActive, setIstActive] = useState(true);

  const handleCheckboxChange = () => {
    setIstActive(!isActive);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createDock({
        name: name,
        alias: alias,
        is_active: isActive,
      });
      setName("");
      setAlias("");
      setIstActive(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Błąd tworzenia doku:", err);
    }
  };
  return (
    <div className="bg-white p-6 rounded-md shadow-sm slot-form-card">
      <h2 className="text-2xl font-bold mb-4">
        {t("form_add_dock", getLang())}
      </h2>
      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group w-full">
            <Label label={t("dock_name", getLang())} />
            <Input
              type="text"
              name="nameDock"
              value={name}
              onChange={(val)  => setName(String(val))}
            />
          </div>
          <div className="form-group w-full">
            <Label label={t("alias", getLang())} />
            <Input
              type="text"
              name="nameDock"
              value={alias}
              onChange={(val)  => setAlias(String(val))}
            />
          </div>
          <div className="form-group w-full">
            <Checkbox
              id="moj-checkbox"
              checked={isActive}
              onChange={setIstActive}
              label={isActive ? t("active_male", getLang()) : t("inactive_male", getLang())}
            />
          </div>
        </div>
        <div className="mt-4 text-right">
          <Button
            type="submit"
            className="w-full md:w-[200px] primary pt-5"
            text={t("add_new_dock", getLang())}
          />
        </div>
      </form>
    </div>
  );
};

export default AdminCreateDock;
