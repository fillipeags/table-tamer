import type { GetSchemaRequest, GetSchemaResponse, ColumnInfo } from '@table-tamer/core';
import type { Database } from '@nozbe/watermelondb';

export async function handleGetSchema(
  request: GetSchemaRequest,
  database: Database
): Promise<GetSchemaResponse> {
  const { tableName } = request;
  const tableSchema = database.schema.tables[tableName];

  if (!tableSchema) {
    throw new Error(`Table "${tableName}" not found in schema`);
  }

  // WatermelonDB always adds an 'id' column (primary key) that's not in columnArray
  const columns: ColumnInfo[] = [
    { name: 'id', type: 'string', isOptional: false, isIndexed: true },
    ...tableSchema.columnArray.map((col: any) => ({
      name: col.name,
      type: col.type,
      isOptional: col.isOptional ?? false,
      isIndexed: col.isIndexed ?? false,
    })),
  ];

  return {
    action: 'get_schema',
    tableName,
    columns,
  };
}
