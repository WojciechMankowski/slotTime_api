import React from "react";
import Overlay from "../UI/Overlay";
import Spinner from "../UI/Spinner";
import ErrorBanner from "../UI/ErrorBanner";
import DetailRow from "../UI/DetailRow";
import { CalendarIcon, ClockIcon, StarIcon } from "../UI/Icons";
import { formatDate, formatTime } from "../../Helper/helper";
import { t, Lang } from "../../Helper/i18n";
import type { Slot } from "../../Types/SlotType";

interface ConfirmReservationModalProps {
  slot: Slot;
  lang: Lang;
  requestedType: "INBOUND" | "OUTBOUND";
  onRequestedTypeChange: (type: "INBOUND" | "OUTBOUND") => void;
  reserving: boolean;
  reserveErr: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmReservationModal({
  slot,
  lang,
  requestedType,
  onRequestedTypeChange,
  reserving,
  reserveErr,
  onConfirm,
  onClose,
}: ConfirmReservationModalProps) {
  return (
    <Overlay onClose={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-linear-to-br from-blue-600 to-blue-800 px-7 py-5">
          <h3 className="text-xl font-bold text-white mb-0.5">
            {t("confirm_reservation", lang)}
          </h3>
          <p className="text-blue-200 text-sm">
            {t("confirm_reservation_desc", lang)}
          </p>
        </div>

        <div className="px-7 py-6">
          <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2.5">
            <DetailRow
              icon={<CalendarIcon sm />}
              label={t("date", lang)}
              value={formatDate(slot.start_dt, lang)}
            />
            <DetailRow
              icon={<ClockIcon sm />}
              label={t("start", lang)}
              value={formatTime(slot.start_dt)}
            />
            <DetailRow
              icon={<ClockIcon sm />}
              label={t("end", lang)}
              value={formatTime(slot.end_dt)}
            />
            <DetailRow
              icon={<StarIcon sm />}
              label={t("type", lang)}
              value={t(slot.slot_type.toLowerCase() as any, lang)}
            />
          </div>

          {/* ANY type chooser */}
          {slot.slot_type === "ANY" && (
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("choose_type", lang)}
              </label>
              <div className="flex gap-3">
                {(["INBOUND", "OUTBOUND"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => onRequestedTypeChange(type)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all duration-150 ${
                      requestedType === type
                        ? "border-blue-600 bg-blue-600 text-white shadow-md"
                        : "border-gray-200 text-gray-600 hover:border-blue-300"
                    }`}
                  >
                    {t(type.toLowerCase() as any, lang)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {reserveErr && <ErrorBanner msg={reserveErr} compact />}

          <div className="flex gap-3 mt-4">
            <button
              onClick={onClose}
              disabled={reserving}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {t("cancel_btn", lang)}
            </button>
            <button
              id="btn-confirm-reserve"
              onClick={onConfirm}
              disabled={reserving}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-colors shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {reserving ? (
                <>
                  <Spinner />
                  {t("reserving", lang)}
                </>
              ) : (
                t("reserve", lang)
              )}
            </button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}
