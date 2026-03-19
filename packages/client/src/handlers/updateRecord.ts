import type { UpdateRecordRequest, UpdateRecordResponse } from '@table-tamer/core';
import type { Database } from '@nozbe/watermelondb';

function toSqlParam(value: unknown): string | number | null {
  if (value === null) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  return String(value);
}

export async function handleUpdateRecord(
  request: UpdateRecordRequest,
  database: Database
): Promise<UpdateRecordResponse> {
  const { tableName, recordId, column, value } = request;

  const param = toSqlParam(value);
  const sql = `UPDATE "${tableName}" SET "${column}" = ? WHERE id = ?`;

  await (database.adapter as any).unsafeExecute({ sqls: [[sql, [param, recordId]]] });

  return { action: 'update_record', success: true };
}
