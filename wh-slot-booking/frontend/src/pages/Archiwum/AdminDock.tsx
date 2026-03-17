import React, { useState, useEffect } from "react";
import { Lang } from "../../Helper/i18n";
import {DokTyp} from '../../Types/DokType'
import AdminCrareDock from "../../components/Forms/AdminCreateDock";
import AdminDocksTable from "../../components/Admin/AdminDocksTable";
import { getDokAdmin } from "../../API/serviceDok";


export default function AdminDock({ lang, }: { lang: Lang}) {

  const now = new Date().toISOString().split("T")[0];
  const [doks, setDokcs] = useState<DokTyp[]>([]);

  const load = async () => {
    try {
      const rs = await getDokAdmin();
      setDokcs(rs);
    } catch (err) {
      console.error("Błąd ładowania firm:", err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200 pt-2">
        <AdminCrareDock />
      </div>
      <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200 pt-4">

      </div>
      <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200">
      <AdminDocksTable  
      columns={['Nazwa', 'Alias', 'Aktywne']}
      rows={doks}
      />
      
      </div>
    </>
  );
}

