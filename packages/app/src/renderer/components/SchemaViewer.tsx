import React from 'react';
import { useAppStore } from '../stores/appStore';

export function SchemaViewer() {
  const schema = useAppStore((s) => s.schema);

  if (!schema) return null;

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      <div className="px-4 py-2 bg-gray-800 border-b border-gray-700">
        <h3 className="text-sm font-semibold">Schema: {schema.tableName}</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500 border-b border-gray-800">
            <th className="px-4 py-2">Column</th>
            <th className="px-4 py-2">Type</th>
            <th className="px-4 py-2">Optional</th>
            <th className="px-4 py-2">Indexed</th>
          </tr>
        </thead>
        <tbody>
          {schema.columns.map((col) => (
            <tr key={col.name} className="border-b border-gray-800/50 hover:bg-gray-800/50">
              <td className="px-4 py-1.5 font-mono text-emerald-300">{col.name}</td>
              <td className="px-4 py-1.5 text-blue-300">{col.type}</td>
              <td className="px-4 py-1.5">{col.isOptional ? 'Yes' : ''}</td>
              <td className="px-4 py-1.5">{col.isIndexed ? 'Yes' : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
