import { describe, it, expect, vi } from 'vitest';
import { handleRequest } from '../handlers';

// ── Mock Database Factory ──

function createMockDatabase(options: {
  tables?: Record<string, { columns?: Record<string, unknown>; columnArray?: any[] }>;
  dbName?: string;
  schemaVersion?: number;
  queryResults?: any[];
  unsafeExecute?: ReturnType<typeof vi.fn>;
} = {}) {
  const {
    tables = {},
    dbName = 'testdb',
    schemaVersion = 1,
    queryResults = [],
    unsafeExecute = vi.fn().mockResolvedValue(undefined),
  } = options;

  const mockQuery = {
    unsafeFetchRaw: vi.fn().mockResolvedValue(queryResults),
  };

  const mockCollection = {
    query: vi.fn().mockReturnValue(mockQuery),
  };

  return {
    database: {
      schema: {
        version: schemaVersion,
        tables,
      },
      adapter: {
        dbName,
        unsafeExecute,
      },
      collections: {
        get: vi.fn().mockReturnValue(mockCollection),
      },
    } as any,
    mockCollection,
    mockQuery,
  };
}

describe('handleRequest', () => {
  describe('routing', () => {
    it('returns error for unknown action', async () => {
      const { database } = createMockDatabase();
      const result = await handleRequest(
        { action: 'unknown_action' as any },
        database,
        'ios',
      );
      expect(result).toEqual({
        action: 'unknown_action',
        error: 'Unknown action: unknown_action',
      });
    });

    it('catches handler errors and returns error response', async () => {
      const { database } = createMockDatabase();
      const result = await handleRequest(
        { action: 'get_schema', tableName: 'nonexistent' },
        database,
        'ios',
      );
      expect(result).toHaveProperty('error');
      expect((result as any).action).toBe('get_schema');
    });

    it('converts non-Error thrown values to string', async () => {
      // Create a database where collections.get throws a non-Error value
      const database = {
        schema: { version: 1, tables: { users: { columnArray: [] } } },
        adapter: { dbName: 'test' },
        collections: {
          get: vi.fn().mockImplementation(() => {
            throw 'string error';
          }),
        },
      } as any;

      const result = await handleRequest(
        { action: 'get_table_data', tableName: 'users', page: 1, pageSize: 50 },
        database,
        'ios',
      );

      expect((result as any).error).toBe('string error');
    });
  });

  describe('get_database_info', () => {
    it('returns database info', async () => {
      const { database } = createMockDatabase({
        tables: { users: { columns: {} }, posts: { columns: {} } },
        dbName: 'myapp',
        schemaVersion: 3,
      });

      const result = await handleRequest(
        { action: 'get_database_info' },
        database,
        'android',
      );

      expect(result).toEqual({
        action: 'get_database_info',
        dbName: 'myapp',
        schemaVersion: 3,
        tableCount: 2,
        platform: 'android',
      });
    });

    it('returns unknown when dbName is missing', async () => {
      const { database } = createMockDatabase({ dbName: undefined });
      (database.adapter as any).dbName = undefined;

      const result = await handleRequest(
        { action: 'get_database_info' },
        database,
        'ios',
      );

      expect((result as any).dbName).toBe('unknown');
    });

    it('returns zero tableCount for empty schema', async () => {
      const { database } = createMockDatabase({ tables: {} });

      const result = await handleRequest(
        { action: 'get_database_info' },
        database,
        'ios',
      );

      expect((result as any).tableCount).toBe(0);
    });
  });

  describe('get_table_list', () => {
    it('returns empty list for empty schema', async () => {
      const { database } = createMockDatabase({ tables: {} });

      const result = await handleRequest(
        { action: 'get_table_list' },
        database,
        'ios',
      );

      expect(result).toEqual({
        action: 'get_table_list',
        tables: [],
      });
    });

    it('returns sorted table list with counts', async () => {
      const { database } = createMockDatabase({
        tables: {
          posts: { columns: {} },
          users: { columns: {} },
        },
        queryResults: [
          { table_name: 'posts', cnt: 10 },
          { table_name: 'users', cnt: 25 },
        ],
      });

      const result = await handleRequest(
        { action: 'get_table_list' },
        database,
        'ios',
      );

      expect((result as any).tables).toEqual([
        { name: 'posts', recordCount: 10 },
        { name: 'users', recordCount: 25 },
      ]);
    });
  });

  describe('get_schema', () => {
    it('returns schema with id column prepended', async () => {
      const { database } = createMockDatabase({
        tables: {
          users: {
            columnArray: [
              { name: 'name', type: 'string', isOptional: false, isIndexed: false },
              { name: 'age', type: 'number', isOptional: true, isIndexed: false },
              { name: 'email', type: 'string', isOptional: false, isIndexed: true },
            ],
          },
        },
      });

      const result = await handleRequest(
        { action: 'get_schema', tableName: 'users' },
        database,
        'ios',
      );

      expect((result as any).tableName).toBe('users');
      expect((result as any).columns).toEqual([
        { name: 'id', type: 'string', isOptional: false, isIndexed: true },
        { name: 'name', type: 'string', isOptional: false, isIndexed: false },
        { name: 'age', type: 'number', isOptional: true, isIndexed: false },
        { name: 'email', type: 'string', isOptional: false, isIndexed: true },
      ]);
    });

    it('throws for non-existent table', async () => {
      const { database } = createMockDatabase({ tables: {} });

      const result = await handleRequest(
        { action: 'get_schema', tableName: 'missing' },
        database,
        'ios',
      );

      expect((result as any).error).toContain('missing');
    });

    it('defaults isOptional and isIndexed to false when undefined', async () => {
      const { database } = createMockDatabase({
        tables: {
          items: {
            columnArray: [
              { name: 'title', type: 'string' },
            ],
          },
        },
      });

      const result = await handleRequest(
        { action: 'get_schema', tableName: 'items' },
        database,
        'ios',
      );

      const columns = (result as any).columns;
      expect(columns[1]).toEqual({
        name: 'title',
        type: 'string',
        isOptional: false,
        isIndexed: false,
      });
    });
  });

  describe('get_table_data', () => {
    it('returns paginated data', async () => {
      const mockQuery = {
        unsafeFetchRaw: vi.fn()
          .mockResolvedValueOnce([{ cnt: 100 }])
          .mockResolvedValueOnce([
            { id: '1', name: 'Alice' },
            { id: '2', name: 'Bob' },
          ]),
      };

      const mockCollection = {
        query: vi.fn().mockReturnValue(mockQuery),
      };

      const database = {
        schema: { version: 1, tables: { users: { columns: { name: {} } } } },
        adapter: { dbName: 'test' },
        collections: { get: vi.fn().mockReturnValue(mockCollection) },
      } as any;

      const result = await handleRequest(
        { action: 'get_table_data', tableName: 'users', page: 1, pageSize: 50 },
        database,
        'ios',
      );

      expect((result as any).action).toBe('get_table_data');
      expect((result as any).totalCount).toBe(100);
      expect((result as any).page).toBe(1);
      expect((result as any).pageSize).toBe(50);
      expect((result as any).rows).toHaveLength(2);
      expect((result as any).columns).toEqual(['id', 'name']);
    });

    it('caps pageSize to MAX_ROWS_LIMIT', async () => {
      const mockQuery = {
        unsafeFetchRaw: vi.fn()
          .mockResolvedValueOnce([{ cnt: 0 }])
          .mockResolvedValueOnce([]),
      };
      const mockCollection = { query: vi.fn().mockReturnValue(mockQuery) };
      const database = {
        schema: { version: 1, tables: { users: { columns: {} } } },
        adapter: { dbName: 'test' },
        collections: { get: vi.fn().mockReturnValue(mockCollection) },
      } as any;

      const result = await handleRequest(
        { action: 'get_table_data', tableName: 'users', page: 1, pageSize: 5000 },
        database,
        'ios',
      );

      expect((result as any).pageSize).toBe(1000);
    });

    it('sanitizes row data', async () => {
      const binaryData = '\x00'.repeat(150);
      const mockQuery = {
        unsafeFetchRaw: vi.fn()
          .mockResolvedValueOnce([{ cnt: 1 }])
          .mockResolvedValueOnce([{ id: '1', avatar: binaryData }]),
      };
      const mockCollection = { query: vi.fn().mockReturnValue(mockQuery) };
      const database = {
        schema: { version: 1, tables: { users: { columns: {} } } },
        adapter: { dbName: 'test' },
        collections: { get: vi.fn().mockReturnValue(mockCollection) },
      } as any;

      const result = await handleRequest(
        { action: 'get_table_data', tableName: 'users', page: 1, pageSize: 50 },
        database,
        'ios',
      );

      expect((result as any).rows[0].avatar).toBe('[BLOB: 150 bytes]');
    });

    it('returns column names from schema when no rows', async () => {
      const mockQuery = {
        unsafeFetchRaw: vi.fn()
          .mockResolvedValueOnce([{ cnt: 0 }])
          .mockResolvedValueOnce([]),
      };
      const mockCollection = { query: vi.fn().mockReturnValue(mockQuery) };
      const database = {
        schema: { version: 1, tables: { users: { columns: { name: {}, email: {} } } } },
        adapter: { dbName: 'test' },
        collections: { get: vi.fn().mockReturnValue(mockCollection) },
      } as any;

      const result = await handleRequest(
        { action: 'get_table_data', tableName: 'users', page: 1, pageSize: 50 },
        database,
        'ios',
      );

      expect((result as any).columns).toEqual(['id', 'name', 'email']);
    });

    it('handles ORDER BY with DESC direction', async () => {
      const mockQuery = {
        unsafeFetchRaw: vi.fn()
          .mockResolvedValueOnce([{ cnt: 5 }])
          .mockResolvedValueOnce([{ id: '1', name: 'Zoe' }]),
      };
      const mockCollection = { query: vi.fn().mockReturnValue(mockQuery) };
      const database = {
        schema: { version: 1, tables: { users: { columns: { name: {} } } } },
        adapter: { dbName: 'test' },
        collections: { get: vi.fn().mockReturnValue(mockCollection) },
      } as any;

      const result = await handleRequest(
        {
          action: 'get_table_data',
          tableName: 'users',
          page: 1,
          pageSize: 50,
          orderBy: 'name',
          orderDir: 'DESC',
        },
        database,
        'ios',
      );

      // Verify the SQL contains DESC
      const sqlCall = mockCollection.query.mock.calls[1][0];
      expect(sqlCall).toBeDefined();
      expect((result as any).rows[0].name).toBe('Zoe');
    });

    it('uses DEFAULT_PAGE_SIZE when pageSize is not provided', async () => {
      const mockQuery = {
        unsafeFetchRaw: vi.fn()
          .mockResolvedValueOnce([{ cnt: 0 }])
          .mockResolvedValueOnce([]),
      };
      const mockCollection = { query: vi.fn().mockReturnValue(mockQuery) };
      const database = {
        schema: { version: 1, tables: { users: { columns: {} } } },
        adapter: { dbName: 'test' },
        collections: { get: vi.fn().mockReturnValue(mockCollection) },
      } as any;

      const result = await handleRequest(
        { action: 'get_table_data', tableName: 'users', page: 1, pageSize: 0 },
        database,
        'ios',
      );

      // pageSize 0 is falsy, so DEFAULT_PAGE_SIZE (50) is used
      expect((result as any).pageSize).toBe(50);
    });

    it('handles missing page with default value', async () => {
      const mockQuery = {
        unsafeFetchRaw: vi.fn()
          .mockResolvedValueOnce([{ cnt: 0 }])
          .mockResolvedValueOnce([]),
      };
      const mockCollection = { query: vi.fn().mockReturnValue(mockQuery) };
      const database = {
        schema: { version: 1, tables: { users: { columns: {} } } },
        adapter: { dbName: 'test' },
        collections: { get: vi.fn().mockReturnValue(mockCollection) },
      } as any;

      const result = await handleRequest(
        { action: 'get_table_data', tableName: 'users', page: undefined as any, pageSize: 10 },
        database,
        'ios',
      );

      expect((result as any).page).toBe(1);
    });

    it('handles empty count result gracefully', async () => {
      const mockQuery = {
        unsafeFetchRaw: vi.fn()
          .mockResolvedValueOnce([])  // empty count result
          .mockResolvedValueOnce([]),
      };
      const mockCollection = { query: vi.fn().mockReturnValue(mockQuery) };
      const database = {
        schema: { version: 1, tables: { users: { columns: {} } } },
        adapter: { dbName: 'test' },
        collections: { get: vi.fn().mockReturnValue(mockCollection) },
      } as any;

      const result = await handleRequest(
        { action: 'get_table_data', tableName: 'users', page: 1, pageSize: 50 },
        database,
        'ios',
      );

      expect((result as any).totalCount).toBe(0);
    });

    it('handles missing table schema when no rows (nullish columns)', async () => {
      const mockQuery = {
        unsafeFetchRaw: vi.fn()
          .mockResolvedValueOnce([{ cnt: 0 }])
          .mockResolvedValueOnce([]),
      };
      const mockCollection = { query: vi.fn().mockReturnValue(mockQuery) };
      const database = {
        schema: { version: 1, tables: {} },
        adapter: { dbName: 'test' },
        collections: { get: vi.fn().mockReturnValue(mockCollection) },
      } as any;

      const result = await handleRequest(
        { action: 'get_table_data', tableName: 'nonexistent', page: 1, pageSize: 50 },
        database,
        'ios',
      );

      // Should fallback to just ['id'] when table schema not found
      expect((result as any).columns).toEqual(['id']);
    });

    it('handles ORDER BY with ASC direction (default)', async () => {
      const mockQuery = {
        unsafeFetchRaw: vi.fn()
          .mockResolvedValueOnce([{ cnt: 5 }])
          .mockResolvedValueOnce([{ id: '1', name: 'Alice' }]),
      };
      const mockCollection = { query: vi.fn().mockReturnValue(mockQuery) };
      const database = {
        schema: { version: 1, tables: { users: { columns: { name: {} } } } },
        adapter: { dbName: 'test' },
        collections: { get: vi.fn().mockReturnValue(mockCollection) },
      } as any;

      const result = await handleRequest(
        {
          action: 'get_table_data',
          tableName: 'users',
          page: 1,
          pageSize: 50,
          orderBy: 'name',
        },
        database,
        'ios',
      );

      expect((result as any).rows[0].name).toBe('Alice');
    });
  });

  describe('execute_sql', () => {
    it('handles SELECT queries as read operations', async () => {
      const { database } = createMockDatabase({
        tables: { users: { columns: {} } },
        queryResults: [{ id: '1', name: 'Alice' }],
      });

      const result = await handleRequest(
        { action: 'execute_sql', sql: 'SELECT * FROM users' },
        database,
        'ios',
      );

      expect((result as any).action).toBe('execute_sql');
      expect((result as any).columns).toEqual(['id', 'name']);
      expect((result as any).rows).toEqual([{ id: '1', name: 'Alice' }]);
      expect((result as any).rowCount).toBe(1);
      expect(typeof (result as any).executionTimeMs).toBe('number');
    });

    it('handles PRAGMA queries as read operations', async () => {
      const { database } = createMockDatabase({
        tables: { users: { columns: {} } },
        queryResults: [{ table_info: 'users' }],
      });

      const result = await handleRequest(
        { action: 'execute_sql', sql: 'PRAGMA table_info(users)' },
        database,
        'ios',
      );

      expect((result as any).rows).toHaveLength(1);
    });

    it('handles EXPLAIN queries as read operations', async () => {
      const { database } = createMockDatabase({
        tables: { users: { columns: {} } },
        queryResults: [{ detail: 'SCAN users' }],
      });

      const result = await handleRequest(
        { action: 'execute_sql', sql: 'EXPLAIN SELECT * FROM users' },
        database,
        'ios',
      );

      expect((result as any).rows).toHaveLength(1);
    });

    it('handles write queries (INSERT, UPDATE, DELETE)', async () => {
      const unsafeExecute = vi.fn().mockResolvedValue(undefined);
      const { database } = createMockDatabase({
        tables: { users: { columns: {} } },
        unsafeExecute,
      });

      const result = await handleRequest(
        { action: 'execute_sql', sql: "INSERT INTO users VALUES ('1', 'Alice')" },
        database,
        'ios',
      );

      expect((result as any).rows).toEqual([]);
      expect((result as any).columns).toEqual([]);
      expect((result as any).rowCount).toBe(0);
      expect(unsafeExecute).toHaveBeenCalledWith({
        sqls: [["INSERT INTO users VALUES ('1', 'Alice')", []]],
      });
    });

    it('is case insensitive for query type detection', async () => {
      const { database } = createMockDatabase({
        tables: { users: { columns: {} } },
        queryResults: [],
      });

      const result = await handleRequest(
        { action: 'execute_sql', sql: 'select * from users' },
        database,
        'ios',
      );

      expect((result as any).rowCount).toBe(0);
      expect((result as any).columns).toEqual([]);
    });

    it('returns empty columns when read query returns no rows', async () => {
      const { database } = createMockDatabase({
        tables: { users: { columns: {} } },
        queryResults: [],
      });

      const result = await handleRequest(
        { action: 'execute_sql', sql: 'SELECT * FROM users WHERE 1=0' },
        database,
        'ios',
      );

      expect((result as any).columns).toEqual([]);
      expect((result as any).rows).toEqual([]);
    });

    it('sanitizes result rows', async () => {
      const binaryData = '\x00'.repeat(200);
      const { database } = createMockDatabase({
        tables: { users: { columns: {} } },
        queryResults: [{ id: '1', data: binaryData }],
      });

      const result = await handleRequest(
        { action: 'execute_sql', sql: 'SELECT * FROM users' },
        database,
        'ios',
      );

      expect((result as any).rows[0].data).toBe('[BLOB: 200 bytes]');
    });
  });

  describe('update_record', () => {
    it('updates a record with string value using parameterized query', async () => {
      const unsafeExecute = vi.fn().mockResolvedValue(undefined);
      const { database } = createMockDatabase({ unsafeExecute });

      const result = await handleRequest(
        {
          action: 'update_record',
          tableName: 'users',
          recordId: 'abc',
          column: 'name',
          value: 'John',
        },
        database,
        'ios',
      );

      expect(result).toEqual({ action: 'update_record', success: true });
      expect(unsafeExecute).toHaveBeenCalledWith({
        sqls: [[`UPDATE "users" SET "name" = ? WHERE id = ?`, ['John', 'abc']]],
      });
    });

    it('handles null value as parameter', async () => {
      const unsafeExecute = vi.fn().mockResolvedValue(undefined);
      const { database } = createMockDatabase({ unsafeExecute });

      await handleRequest(
        {
          action: 'update_record',
          tableName: 'users',
          recordId: 'abc',
          column: 'name',
          value: null,
        },
        database,
        'ios',
      );

      expect(unsafeExecute).toHaveBeenCalledWith({
        sqls: [[`UPDATE "users" SET "name" = ? WHERE id = ?`, [null, 'abc']]],
      });
    });

    it('handles numeric value as parameter', async () => {
      const unsafeExecute = vi.fn().mockResolvedValue(undefined);
      const { database } = createMockDatabase({ unsafeExecute });

      await handleRequest(
        {
          action: 'update_record',
          tableName: 'users',
          recordId: 'abc',
          column: 'age',
          value: 25,
        },
        database,
        'ios',
      );

      expect(unsafeExecute).toHaveBeenCalledWith({
        sqls: [[`UPDATE "users" SET "age" = ? WHERE id = ?`, [25, 'abc']]],
      });
    });

    it('converts boolean true to 1', async () => {
      const unsafeExecute = vi.fn().mockResolvedValue(undefined);
      const { database } = createMockDatabase({ unsafeExecute });

      await handleRequest(
        {
          action: 'update_record',
          tableName: 'users',
          recordId: 'abc',
          column: 'active',
          value: true,
        },
        database,
        'ios',
      );

      expect(unsafeExecute).toHaveBeenCalledWith({
        sqls: [[`UPDATE "users" SET "active" = ? WHERE id = ?`, [1, 'abc']]],
      });
    });

    it('converts boolean false to 0', async () => {
      const unsafeExecute = vi.fn().mockResolvedValue(undefined);
      const { database } = createMockDatabase({ unsafeExecute });

      await handleRequest(
        {
          action: 'update_record',
          tableName: 'users',
          recordId: 'abc',
          column: 'active',
          value: false,
        },
        database,
        'ios',
      );

      expect(unsafeExecute).toHaveBeenCalledWith({
        sqls: [[`UPDATE "users" SET "active" = ? WHERE id = ?`, [0, 'abc']]],
      });
    });

    it('safely handles values with special characters via parameters', async () => {
      const unsafeExecute = vi.fn().mockResolvedValue(undefined);
      const { database } = createMockDatabase({ unsafeExecute });

      await handleRequest(
        {
          action: 'update_record',
          tableName: 'users',
          recordId: 'abc',
          column: 'name',
          value: "O'Brien; DROP TABLE users;--",
        },
        database,
        'ios',
      );

      // Value is passed as parameter, not interpolated into SQL
      expect(unsafeExecute).toHaveBeenCalledWith({
        sqls: [[`UPDATE "users" SET "name" = ? WHERE id = ?`, ["O'Brien; DROP TABLE users;--", 'abc']]],
      });
    });
  });

  describe('delete_records', () => {
    it('deletes records using parameterized query', async () => {
      const unsafeExecute = vi.fn().mockResolvedValue(undefined);
      const { database } = createMockDatabase({ unsafeExecute });

      const result = await handleRequest(
        {
          action: 'delete_records',
          tableName: 'users',
          recordIds: ['id1', 'id2', 'id3'],
        },
        database,
        'ios',
      );

      expect(result).toEqual({ action: 'delete_records', deletedCount: 3 });
      expect(unsafeExecute).toHaveBeenCalledWith({
        sqls: [[`DELETE FROM "users" WHERE id IN (?, ?, ?)`, ['id1', 'id2', 'id3']]],
      });
    });

    it('returns 0 for empty recordIds array', async () => {
      const unsafeExecute = vi.fn();
      const { database } = createMockDatabase({ unsafeExecute });

      const result = await handleRequest(
        {
          action: 'delete_records',
          tableName: 'users',
          recordIds: [],
        },
        database,
        'ios',
      );

      expect(result).toEqual({ action: 'delete_records', deletedCount: 0 });
      expect(unsafeExecute).not.toHaveBeenCalled();
    });

    it('deletes a single record with parameterized query', async () => {
      const unsafeExecute = vi.fn().mockResolvedValue(undefined);
      const { database } = createMockDatabase({ unsafeExecute });

      const result = await handleRequest(
        {
          action: 'delete_records',
          tableName: 'posts',
          recordIds: ['single-id'],
        },
        database,
        'ios',
      );

      expect(result).toEqual({ action: 'delete_records', deletedCount: 1 });
      expect(unsafeExecute).toHaveBeenCalledWith({
        sqls: [[`DELETE FROM "posts" WHERE id IN (?)`, ['single-id']]],
      });
    });

    it('safely handles ids with special characters via parameters', async () => {
      const unsafeExecute = vi.fn().mockResolvedValue(undefined);
      const { database } = createMockDatabase({ unsafeExecute });

      await handleRequest(
        {
          action: 'delete_records',
          tableName: 'users',
          recordIds: ["id'with'quotes"],
        },
        database,
        'ios',
      );

      // IDs are passed as parameters, not interpolated
      expect(unsafeExecute).toHaveBeenCalledWith({
        sqls: [[`DELETE FROM "users" WHERE id IN (?)`, ["id'with'quotes"]]],
      });
    });
  });

  describe('read-only mode', () => {
    it('blocks update_record in read-only mode', async () => {
      const { database } = createMockDatabase();

      const result = await handleRequest(
        {
          action: 'update_record',
          tableName: 'users',
          recordId: 'abc',
          column: 'name',
          value: 'test',
        },
        database,
        'ios',
        true,
      );

      expect((result as any).error).toBe('Write operations are disabled in read-only mode');
    });

    it('blocks delete_records in read-only mode', async () => {
      const { database } = createMockDatabase();

      const result = await handleRequest(
        {
          action: 'delete_records',
          tableName: 'users',
          recordIds: ['id1'],
        },
        database,
        'ios',
        true,
      );

      expect((result as any).error).toBe('Write operations are disabled in read-only mode');
    });

    it('blocks write SQL in read-only mode', async () => {
      const { database } = createMockDatabase({
        tables: { users: { columns: {} } },
      });

      const result = await handleRequest(
        {
          action: 'execute_sql',
          sql: "INSERT INTO users VALUES ('1', 'Alice')",
        },
        database,
        'ios',
        true,
      );

      expect((result as any).error).toBe('Write operations are disabled in read-only mode');
    });

    it('allows SELECT SQL in read-only mode', async () => {
      const { database } = createMockDatabase({
        tables: { users: { columns: {} } },
        queryResults: [{ id: '1' }],
      });

      const result = await handleRequest(
        { action: 'execute_sql', sql: 'SELECT * FROM users' },
        database,
        'ios',
        true,
      );

      expect((result as any).rows).toHaveLength(1);
    });

    it('allows read operations in read-only mode', async () => {
      const { database } = createMockDatabase({
        tables: { users: { columns: {} } },
      });

      const result = await handleRequest(
        { action: 'get_database_info' },
        database,
        'ios',
        true,
      );

      expect((result as any).action).toBe('get_database_info');
      expect((result as any).error).toBeUndefined();
    });
  });
});
