import React, { useState } from "react";
import { t, Lang, errorText } from "../Helper/i18n";
import { Me } from "../Types/types";
import useAdminDocks from "../hooks/useAdminDocks";
import { deleteDock } from "../API/serviceDok";
import { getApiError } from "../Helper/helper";
import AdminCreateDock from "../components/Forms/AdminCreateDock";
import ErrorBanner from "../components/UI/ErrorBanner";
import Spinner from "../components/UI/Spinner";
import AdminDocksTable from "../components/Admin/AdminDocksTable";
import UpdateFormDock from "../components/Forms/UpdateFormDock";
import ConfirmDeleteModal from "../components/UI/ConfirmDeleteModal";

export default function AdminDocks({ lang, me }: { lang: Lang; me: Me }) {
  const { doks, loading, loadErr, isEdit, dok, setIsEdit, setDock, reload } =
    useAdminDocks();
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteErr(null);
    setIsDeleting(true);
    try {
      await deleteDock(deleteTarget.id);
      setDeleteTarget(null);
      reload();
    } catch (err) {
      const code = getApiError(err);
      setDeleteErr(errorText[code] ? errorText[code][lang] : code);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-6">
        <AdminCreateDock onSuccess={reload} />
      </div>

      {loadErr && <ErrorBanner msg={loadErr} />}
      {deleteErr && <ErrorBanner msg={deleteErr} />}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
          <Spinner />
          <span className="text-sm font-medium">{t("loading", lang)}</span>
        </div>
      ) : (
        <AdminDocksTable
          rows={doks}
          lang={lang}
          setIsEdit={setIsEdit}
          setDock={setDock}
          onDelete={me.role === "superadmin" ? (id) => {
            const d = doks.find(d => d.id === id);
            setDeleteTarget({ id, name: d?.name ?? String(id) });
            setDeleteErr(null);
          } : undefined}
        />
      )}

      {isEdit && (
        <UpdateFormDock
          dock={dok}
          lang={lang}
          onClose={() => setIsEdit(false)}
          onSuccess={reload}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          lang={lang}
          title={deleteTarget.name}
          isDeleting={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
