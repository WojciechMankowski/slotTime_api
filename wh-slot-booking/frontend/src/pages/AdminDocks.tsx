import React, { useEffect, useState } from 'react'
import { api } from '../API/api'
import { t, Lang, errorText } from '../Helper/i18n'
import type { Dock } from '../Types/types'
import AdminDocksTable from '../components/Admin/AdminDocksTable'
import { getDokAdmin } from '../API/serviceDok'
import { DokTyp } from '../Types/DokType'
import AdminCrareDock from '../components/Forms/AdminCreateDock'

export default function AdminDocks({ lang }: { lang: Lang }) {

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
    <div className="bg-white rounded-xl border border-[var(--border)] shadow-sm p-5 mb-6">
     <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200 pt-2">
        <AdminCrareDock />
      </div>
      <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200 pt-4">

      </div>
      <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200">
      <AdminDocksTable  
      columns={[t('name', lang), t('alias', lang), t('active', lang)]}
      rows={doks}
      />
      
      </div>
    </div>
  )
}
