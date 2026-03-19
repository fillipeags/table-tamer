import type { RequestPayload, ResponsePayload, RequestAction } from '@table-tamer/core';
import type { Database } from '@nozbe/watermelondb';
import { handleGetDatabaseInfo } from './databaseInfo';
import { handleGetTableList } from './tableList';
import { handleGetTableData } from './tableData';
import { handleGetSchema } from './schemaInfo';
import { handleExecuteSql } from './sqlExecute';

type Handler = (request: any, database: Database, platform: string) => Promise<ResponsePayload>;

const handlers: Record<RequestAction, Handler> = {
  get_database_info: handleGetDatabaseInfo,
  get_table_list: handleGetTableList,
  get_table_data: handleGetTableData,
  get_schema: handleGetSchema,
  execute_sql: handleExecuteSql,
};

export async function handleRequest(
  payload: RequestPayload,
  database: Database,
  platform: string
): Promise<ResponsePayload> {
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
