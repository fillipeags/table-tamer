import type { GetTableDataRequest, GetTableDataResponse } from '@table-tamer/core';
import { MAX_ROWS_LIMIT, DEFAULT_PAGE_SIZE } from '@table-tamer/core';
import type { Database } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import { sanitizeRow } from '../utils';

export async function handleGetTableData(
  request: GetTableDataRequest,
  database: Database
): Promise<GetTableDataResponse> {
  const { tableName, page = 1, orderBy, orderDir = 'ASC' } = request;
  const pageSize = Math.min(request.pageSize || DEFAULT_PAGE_SIZE, MAX_ROWS_LIMIT);
  const offset = (page - 1) * pageSize;

  const collection = database.collections.get(tableName);

  // Get total count
  const countRows: any[] = await collection
    .query(Q.unsafeSqlQuery(`SELECT COUNT(*) as cnt FROM "${tableName}"`))
    .unsafeFetchRaw();
  const totalCount = countRows[0]?.cnt ?? 0;

  // Get paginated data
  let dataSql = `SELECT * FROM "${tableName}"`;
  if (orderBy) {
    dataSql += ` ORDER BY "${orderBy}" ${orderDir === 'DESC' ? 'DESC' : 'ASC'}`;
  }
  dataSql += ` LIMIT ${pageSize} OFFSET ${offset}`;

  const rows: any[] = await collection
    .query(Q.unsafeSqlQuery(dataSql))
    .unsafeFetchRaw();

  const columns = rows.length > 0
    ? Object.keys(rows[0])
    : ['id', ...Object.keys(database.schema.tables[tableName]?.columns ?? {})];

  return {
    action: 'get_table_data',
    columns,
    rows: rows.map(sanitizeRow),
    totalCount,
    page,
    pageSize,
  };
}
