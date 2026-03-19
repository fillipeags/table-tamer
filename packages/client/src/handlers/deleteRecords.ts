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

  const placeholders = recordIds.map(() => '?').join(', ');
  const sql = `DELETE FROM "${tableName}" WHERE id IN (${placeholders})`;

  await (database.adapter as any).unsafeExecute({ sqls: [[sql, recordIds]] });

  return { action: 'delete_records', deletedCount: recordIds.length };
}
