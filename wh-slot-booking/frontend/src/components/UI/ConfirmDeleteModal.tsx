import React from "react";
import { t, Lang } from "../../Helper/i18n";
import Overlay from "./Overlay";
import Button from "./Button";
import Spinner from "./Spinner";

interface ConfirmDeleteModalProps {
  lang: Lang;
  title: string;
  desc?: string;
  isDeleting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDeleteModal({
  lang,
  title,
  desc,
  isDeleting = false,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  return (
    <Overlay onClose={onCancel}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-br from-red-600 to-red-700 px-7 py-5">
          <div className="flex items-center gap-3">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
            <h3 className="text-xl font-bold text-white mb-0">
              {t("delete_confirm_title", lang)}
            </h3>
          </div>
        </div>

        {/* Body */}
        <div className="px-7 py-6">
          <p className="text-gray-800 font-semibold mb-1">{title}</p>
          <p className="text-gray-500 text-sm mb-6">
            {desc ?? t("delete_confirm_desc", lang)}
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 rounded-full border border-gray-300 text-gray-700 text-sm font-medium bg-white hover:bg-gray-50 transition-all disabled:opacity-60"
            >
              {t("cancel_btn", lang)}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 rounded-full bg-red-600 text-white text-sm font-medium hover:bg-red-700 active:bg-red-800 transition-all shadow-md shadow-red-600/30 flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              {isDeleting ? (
                <>
                  <Spinner />
                  {t("deleting", lang)}
                </>
              ) : (
                t("delete_btn", lang)
              )}
            </button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}
