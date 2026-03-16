import { AdminDocksTableProps } from "../../Types/Props";
import { DokTyp } from "../../Types/DokType";
import { t, getLang } from "../../Helper/i18n";

const AdminDocksTable = ({
  columns,
  rows,
  className = "",
}: AdminDocksTableProps) => {
  console.table(rows)
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse text-[0.85rem] text-left">
        <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-4 py-3 font-semibold">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows?.map((row: DokTyp, index: number) => {
            const rowId = row.id ?? index;

            return (
              <tr key={rowId} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2.5">{row.alias}</td>
                <td className="px-4 py-2.5">{row.name}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border uppercase tracking-wide ${
                      row.is_active
                        ? "bg-green-50 text-green-800 border-green-200"
                        : "bg-red-50 text-red-800 border-red-200"
                    }`}
                  >
                    {row.is_active ? t('active_male', getLang()) : t('inactive_male', getLang())}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-blue-600 cursor-pointer hover:underline">
                  {t('edit', getLang())}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDocksTable;
