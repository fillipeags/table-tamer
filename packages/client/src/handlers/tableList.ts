import type { GetTableListRequest, GetTableListResponse, TableListItem } from '@table-tamer/core';
import type { Database } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';

export async function handleGetTableList(
  _request: GetTableListRequest,
  database: Database
): Promise<GetTableListResponse> {
  const tableNames = Object.keys(database.schema.tables);
  const tables: TableListItem[] = [];

  // Use the first table's collection to run UNION ALL count queries
  const firstTable = tableNames[0];
  if (!firstTable) {
    return { action: 'get_table_list', tables: [] };
  }

  const collection = database.collections.get(firstTable);

  // Batch in groups of 50 to avoid SQLite compound SELECT limits
  const batchSize = 50;
  for (let i = 0; i < tableNames.length; i += batchSize) {
    const batch = tableNames.slice(i, i + batchSize);
    const sql = batch
      .map((name) => `SELECT '${name}' as table_name, COUNT(*) as cnt FROM "${name}"`)
      .join(' UNION ALL ');

    const rows: any[] = await collection
      .query(Q.unsafeSqlQuery(sql))
      .unsafeFetchRaw();

    for (const row of rows) {
      tables.push({
        name: row.table_name,
        recordCount: row.cnt,
      });
    }
  }

  tables.sort((a, b) => a.name.localeCompare(b.name));

  return {
    action: 'get_table_list',
    tables,
  };
}
