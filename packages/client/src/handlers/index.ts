import type { RequestPayload, ResponsePayload, RequestAction } from '@table-tamer/core';
import type { Database } from '@nozbe/watermelondb';
import { handleGetDatabaseInfo } from './databaseInfo';
import { handleGetTableList } from './tableList';
import { handleGetTableData } from './tableData';
import { handleGetSchema } from './schemaInfo';
import { handleExecuteSql } from './sqlExecute';
import { handleUpdateRecord } from './updateRecord';
import { handleDeleteRecords } from './deleteRecords';

type Handler = (request: any, database: Database, platform: string) => Promise<ResponsePayload>;

const handlers: Record<RequestAction, Handler> = {
  get_database_info: handleGetDatabaseInfo,
  get_table_list: handleGetTableList,
  get_table_data: handleGetTableData,
  get_schema: handleGetSchema,
  execute_sql: handleExecuteSql,
  update_record: handleUpdateRecord,
  delete_records: handleDeleteRecords,
};

const WRITE_ACTIONS: Set<RequestAction> = new Set([
  'update_record',
  'delete_records',
]);

export async function handleRequest(
  payload: RequestPayload,
  database: Database,
  platform: string,
  readOnly = false,
): Promise<ResponsePayload> {
  if (readOnly && WRITE_ACTIONS.has(payload.action)) {
    return {
      action: payload.action,
      error: 'Write operations are disabled in read-only mode',
    };
  }

  if (readOnly && payload.action === 'execute_sql') {
    const trimmed = payload.sql.trim().toUpperCase();
    const isRead = trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA') || trimmed.startsWith('EXPLAIN');
    if (!isRead) {
      return {
        action: payload.action,
        error: 'Write operations are disabled in read-only mode',
      };
    }
  }

  const handler = handlers[payload.action];
  if (!handler) {
    return {
      action: payload.action,
      error: `Unknown action: ${payload.action}`,
    };
  }

  try {
    return await handler(payload, database, platform);
  } catch (error) {
    return {
      action: payload.action,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
