import type { UpdateRecordRequest, UpdateRecordResponse } from '@table-tamer/core';
import type { Database } from '@nozbe/watermelondb';

export async function handleUpdateRecord(
  request: UpdateRecordRequest,
  database: Database
): Promise<UpdateRecordResponse> {
  const { tableName, recordId, column, value } = request;

  const sqlValue = value === null
    ? 'NULL'
    : typeof value === 'number'
      ? String(value)
      : typeof value === 'boolean'
        ? value ? '1' : '0'
        : `'${String(value).replace(/'/g, "''")}'`;

  const sql = `UPDATE "${tableName}" SET "${column}" = ${sqlValue} WHERE id = '${recordId.replace(/'/g, "''")}'`;

  // CompatAdapter.unsafeExecute returns a Promise (NOT callback-based)
  await (database.adapter as any).unsafeExecute({ sqls: [[sql, []]] });

  return { action: 'update_record', success: true };
}
