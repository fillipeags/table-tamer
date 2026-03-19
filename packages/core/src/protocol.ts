// ── Envelope ──
export interface MessageEnvelope {
  version: 1;
  id: string;
  timestamp: number;
}

// ── Actions ──
export type RequestAction =
  | 'get_database_info'
  | 'get_table_list'
  | 'get_table_data'
  | 'get_schema'
  | 'execute_sql'
  | 'update_record'
  | 'delete_records';

// ── Handshake ──
export interface HandshakePayload {
  appName: string;
  appVersion: string;
  platform: string;
  dbName: string;
  schemaVersion: number;
}

export interface HandshakeMessage extends MessageEnvelope {
  type: 'handshake';
  payload: HandshakePayload;
}

// ── Request (Server -> Client) ──
export interface GetDatabaseInfoRequest {
  action: 'get_database_info';
}

export interface GetTableListRequest {
  action: 'get_table_list';
}

export interface GetTableDataRequest {
  action: 'get_table_data';
  tableName: string;
  page: number;
  pageSize: number;
  orderBy?: string;
  orderDir?: 'ASC' | 'DESC';
}

export interface GetSchemaRequest {
  action: 'get_schema';
  tableName: string;
}

export interface ExecuteSqlRequest {
  action: 'execute_sql';
  sql: string;
  args?: unknown[];
}

export interface UpdateRecordRequest {
  action: 'update_record';
  tableName: string;
  recordId: string;
  column: string;
  value: unknown;
}

export interface DeleteRecordsRequest {
  action: 'delete_records';
  tableName: string;
  recordIds: string[];
}

export type RequestPayload =
  | GetDatabaseInfoRequest
  | GetTableListRequest
  | GetTableDataRequest
  | GetSchemaRequest
  | ExecuteSqlRequest
  | UpdateRecordRequest
  | DeleteRecordsRequest;

export interface RequestMessage extends MessageEnvelope {
  type: 'request';
  payload: RequestPayload;
}

// ── Response (Client -> Server) ──
export interface DatabaseInfoResponse {
  action: 'get_database_info';
  dbName: string;
  schemaVersion: number;
  tableCount: number;
  platform: string;
}

export interface TableListItem {
  name: string;
  recordCount: number;
}

export interface GetTableListResponse {
  action: 'get_table_list';
  tables: TableListItem[];
}

export interface ColumnInfo {
  name: string;
  type: string;
  isOptional: boolean;
  isIndexed: boolean;
}

export interface GetTableDataResponse {
  action: 'get_table_data';
  columns: string[];
  rows: Record<string, unknown>[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface GetSchemaResponse {
  action: 'get_schema';
  tableName: string;
  columns: ColumnInfo[];
}

export interface ExecuteSqlResponse {
  action: 'execute_sql';
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  executionTimeMs: number;
}

export interface UpdateRecordResponse {
  action: 'update_record';
  success: boolean;
}

export interface DeleteRecordsResponse {
  action: 'delete_records';
  deletedCount: number;
}

export interface ErrorResponse {
  action: RequestAction;
  error: string;
}

export type ResponsePayload =
  | DatabaseInfoResponse
  | GetTableListResponse
  | GetTableDataResponse
  | GetSchemaResponse
  | ExecuteSqlResponse
  | UpdateRecordResponse
  | DeleteRecordsResponse
  | ErrorResponse;

export interface ResponseMessage extends MessageEnvelope {
  type: 'response';
  requestId: string;
  payload: ResponsePayload;
}

// ── Union ──
export type Message = HandshakeMessage | RequestMessage | ResponseMessage;

// ── Helpers ──
export function isErrorResponse(payload: ResponsePayload): payload is ErrorResponse {
  return 'error' in payload;
}

function generateId(): string {
  // Use crypto.randomUUID if available (Node.js, modern browsers),
  // otherwise fallback for React Native / Hermes
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Simple v4-like UUID fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function createEnvelope(): MessageEnvelope {
  return {
    version: 1,
    id: generateId(),
    timestamp: Date.now(),
  };
}

export function createRequest(payload: RequestPayload): RequestMessage {
  return {
    ...createEnvelope(),
    type: 'request',
    payload,
  };
}

export function createResponse(requestId: string, payload: ResponsePayload): ResponseMessage {
  return {
    ...createEnvelope(),
    type: 'response',
    requestId,
    payload,
  };
}

export function createHandshake(payload: HandshakePayload): HandshakeMessage {
  return {
    ...createEnvelope(),
    type: 'handshake',
    payload,
  };
}
