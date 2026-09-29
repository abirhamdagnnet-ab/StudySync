import EmptyState from "./EmptyState.jsx";

function Table({ columns, data, rowKey = "id", emptyTitle = "No records found", emptyDescription = "Try adjusting your filters or add a new record.", className = "" }) {
  if (!data?.length) {
    return (
      <div className={`overflow-hidden rounded-xl border border-slate-200 bg-white ${className}`}>
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto rounded-xl border border-slate-200 bg-white ${className}`}>
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className={`whitespace-nowrap px-5 py-3.5 ${column.className ?? ""}`}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row, index) => (
            <tr key={row[rowKey] ?? index} className="transition-colors hover:bg-slate-50/70">
              {columns.map((column) => (
                <td key={column.key} className={`px-5 py-4 text-slate-700 ${column.cellClassName ?? ""}`}>
                  {column.render ? column.render(row, index) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;