import React from "react";
import { TableProps } from "../Types/Props";
import { Slot } from "../Types/SlotType";

export default function Table({
  columns,
  rows,
  docks = [],
  onDockChange,
  className = "",
}: TableProps) {
  
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>, rowId:  number) => {
    const selectedAlias = e.target.value;
    const selectedDock = docks.find((dock) => dock.alias === selectedAlias);
    if (onDockChange && selectedDock) {
      onDockChange(rowId, selectedDock.id);
    } 
  };

  return (
    <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200">
      <table className={`min-w-full divide-y divide-gray-200 ${className}`}>
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows?.map((row: Slot, index: number) => {
            const rowId = row.id ?? index;
            
            return (
              <tr key={rowId}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(row.start_dt).toLocaleString("pl-PL")}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(row.end_dt).toLocaleString("pl-PL")}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.slot_type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.status}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <select
                    value={row.dock_alias ?? "--"}
                    onChange={(e) => handleSelectChange(e, rowId)}
                     className="block w-full min-w-[160px] rounded-md border border-gray-300 
             shadow-sm text-sm py-2 px-3
             focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">--</option>
                    {docks.map((dock) => (
                      <option key={dock.id} value={dock.alias}>
                        {dock.alias}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.reserved_by_alias}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 cursor-pointer hover:underline">
                  Akcja
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}