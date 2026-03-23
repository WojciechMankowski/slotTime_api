import React, { useEffect, useState } from "react";
import { t, Lang, errorText } from "../Helper/i18n";
import { Warehouse } from "../Types/types";
import { getWarehouses, createWarehouse, patchWarehouse, deleteWarehouse, WarehouseCreate } from "../API/serviceWarehouse";
import { getApiError } from "../Helper/helper";
import ErrorBanner from "../components/UI/ErrorBanner";
import Spinner from "../components/UI/Spinner";
import ConfirmDeleteModal from "../components/UI/ConfirmDeleteModal";

interface WarehouseFormData {
  name: string;
  alias: string;
  location: string;
  is_active: boolean;
}

const emptyForm = (): WarehouseFormData => ({
  name: "",
  alias: "",
  location: "",
  is_active: true,
});

function WarehouseModal({
  lang,
  initial,
  saving,
  error,
  onSubmit,
  onClose,
}: {
  lang: Lang;
  initial?: Warehouse;
  saving: boolean;
  error: string | null;
  onSubmit: (data: WarehouseFormData) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<WarehouseFormData>(
    initial
      ? { name: initial.name, alias: initial.alias, location: initial.location ?? "", is_active: initial.is_active }
      : emptyForm()
  );
  const [validationErr, setValidationErr] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setValidationErr(t("warehouse_name_required", lang)); return; }
    if (!form.alias.trim()) { setValidationErr(t("warehouse_alias_required", lang)); return; }
    setValidationErr(null);
    onSubmit(form);
  };

  const inputCls = "w-full px-3 py-2 rounded-xl border border-(--border) text-sm bg-(--bg) text-(--text-main) focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const labelCls = "block text-xs font-semibold text-(--text-muted) mb-1";

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-(--card-bg) rounded-2xl shadow-xl w-full max-w-md">
        <div className="bg-linear-to-br from-indigo-600 to-indigo-800 px-6 py-4 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">
            {initial ? t("edit_warehouse", lang) : t("create_new_warehouse", lang)}
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {(validationErr || error) && <ErrorBanner msg={validationErr ?? error!} />}

          <div>
            <label className={labelCls}>{t("warehouse_name", lang)} *</label>
            <input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>

          <div>
            <label className={labelCls}>{t("warehouse_alias", lang)} *</label>
            <input className={inputCls} value={form.alias} onChange={e => setForm(f => ({ ...f, alias: e.target.value }))} />
          </div>

          <div>
            <label className={labelCls}>{t("location", lang)}</label>
            <input className={inputCls} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="wh_active"
              checked={form.is_active}
              onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
              className="w-4 h-4 accent-indigo-600"
            />
            <label htmlFor="wh_active" className="text-sm font-medium text-(--text-main) cursor-pointer">
              {t("is_active", lang)}
            </label>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-(--border) text-sm font-medium text-(--text-muted) hover:bg-(--accent-soft) transition-colors">
              {t("cancel_btn", lang)}
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow transition-colors disabled:opacity-50">
              {saving ? t("saving", lang) : t("save_changes", lang)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminWarehouses({ lang }: { lang: Lang }) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [createErr, setCreateErr] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [editTarget, setEditTarget] = useState<Warehouse | null>(null);
  const [editErr, setEditErr] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Warehouse | null>(null);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    setLoadErr(null);
    try {
      setWarehouses(await getWarehouses());
    } catch (err) {
      const code = getApiError(err);
      setLoadErr(errorText[code] ? errorText[code][lang] : code);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (data: WarehouseFormData) => {
    setCreating(true);
    setCreateErr(null);
    try {
      const payload: WarehouseCreate = { name: data.name, alias: data.alias, is_active: data.is_active };
      if (data.location.trim()) payload.location = data.location.trim();
      await createWarehouse(payload);
      setShowCreate(false);
      load();
    } catch (err) {
      const code = getApiError(err);
      setCreateErr(errorText[code] ? errorText[code][lang] : code);
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async (data: WarehouseFormData) => {
    if (!editTarget) return;
    setEditing(true);
    setEditErr(null);
    try {
      const payload: WarehouseCreate = { name: data.name, alias: data.alias, is_active: data.is_active };
      if (data.location.trim()) payload.location = data.location.trim();
      await patchWarehouse(editTarget.id, payload);
      setEditTarget(null);
      load();
    } catch (err) {
      const code = getApiError(err);
      setEditErr(errorText[code] ? errorText[code][lang] : code);
    } finally {
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteErr(null);
    try {
      await deleteWarehouse(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      const code = getApiError(err);
      setDeleteErr(errorText[code] ? errorText[code][lang] : code);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">{t("warehouses", lang)}</h1>
          <p className="text-gray-500 text-sm">{t("system_subtitle", lang)} (Superadmin)</p>
        </div>
        <button
          onClick={() => { setCreateErr(null); setShowCreate(true); }}
          className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow transition-colors"
        >
          + {t("create_new_warehouse", lang)}
        </button>
      </div>

      {loadErr && <ErrorBanner msg={loadErr} />}
      {deleteErr && <ErrorBanner msg={deleteErr} />}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
          <Spinner />
          <span className="text-sm font-medium">{t("loading", lang)}</span>
        </div>
      ) : warehouses.length === 0 ? (
        <div className="text-center py-16 text-(--text-muted)">
          <p className="text-lg font-semibold mb-1">{t("no_warehouses", lang)}</p>
          <p className="text-sm">{t("create_new_warehouse", lang)}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {warehouses.map(wh => (
            <div key={wh.id} className="bg-(--card-bg) rounded-2xl border border-(--border) shadow-sm p-5 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-base text-(--text-main)">{wh.name}</div>
                  <div className="text-xs text-(--text-muted) font-mono mt-0.5">{wh.alias}</div>
                </div>
                <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-full ${
                  wh.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                }`}>
                  {wh.is_active ? t("active_male", lang) : t("inactive", lang)}
                </span>
              </div>

              {wh.location && (
                <div className="text-xs text-(--text-muted)">
                  <span className="font-semibold">{t("location", lang)}:</span> {wh.location}
                </div>
              )}

              <div className="mt-auto flex justify-end gap-3">
                <button
                  onClick={() => { setEditErr(null); setEditTarget(wh); }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  {t("edit_warehouse", lang)}
                </button>
                <button
                  onClick={() => { setDeleteErr(null); setDeleteTarget(wh); }}
                  className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
                >
                  {t("delete_btn", lang)}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <WarehouseModal
          lang={lang}
          saving={creating}
          error={createErr}
          onSubmit={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      )}

      {editTarget && (
        <WarehouseModal
          lang={lang}
          initial={editTarget}
          saving={editing}
          error={editErr}
          onSubmit={handleEdit}
          onClose={() => setEditTarget(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          lang={lang}
          title={deleteTarget.name}
          isDeleting={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
