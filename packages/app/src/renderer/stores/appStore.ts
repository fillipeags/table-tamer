import { create } from 'zustand';
import type { RequestAction, ResponsePayload, TableListItem, ColumnInfo } from '@table-tamer/core';

interface ConnectedDevice {
  id: string;
  appName: string;
  appVersion: string;
  platform: string;
  dbName: string;
  schemaVersion: number;
}

interface QueryHistoryEntry {
  id: string;
  sql: string;
  timestamp: number;
  executionTimeMs?: number;
  rowCount?: number;
  error?: string;
}

interface AppState {
  // Connection state
  devices: ConnectedDevice[];
  activeDeviceId: string | null;

  // Data state
  tables: TableListItem[];
  selectedTable: string | null;
  tableData: { columns: string[]; rows: Record<string, unknown>[]; totalCount: number; page: number; pageSize: number } | null;
  schema: { tableName: string; columns: ColumnInfo[] } | null;
  databaseInfo: { dbName: string; schemaVersion: number; tableCount: number; platform: string } | null;

  // All schemas (for graph relationships)
  allSchemas: Record<string, ColumnInfo[]>;

  // SQL Console
  queryHistory: QueryHistoryEntry[];
  sqlResult: { columns: string[]; rows: Record<string, unknown>[]; rowCount: number; executionTimeMs: number } | null;

  // UI state
  loading: Record<string, boolean>;
  pendingRequests: Map<string, { action: RequestAction; resolve: (payload: ResponsePayload) => void; reject: (err: Error) => void }>;

  // Actions
  addDevice: (device: ConnectedDevice) => void;
  removeDevice: (id: string) => void;
  setActiveDevice: (id: string | null) => void;
  setTables: (tables: TableListItem[]) => void;
  setSelectedTable: (name: string | null) => void;
  setTableData: (data: AppState['tableData']) => void;
  setSchema: (schema: AppState['schema']) => void;
  setDatabaseInfo: (info: AppState['databaseInfo']) => void;
  setAllSchemas: (schemas: Record<string, ColumnInfo[]>) => void;
  setSqlResult: (result: AppState['sqlResult']) => void;
  addQueryHistory: (entry: QueryHistoryEntry) => void;
  setLoading: (key: string, value: boolean) => void;
  addPendingRequest: (id: string, action: RequestAction, resolve: (p: ResponsePayload) => void, reject: (e: Error) => void) => void;
  resolvePendingRequest: (id: string, payload: ResponsePayload) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  devices: [],
  activeDeviceId: null,
  tables: [],
  selectedTable: null,
  tableData: null,
  schema: null,
  databaseInfo: null,
  allSchemas: {},
  queryHistory: [],
  sqlResult: null,
  loading: {},
  pendingRequests: new Map(),

  addDevice: (device) => set((state) => ({
    devices: [...state.devices, device],
    activeDeviceId: state.activeDeviceId ?? device.id,
  })),

  removeDevice: (id) => set((state) => ({
    devices: state.devices.filter((d) => d.id !== id),
    activeDeviceId: state.activeDeviceId === id
      ? (state.devices.find((d) => d.id !== id)?.id ?? null)
      : state.activeDeviceId,
  })),

  setActiveDevice: (id) => set({ activeDeviceId: id }),
  setTables: (tables) => set({ tables }),
  setSelectedTable: (name) => set({ selectedTable: name, tableData: null, schema: null }),
  setTableData: (data) => set({ tableData: data }),
  setSchema: (schema) => set({ schema }),
  setDatabaseInfo: (info) => set({ databaseInfo: info }),
  setAllSchemas: (schemas) => set({ allSchemas: schemas }),
  setSqlResult: (result) => set({ sqlResult: result }),

  addQueryHistory: (entry) => set((state) => ({
    queryHistory: [entry, ...state.queryHistory].slice(0, 100),
  })),

  setLoading: (key, value) => set((state) => ({
    loading: { ...state.loading, [key]: value },
  })),

  addPendingRequest: (id, action, resolve, reject) => {
    const pending = new Map(get().pendingRequests);
    pending.set(id, { action, resolve, reject });
    set({ pendingRequests: pending });
  },

  resolvePendingRequest: (id, payload) => {
    const pending = new Map(get().pendingRequests);
    const entry = pending.get(id);
    if (entry) {
      pending.delete(id);
      set({ pendingRequests: pending });
      entry.resolve(payload);
    }
  },
}));
