import React, { useState } from "react";
import { t, Lang, errorText } from "../Helper/i18n";
import { Me } from "../Types/types";
import useAdminUsers from "../hooks/useAdminUsers";
import { deleteUser } from "../API/serviceUser";
import { getApiError } from "../Helper/helper";
import ErrorBanner from "../components/UI/ErrorBanner";
import Spinner from "../components/UI/Spinner";
import AdminCreateUser from "../components/Forms/AdminCreateUser";
import AdminUsersTable from "../components/Admin/AdminUsersTable";
import UpdateFormUser from "../components/Forms/UpdateFormUser";
import ConfirmDeleteModal from "../components/UI/ConfirmDeleteModal";

export default function AdminUsers({ lang, me }: { lang: Lang; me: Me }) {
  const { users, loading, loadErr, isEdit, user, setIsEdit, setUser, reload } =
    useAdminUsers();
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteErr(null);
    setIsDeleting(true);
    try {
      await deleteUser(deleteTarget.id);
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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          {t("users", lang)}
        </h1>
        <p className="text-gray-500 text-sm">
          {t("system_subtitle", lang)} (Admin)
        </p>
      </div>

      {/* Create form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="bg-linear-to-br from-indigo-600 to-indigo-800 px-7 py-4">
          <h2 className="text-lg font-bold text-white leading-none">
            {t("add_user", lang)}
          </h2>
        </div>
        <div className="p-7">
          <AdminCreateUser onSuccess={reload} isSuperadmin={me.role === "superadmin"} />
        </div>
      </div>

      {loadErr && <ErrorBanner msg={loadErr} />}
      {deleteErr && <ErrorBanner msg={deleteErr} />}

      {/* Users cards */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
          <Spinner />
          <span className="text-sm font-medium">{t("loading", lang)}</span>
        </div>
      ) : (
        <AdminUsersTable
          rows={users}
          lang={lang}
          setIsEdit={setIsEdit}
          setUser={setUser}
          onDelete={me.role === "superadmin" ? (id) => {
            const u = users.find(u => u.id === id);
            setDeleteTarget({ id, name: u?.username ?? String(id) });
            setDeleteErr(null);
          } : undefined}
        />
      )}

      {/* Edit modal */}
      {isEdit && (
        <UpdateFormUser
          user={user}
          lang={lang}
          isSuperadmin={me.role === "superadmin"}
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
