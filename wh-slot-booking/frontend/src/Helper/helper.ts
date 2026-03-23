import axios from "axios";
import { Slot } from "../Types/SlotType";
import { Lang } from "./i18n";

export function formatDate(dt: string, lang: Lang): string {
  return new Date(dt).toLocaleDateString(lang === "pl" ? "pl-PL" : "en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatTime(dt: string): string {
  return new Date(dt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function groupByDay(slots: Slot[]): Record<string, Slot[]> {
  return slots.reduce<Record<string, Slot[]>>((acc, slot) => {
    const day = slot.start_dt.slice(0, 10);
    if (!acc[day]) acc[day] = [];
    acc[day].push(slot);
    return acc;
  }, {});
}

export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (detail?.error_code) return detail.error_code;
    if (typeof detail === "string") return detail;
    if (error.response?.status === 403) return "COMPANY_INACTIVE";
    return error.message || "CONNECTION_ERROR";
  }
  return "UNKNOWN_ERROR";
}

export const STATUS_STYLE: Record<string, { bg: string; text: string; label_pl: string; label_en: string }> = {
  BOOKED:                   { bg: "bg-amber-100",   text: "text-amber-800",   label_pl: "Zarezerwowany",           label_en: "Booked" },
  APPROVED_WAITING_DETAILS: { bg: "bg-blue-100",    text: "text-blue-800",    label_pl: "Oczekuje na szczegóły",   label_en: "Awaiting details" },
  RESERVED_CONFIRMED:       { bg: "bg-emerald-100", text: "text-emerald-800", label_pl: "Potwierdzone",            label_en: "Confirmed" },
  COMPLETED:                { bg: "bg-gray-100",    text: "text-gray-600",    label_pl: "Zakończony",              label_en: "Completed" },
  CANCELLED:                { bg: "bg-red-100",     text: "text-red-700",     label_pl: "Anulowany",              label_en: "Cancelled" },
  CANCEL_PENDING:           { bg: "bg-orange-100",  text: "text-orange-700",  label_pl: "Oczekuje na anulowanie", label_en: "Cancel pending" },
};

export const TYPE_STYLE: Record<string, string> = {
  INBOUND:  "bg-blue-100 text-blue-800",
  OUTBOUND: "bg-emerald-100 text-emerald-800",
  ANY:      "bg-purple-100 text-purple-800",
};
