import React from "react";
import Overlay from "../ui/Overlay";
import Spinner from "../ui/Spinner";
import ErrorBanner from "../ui/ErrorBanner";
import NoticeField from "../ui/NoticeField";
import { t, Lang } from "../../Helper/i18n";
import type { Slot } from "../../Types/SlotType";
import type { NoticePayload } from "../../API/serviceSlot";

interface NoticeModalProps {
  slot: Slot;
  lang: Lang;
  form: NoticePayload;
  errors: Partial<Record<keyof NoticePayload, string>>;
  submitting: boolean;
  submitErr: string | null;
  onFormChange: (updater: (prev: NoticePayload) => NoticePayload) => void;
  onClearError: (field: keyof NoticePayload) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export default function NoticeModal({
  slot,
  lang,
  form,
  errors,
  submitting,
  submitErr,
  onFormChange,
  onClearError,
  onSubmit,
  onClose,
}: NoticeModalProps) {
  return (
    <Overlay onClose={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-linear-to-br from-indigo-600 to-indigo-800 px-7 py-5 shrink-0">
          <h3 className="text-xl font-bold text-white mb-0.5">
            {t("notice_form_title", lang)}
          </h3>
          <p className="text-indigo-200 text-sm">
            {t("notice_form_desc", lang)}
          </p>
          <p className="text-indigo-300 text-xs mt-1">
            {new Date(slot.start_dt).toLocaleString(
              lang === "pl" ? "pl-PL" : "en-GB"
            )}
            {" – "}
            {new Date(slot.end_dt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Scrollable body */}
        <div className="px-7 py-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <NoticeField
              label={t("notice_order_no", lang)}
              value={form.numer_zlecenia}
              error={errors.numer_zlecenia}
              onChange={(v) => onFormChange((f) => ({ ...f, numer_zlecenia: v }))}
              onFocus={() => onClearError("numer_zlecenia")}
            />
            <NoticeField
              label={t("notice_reference", lang)}
              value={form.referencja}
              error={errors.referencja}
              onChange={(v) => onFormChange((f) => ({ ...f, referencja: v }))}
              onFocus={() => onClearError("referencja")}
            />
            <NoticeField
              label={t("notice_truck_plate", lang)}
              value={form.rejestracja_auta}
              error={errors.rejestracja_auta}
              onChange={(v) => onFormChange((f) => ({ ...f, rejestracja_auta: v }))}
              onFocus={() => onClearError("rejestracja_auta")}
            />
            <NoticeField
              label={t("notice_trailer_plate", lang)}
              value={form.rejestracja_naczepy}
              error={errors.rejestracja_naczepy}
              onChange={(v) => onFormChange((f) => ({ ...f, rejestracja_naczepy: v }))}
              onFocus={() => onClearError("rejestracja_naczepy")}
            />
            <NoticeField
              label={t("notice_pallets", lang)}
              value={String(form.ilosc_palet)}
              error={errors.ilosc_palet}
              type="number"
              onChange={(v) => onFormChange((f) => ({ ...f, ilosc_palet: parseInt(v) || 0 }))}
              onFocus={() => onClearError("ilosc_palet")}
            />
            <NoticeField
              label={t("notice_driver_name", lang)}
              value={form.kierowca_imie_nazwisko ?? ""}
              onChange={(v) => onFormChange((f) => ({ ...f, kierowca_imie_nazwisko: v }))}
            />
            <NoticeField
              label={t("notice_driver_phone", lang)}
              value={form.kierowca_tel ?? ""}
              type="tel"
              onChange={(v) => onFormChange((f) => ({ ...f, kierowca_tel: v }))}
            />
          </div>

          {/* Remarks */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              {t("notice_remarks", lang)}
            </label>
            <textarea
              rows={3}
              value={form.uwagi ?? ""}
              onChange={(e) =>
                onFormChange((f) => ({ ...f, uwagi: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              placeholder={t("add_remarks", lang)}
            />
          </div>

          {submitErr && <ErrorBanner msg={submitErr} compact />}

          {/* Actions */}
          <div className="flex gap-3 mt-2">
            <button
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {t("cancel_btn", lang)}
            </button>
            <button
              id="btn-notice-submit"
              onClick={onSubmit}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm transition-colors shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Spinner />
                  {t("notice_submitting", lang)}
                </>
              ) : (
                t("notice_submit", lang)
              )}
            </button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}
