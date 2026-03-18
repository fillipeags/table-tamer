import type { ExecuteSqlRequest, ExecuteSqlResponse } from '@table-tamer/core';
import { MAX_ROWS_LIMIT } from '@table-tamer/core';
import type { Database } from '@nozbe/watermelondb';
import { promisifyAdapterMethod, sanitizeRow } from '../utils';

export async function handleExecuteSql(
  request: ExecuteSqlRequest,
  database: Database
): Promise<ExecuteSqlResponse> {
  const { sql, args = [] } = request;
  const startTime = performance.now();

  const trimmed = sql.trim().toUpperCase();
  const isRead = trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA') || trimmed.startsWith('EXPLAIN');

  if (isRead) {
    const rows = await promisifyAdapterMethod<any[]>((cb) =>
      (database.adapter as any).unsafeQueryRaw({ type: 'sqlQuery', sql, args }, cb)
    );

    const limitedRows = rows.slice(0, MAX_ROWS_LIMIT);
    const columns = limitedRows.length > 0 ? Object.keys(limitedRows[0]) : [];

    return {
      action: 'execute_sql',
      columns,
      rows: limitedRows.map(sanitizeRow),
      rowCount: rows.length,
      executionTimeMs: Math.round(performance.now() - startTime),
    };
  } else {
    // Write operation
    await promisifyAdapterMethod<void>((cb) =>
      (database.adapter as any).unsafeExecute({ sqls: [[sql, args as any[]]] }, cb)
    );

    return {
      action: 'execute_sql',
      columns: [],
      rows: [],
      rowCount: 0,
      executionTimeMs: Math.round(performance.now() - startTime),
    };
  }
}
