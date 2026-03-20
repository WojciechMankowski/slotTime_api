import React from "react";
import { Slot } from "../../Types/SlotType";
import { DokTyp } from "../../Types/DokType";
import { t, Lang } from "../../Helper/i18n";

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  AVAILABLE:                { bg: "bg-emerald-100", text: "text-emerald-800" },
  BOOKED:                   { bg: "bg-amber-100",   text: "text-amber-800"   },
  APPROVED_WAITING_DETAILS: { bg: "bg-blue-100",    text: "text-blue-800"    },
  RESERVED_CONFIRMED:       { bg: "bg-indigo-100",  text: "text-indigo-800"  },
  COMPLETED:                { bg: "bg-gray-100",    text: "text-gray-600"    },
  CANCELLED:                { bg: "bg-red-100",     text: "text-red-700"     },
  CANCEL_PENDING:           { bg: "bg-orange-100",  text: "text-orange-700"  },
};

interface TableAdminSlotProps {
  rows: Slot[];
  docks: DokTyp[];
  lang: Lang;
  className?: string;
  onDockChange: (slotId: number, dockId: number) => void;
  onStatusChange: (slotId: number, newStatus: string) => void;
  onApprove: (slotId: number) => void;
  onApproveCancel: (slotId: number) => void;
  onRejectCancel: (slotId: number) => void;
}

export default function TableAdminSlot({
  rows,
  docks = [],
  lang,
  onDockChange,
  onStatusChange,
  onApprove,
  onApproveCancel,
  onRejectCancel,
  className = "",
}: TableAdminSlotProps) {
  const handleDockChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    slotId: number,
  ) => {
    const selectedDock = docks.find((dock) => dock.alias === e.target.value);
    if (selectedDock) {
      onDockChange(slotId, selectedDock.id);
    }
  };

  const columns = [
    t("start", lang),
    t("end", lang),
    t("type", lang),
    t("status", lang),
    t("dock", lang),
    t("company", lang),
    t("action", lang),
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className={`min-w-full divide-y divide-gray-200 ${className}`}>
        <thead className="bg-gray-50/50">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                scope="col"
                className="px-6 py-4 text-left text-[0.7rem] font-bold text-gray-400 uppercase tracking-widest"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {rows?.map((row: Slot, index: number) => {
            const slotId = row.id ?? index;
            const statusStyle = STATUS_STYLE[row.status] ?? { bg: "bg-gray-100", text: "text-gray-600" };

            return (
              <tr key={slotId} className={`transition-colors group ${row.status === "CANCEL_PENDING" ? "bg-orange-50 hover:bg-orange-100/70" : "hover:bg-blue-50/30"}`}>
                {/* Start */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-semibold text-gray-900">
                    {new Date(row.start_dt).toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" })}
                  </span>
                  <span className="text-sm font-bold text-blue-600 ml-2">
                    {new Date(row.start_dt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </td>

                {/* End */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                  {new Date(row.end_dt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </td>

                {/* Type */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-[0.65rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    row.slot_type === "INBOUND" ? "bg-blue-100 text-blue-700" :
                    row.slot_type === "OUTBOUND" ? "bg-emerald-100 text-emerald-700" :
                    "bg-purple-100 text-purple-700"
                  }`}>
                    {t(row.slot_type.toLowerCase() as any, lang)}
                  </span>
                </td>

                {/* Status — editable select */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={row.status}
                    onChange={(e) => onStatusChange(slotId, e.target.value)}
                    className={`block w-fit min-w-[160px] rounded-xl border-none shadow-sm text-xs font-bold py-1.5 px-3 focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all ${statusStyle.bg} ${statusStyle.text}`}
                  >
                    <option value="AVAILABLE">{t("available", lang)}</option>
                    <option value="BOOKED">{t("booked", lang)}</option>
                    <option value="APPROVED_WAITING_DETAILS">{t("approved_waiting_details", lang)}</option>
                    <option value="RESERVED_CONFIRMED">{t("reserved_confirmed", lang)}</option>
                    <option value="COMPLETED">{t("completed", lang)}</option>
                    <option value="CANCELLED">{t("cancelled", lang)}</option>
                    <option value="CANCEL_PENDING">{t("cancel_pending", lang)}</option>
                  </select>
                </td>

                {/* Dock — editable select */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={row.dock_alias ?? ""}
                    onChange={(e) => handleDockChange(e, slotId)}
                    className="block w-fit min-w-[120px] rounded-xl border border-gray-200 shadow-sm text-sm font-bold py-1.5 px-3 focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition-all cursor-pointer"
                  >
                    <option value="">--</option>
                    {docks.map((dock) => (
                      <option key={dock.id} value={dock.alias}>
                        {dock.alias}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Company */}
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {row.reserved_by_company_alias ? (
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900">{row.reserved_by_company_alias}</span>
                      {row.reserved_by_alias && <span className="text-[0.65rem] text-gray-400 font-medium italic">{row.reserved_by_alias}</span>}
                    </div>
                  ) : row.reserved_by_alias ? (
                    <span className="text-gray-500 italic font-medium">{row.reserved_by_alias}</span>
                  ) : (
                    <span className="text-gray-300 font-light">—</span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {row.status === "BOOKED" && (
                      <button
                        onClick={() => onApprove(slotId)}
                        className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 px-3 py-1.5 rounded-xl transition-all shadow-md hover:shadow-lg whitespace-nowrap"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {t("approve", lang)}
                      </button>
                    )}

                    {row.status === "CANCEL_PENDING" && (
                      <div className="flex flex-col gap-1.5">
                        <button
                          onClick={() => onApproveCancel(slotId)}
                          className="flex items-center gap-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 px-4 py-2 rounded-xl transition-all shadow-md hover:shadow-lg whitespace-nowrap ring-2 ring-red-300"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                          {t("approve_cancel", lang)}
                        </button>
                        <button
                          onClick={() => onRejectCancel(slotId)}
                          className="flex items-center gap-2 text-xs font-bold text-orange-800 bg-orange-200 hover:bg-orange-300 active:bg-orange-400 px-4 py-2 rounded-xl transition-all whitespace-nowrap"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.64" />
                          </svg>
                          {t("reject_cancel", lang)}
                        </button>
                      </div>
                    )}

                    {row.status === "AVAILABLE" ? (
                      <button
                        onClick={() => onStatusChange(slotId, "CANCELLED")}
                        className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all group-hover:bg-gray-50"
                        title={t("close_slot", lang)}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    ) : row.status === "BOOKED" || row.status === "APPROVED_WAITING_DETAILS" ? (
                      <button
                        onClick={() => onStatusChange(slotId, "AVAILABLE")}
                        className="p-2 rounded-xl text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-all group-hover:bg-gray-50"
                        title={t("cancel_reservation", lang)}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.64" />
                        </svg>
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {rows?.length === 0 && (
        <div className="text-center py-20 text-gray-300">
          <svg className="mx-auto mb-4 opacity-20" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <p className="text-lg font-medium">{t("no_available_slots", lang)}</p>
        </div>
      )}
    </div>
  );
}