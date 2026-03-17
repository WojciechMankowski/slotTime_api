import { AdminUsersTableProps } from "../../Types/Props";
import { UserOut } from "../../Types/types";
import Button from "../Button";

const AdminUsersTable = ({
  columns,
  rows,
  className = "", isEdit, setIsEdit, setUser
}: AdminUsersTableProps) => {
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
          {rows?.map((row: UserOut, index: number) => {
            const rowId = row.id ?? index;

            return (
              <tr key={rowId}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row.username}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row.alias}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row.role}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row.company_alias || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row.warehouse_alias || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <Button text="Edytuj" onClick={()=> {
                    setUser(row)
                    setIsEdit(true)}} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AdminUsersTable;
