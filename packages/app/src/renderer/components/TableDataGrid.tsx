import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
} from '@tanstack/react-table';
import { useAppStore } from '../stores/appStore';

interface TableDataGridProps {
  onPageChange: (page: number) => void;
}

export function TableDataGrid({ onPageChange }: TableDataGridProps) {
  const tableData = useAppStore((s) => s.tableData);
  const loading = useAppStore((s) => s.loading['get_table_data']);

  if (!tableData) return null;

  const columns: ColumnDef<Record<string, unknown>, any>[] = tableData.columns.map((col) => ({
    accessorKey: col,
    header: col,
    cell: (info: any) => {
      const val = info.getValue();
      if (val === null) return <span className="text-gray-600 italic">null</span>;
      if (typeof val === 'boolean') return val ? 'true' : 'false';
      const str = String(val);
      if (str.length > 100) return str.slice(0, 100) + '...';
      return str;
    },
  }));

  const totalPages = Math.ceil(tableData.totalCount / tableData.pageSize);

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-auto rounded-lg border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800">
              {columns.map((col: any) => (
                <th key={col.accessorKey} className="px-3 py-2 text-left text-xs font-semibold text-gray-400 whitespace-nowrap">
                  {col.header as string}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length} className="px-3 py-4 text-center text-gray-500">Loading...</td></tr>
            ) : (
              tableData.rows.map((row, i) => (
                <tr key={i} className="border-t border-gray-800/50 hover:bg-gray-800/30">
                  {tableData.columns.map((col) => (
                    <td key={col} className="px-3 py-1.5 whitespace-nowrap font-mono text-xs">
                      {row[col] === null ? (
                        <span className="text-gray-600 italic">null</span>
                      ) : (
                        String(row[col]).slice(0, 100)
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>{tableData.totalCount} records total</span>
        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(tableData.page - 1)}
            disabled={tableData.page <= 1}
            className="px-3 py-1 bg-gray-800 rounded disabled:opacity-30 hover:bg-gray-700"
          >
            Prev
          </button>
          <span className="px-3 py-1">
            Page {tableData.page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(tableData.page + 1)}
            disabled={tableData.page >= totalPages}
            className="px-3 py-1 bg-gray-800 rounded disabled:opacity-30 hover:bg-gray-700"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
