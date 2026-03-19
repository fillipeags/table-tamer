import type { DatabaseInfoResponse, GetDatabaseInfoRequest } from '@table-tamer/core';
import type { Database } from '@nozbe/watermelondb';

export async function handleGetDatabaseInfo(
  _request: GetDatabaseInfoRequest,
  database: Database,
  platform: string
): Promise<DatabaseInfoResponse> {
  const tableNames = Object.keys(database.schema.tables);

  return {
    action: 'get_database_info',
    dbName: (database.adapter as any).dbName || 'unknown',
    schemaVersion: database.schema.version,
    tableCount: tableNames.length,
    platform,
  };
}
