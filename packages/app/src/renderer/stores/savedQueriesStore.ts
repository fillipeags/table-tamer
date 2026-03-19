import { create } from 'zustand';

export interface SavedQuery {
  id: string;
  name: string;
  sql: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

interface SavedQueriesState {
  queries: SavedQuery[];
  addQuery: (name: string, sql: string, description?: string) => void;
  removeQuery: (id: string) => void;
  updateQuery: (id: string, updates: Partial<Pick<SavedQuery, 'name' | 'sql' | 'description'>>) => void;
  importQueries: (queries: SavedQuery[]) => void;
  exportQueries: () => string;
}

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const STORAGE_KEY = 'table-tamer-saved-queries';

function loadFromStorage(): SavedQuery[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveToStorage(queries: SavedQuery[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queries));
}

export const useSavedQueriesStore = create<SavedQueriesState>((set, get) => ({
  queries: loadFromStorage(),

  addQuery: (name, sql, description) => {
    const now = Date.now();
    const query: SavedQuery = { id: generateId(), name, sql, description, createdAt: now, updatedAt: now };
    const queries = [...get().queries, query];
    saveToStorage(queries);
    set({ queries });
  },

  removeQuery: (id) => {
    const queries = get().queries.filter(q => q.id !== id);
    saveToStorage(queries);
    set({ queries });
  },

  updateQuery: (id, updates) => {
    const queries = get().queries.map(q =>
      q.id === id ? { ...q, ...updates, updatedAt: Date.now() } : q
    );
    saveToStorage(queries);
    set({ queries });
  },

  importQueries: (imported) => {
    const existing = get().queries;
    const existingIds = new Set(existing.map(q => q.id));
    const newQueries = imported.filter(q => !existingIds.has(q.id));
    const queries = [...existing, ...newQueries];
    saveToStorage(queries);
    set({ queries });
  },

  exportQueries: () => {
    return JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      queries: get().queries,
    }, null, 2);
  },
}));
