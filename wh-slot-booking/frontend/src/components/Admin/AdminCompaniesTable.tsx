import { AdminCompaniesTableProps } from "../../Types/Props";
import { Company } from "../../Types/types";
import { t, getLang } from "../../Helper/i18n";

const AdminCompaniesTable = ({
  columns,
  rows,
  className,
}: AdminCompaniesTableProps) => {
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
          {rows?.map((row: Company, index: number) => {
            const rowId = row.id ?? index;

            return (
              <tr key={rowId}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row.alias}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row.is_active ? t('active_male', getLang()) : t('inactive_male', getLang())}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AdminCompaniesTable;
