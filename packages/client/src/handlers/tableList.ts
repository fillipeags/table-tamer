import type { GetTableListRequest, GetTableListResponse, TableListItem } from '@table-tamer/core';
import { MAX_ROWS_LIMIT } from '@table-tamer/core';
import type { Database } from '@nozbe/watermelondb';
import { promisifyAdapterMethod } from '../utils';

export async function handleGetTableList(
  _request: GetTableListRequest,
  database: Database
): Promise<GetTableListResponse> {
  const tableNames = Object.keys(database.schema.tables);

  // Build a UNION ALL query to get counts for all tables in a single query
  const unionParts = tableNames.map(
    (name) => `SELECT '${name}' as table_name, COUNT(*) as cnt FROM "${name}"`
  );

  // SQLite has a limit on compound SELECT statements, batch if needed
  const batchSize = 50;
  const tables: TableListItem[] = [];

  for (let i = 0; i < unionParts.length; i += batchSize) {
    const batch = unionParts.slice(i, i + batchSize);
    const sql = batch.join(' UNION ALL ');

    const rows = await promisifyAdapterMethod<any[]>((cb) =>
      (database.adapter as any).unsafeQueryRaw({ type: 'sqlQuery', sql, args: [] }, cb)
    );

    for (const row of rows) {
      tables.push({
        name: row.table_name,
        recordCount: row.cnt,
      });
    }
  }

  // Sort by name
  tables.sort((a, b) => a.name.localeCompare(b.name));

  return {
    action: 'get_table_list',
    tables,
  };
}
