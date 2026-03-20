import React from "react";
import { t, Lang } from "../Helper/i18n";
import useAdminDocks from "../hooks/useAdminDocks";
import AdminCreateDock from "../components/Forms/AdminCreateDock";
import ErrorBanner from "../components/UI/ErrorBanner";
import Spinner from "../components/UI/Spinner";
import AdminDocksTable from "../components/Admin/AdminDocksTable";
import UpdateFormDock from "../components/Forms/UpdateFormDock";

export default function AdminDocks({ lang }: { lang: Lang }) {
  const { doks, loading, loadErr, isEdit, dok, setIsEdit, setDock, reload } =
    useAdminDocks();

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-6">
        <AdminCreateDock onSuccess={reload} />
      </div>

      {loadErr && <ErrorBanner msg={loadErr} />}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
          <Spinner />
          <span className="text-sm font-medium">{t("loading", lang)}</span>
        </div>
      ) : (
        <div className="flex gap-6 mt-4">
          <div className="flex-1">
            <AdminDocksTable
              rows={doks}
              lang={lang}
              setIsEdit={setIsEdit}
              setDock={setDock}
            />
          </div>

          {isEdit && (
            <div className="w-96 bg-white rounded-2xl shadow-sm border border-gray-200 p-5 self-start">
              <UpdateFormDock setIsEdit={setIsEdit} dock={dok} onSuccess={reload} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}