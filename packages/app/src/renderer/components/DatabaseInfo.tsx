import React from 'react';
import { useAppStore } from '../stores/appStore';

export function DatabaseInfo() {
  const info = useAppStore((s) => s.databaseInfo);

  if (!info) return null;

  return (
    <div className="grid grid-cols-2 gap-2 p-3 bg-gray-900 rounded-lg border border-gray-800">
      <InfoItem label="Database" value={info.dbName} />
      <InfoItem label="Schema Version" value={String(info.schemaVersion)} />
      <InfoItem label="Tables" value={String(info.tableCount)} />
      <InfoItem label="Platform" value={info.platform} />
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-gray-500">{label}</span>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
