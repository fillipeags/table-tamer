/* v8 ignore file -- pure re-exports, no runtime logic to test */
export { connectInspector, disconnectInspector } from './TableTamerClient';
export type { ConnectInspectorOptions } from './TableTamerClient';

// Re-export core types for convenience
export type {
  MessageEnvelope,
  RequestAction,
  HandshakePayload,
  TableListItem,
  ColumnInfo,
} from '@table-tamer/core';

export { DEFAULT_PORT, PROTOCOL_VERSION } from '@table-tamer/core';
