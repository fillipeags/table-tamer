import type { DeleteRecordsRequest, DeleteRecordsResponse } from '@table-tamer/core';
import type { Database } from '@nozbe/watermelondb';

export async function handleDeleteRecords(
  request: DeleteRecordsRequest,
  database: Database
): Promise<DeleteRecordsResponse> {
  const { tableName, recordIds } = request;

  if (recordIds.length === 0) {
    return { action: 'delete_records', deletedCount: 0 };
  }

  const idList = recordIds.map((id) => `'${id.replace(/'/g, "''")}'`).join(', ');
  const sql = `DELETE FROM "${tableName}" WHERE id IN (${idList})`;

  // database.adapter is a CompatAdapter which wraps unsafeExecute as a Promise
  // CompatAdapter.unsafeExecute returns a Promise (NOT callback-based)
  await (database.adapter as any).unsafeExecute({ sqls: [[sql, []]] });

  return { action: 'delete_records', deletedCount: recordIds.length };
}
