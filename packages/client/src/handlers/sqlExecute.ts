import type { ExecuteSqlRequest, ExecuteSqlResponse } from '@table-tamer/core';
import { MAX_ROWS_LIMIT } from '@table-tamer/core';
import type { Database } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import { sanitizeRow } from '../utils';

export async function handleExecuteSql(
  request: ExecuteSqlRequest,
  database: Database
): Promise<ExecuteSqlResponse> {
  const { sql } = request;
  const startTime = Date.now();

  const trimmed = sql.trim().toUpperCase();
  const isRead = trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA') || trimmed.startsWith('EXPLAIN');

  if (isRead) {
    const tableNames = Object.keys(database.schema.tables);
    const collection = database.collections.get(tableNames[0]);

    const rows: any[] = await collection
      .query(Q.unsafeSqlQuery(sql))
      .unsafeFetchRaw();

    const limitedRows = rows.slice(0, MAX_ROWS_LIMIT);
    const columns = limitedRows.length > 0 ? Object.keys(limitedRows[0]) : [];

    return {
      action: 'execute_sql',
      columns,
      rows: limitedRows.map(sanitizeRow),
      rowCount: rows.length,
      executionTimeMs: Date.now() - startTime,
    };
  } else {
    // CompatAdapter.unsafeExecute returns a Promise (NOT callback-based)
    await (database.adapter as any).unsafeExecute({ sqls: [[sql, []]] });

    return {
      action: 'execute_sql',
      columns: [],
      rows: [],
      rowCount: 0,
      executionTimeMs: Date.now() - startTime,
    };
  }
}
