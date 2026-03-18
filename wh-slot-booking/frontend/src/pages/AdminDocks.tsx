import React, { useEffect, useState } from "react";
import { t, Lang } from "../Helper/i18n";
import AdminDocksTable from "../components/Admin/AdminDocksTable";
import { getDokAdmin } from "../API/serviceDok";
import { DokTyp } from "../Types/DokType";
import AdminCreateDock from "../components/Forms/AdminCreateDock";
import UpdateFormDock from "../components/Forms/UpdateFormDock";

export default function AdminDocks({ lang }: { lang: Lang }) {
  const [doks, setDocks] = useState<DokTyp[]>([]);
  const [isEdit, setIsEdit] = useState(false);
  const [dok, setDock] = useState<DokTyp>({
    id: 0,
    name: "",
    alias: "",
    is_active: true,
  });

  const load = async () => {
    try {
      const rs = await getDokAdmin();
      setDocks(rs);
    } catch (err) {
      console.error("Błąd ładowania doków:", err);
    }
  };
  useEffect(() => {
    load();
  }, []);

  return (
    <div className="bg-white rounded-xl border border-(--border) shadow-sm p-5 mb-6">
      <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200 pt-2">
        <AdminCreateDock onSuccess={load} />
      </div>

      <div className="flex gap-6 mt-4">
        <div className="flex-1 overflow-x-auto shadow-sm rounded-lg border border-gray-200">
          <AdminDocksTable
            columns={[t("name", lang), t("alias", lang), t("active", lang)]}
            rows={doks}
            setIsEdit={setIsEdit}
            setDock={setDock}
          />
        </div>

        {isEdit && (
          <div className="w-96 overflow-x-auto shadow-sm rounded-lg border border-gray-200 pt-4">
            <UpdateFormDock setIsEdit={setIsEdit} dock={dok} onSuccess={load} />
          </div>
        )}
      </div>
    </div>
  );
}