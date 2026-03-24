import React from "react";
import Overlay from "../UI/Overlay";
import Spinner from "../UI/Spinner";
import ErrorBanner from "../UI/ErrorBanner";
import { t, Lang } from "../../Helper/i18n";

interface CancelModalProps {
  lang: Lang;
  cancelling: boolean;
  cancelErr: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

export default function CancelModal({
  lang,
  cancelling,
  cancelErr,
  onConfirm,
  onClose,
}: CancelModalProps) {
  return (
    <Overlay onClose={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">
        <div className="bg-linear-to-br from-red-500 to-red-700 px-7 py-5">
          <h3 className="text-xl font-bold text-white mb-0.5">
            {t("request_cancel", lang)}
          </h3>
          <p className="text-red-200 text-sm">
            {t("cancel_confirm_desc", lang)}
          </p>
        </div>
        <div className="px-7 py-6">
          {cancelErr && <ErrorBanner msg={cancelErr} compact />}
          <div className="flex gap-3 mt-2">
            <button
              onClick={onClose}
              disabled={cancelling}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {t("cancel_btn", lang)}
            </button>
            <button
              id="btn-confirm-cancel"
              onClick={onConfirm}
              disabled={cancelling}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold text-sm transition-colors shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {cancelling ? (
                <>
                  <Spinner />
                  {t("cancelling", lang)}
                </>
              ) : (
                t("yes_cancel", lang)
              )}
            </button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}
