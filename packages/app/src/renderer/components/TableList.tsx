import React from 'react';
import { useAppStore } from '../stores/appStore';

interface TableListProps {
  onSelectTable: (name: string) => void;
}

export function TableList({ onSelectTable }: TableListProps) {
  const tables = useAppStore((s) => s.tables);
  const selectedTable = useAppStore((s) => s.selectedTable);
  const loading = useAppStore((s) => s.loading['get_table_list']);

  if (loading) {
    return <div className="p-3 text-sm text-gray-500">Loading tables...</div>;
  }

  if (tables.length === 0) {
    return <div className="p-3 text-sm text-gray-500">No tables found</div>;
  }

  return (
    <div className="py-1">
      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Tables ({tables.length})
      </div>
      {tables.map((table) => (
        <button
          key={table.name}
          onClick={() => onSelectTable(table.name)}
          className={`w-full text-left px-3 py-1.5 text-sm flex justify-between items-center hover:bg-gray-800 transition-colors ${
            selectedTable === table.name ? 'bg-gray-800 text-emerald-400' : 'text-gray-300'
          }`}
        >
          <span className="truncate">{table.name}</span>
          <span className="text-xs text-gray-500 ml-2 shrink-0">{table.recordCount}</span>
        </button>
      ))}
    </div>
  );
}
