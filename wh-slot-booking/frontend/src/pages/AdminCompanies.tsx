import React, { useState } from "react";
import { t, Lang, errorText } from "../Helper/i18n";
import { Me } from "../Types/types";
import useAdminCompanies from "../hooks/useAdminCompanies";
import { deleteCompany } from "../API/serviceCopany";
import { getApiError } from "../Helper/helper";
import ErrorBanner from "../components/UI/ErrorBanner";
import Spinner from "../components/UI/Spinner";
import CreateNewCompany from "../components/Forms/CreateNewCompany";
import AdminCompaniesTable from "../components/Admin/AdminCompaniesTable";
import UpdateFormCompany from "../components/Forms/UpdateFormCompany";
import ConfirmDeleteModal from "../components/UI/ConfirmDeleteModal";

export default function AdminCompanies({ lang, me }: { lang: Lang; me: Me }) {
  const { companies, loading, loadErr, reload, isEdit, company, setIsEdit, setCompany } = useAdminCompanies();
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteErr(null);
    setIsDeleting(true);
    try {
      await deleteCompany(deleteTarget.id);
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
          {t("companies", lang)}
        </h1>
        <p className="text-gray-500 text-sm">
          {t("system_subtitle", lang)} (Admin)
        </p>
      </div>

      {/* Create form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="bg-linear-to-br from-indigo-600 to-indigo-800 px-7 py-4">
          <h2 className="text-lg font-bold text-white leading-none">
            {t("create_new_company", lang)}
          </h2>
        </div>
        <div className="p-7">
          <CreateNewCompany serverError={null} />
        </div>
      </div>

      {loadErr && <ErrorBanner msg={loadErr} />}
      {deleteErr && <ErrorBanner msg={deleteErr} />}

      {/* Companies cards */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
          <Spinner />
          <span className="text-sm font-medium">{t("loading", lang)}</span>
        </div>
      ) : (
        <AdminCompaniesTable
          rows={companies}
          lang={lang}
          setIsEdit={setIsEdit}
          setCompany={setCompany}
          onDelete={me.role === "superadmin" ? (id) => {
            const c = companies.find(c => c.id === id);
            setDeleteTarget({ id, name: c?.name ?? String(id) });
            setDeleteErr(null);
          } : undefined}
        />
      )}

      {isEdit && (
        <UpdateFormCompany
          company={company}
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
