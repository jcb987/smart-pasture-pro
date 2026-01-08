import { openDB, IDBPDatabase } from 'idb';

// Define types for our records
interface OfflineRecord {
  id: string;
  data: Record<string, unknown>;
  synced: boolean;
  lastModified: string;
}

interface SyncQueueItem {
  id: string;
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  data: Record<string, unknown>;
  timestamp: string;
  retries: number;
  error?: string;
}

interface MetadataItem {
  key: string;
  value: unknown;
}

type StoreName = 'animals' | 'health_events' | 'reproductive_events' | 'milk_production' | 
  'weight_records' | 'feed_inventory' | 'paddocks' | 'financial_transactions';

const DB_NAME = 'ganadero-offline-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase | null = null;

export const initDB = async (): Promise<IDBPDatabase> => {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Data stores with synced index
      const stores: StoreName[] = [
        'animals',
        'health_events',
        'reproductive_events',
        'milk_production',
        'weight_records',
        'feed_inventory',
        'paddocks',
        'financial_transactions',
      ];

      stores.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'id' });
          store.createIndex('by-synced', 'synced');
        }
      });

      // Sync queue store
      if (!db.objectStoreNames.contains('sync_queue')) {
        const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
        syncStore.createIndex('by-table', 'table');
        syncStore.createIndex('by-timestamp', 'timestamp');
      }

      // Metadata store
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' });
      }
    },
  });

  return dbInstance;
};

// Generic CRUD operations for offline storage
export const offlineDB = {
  async saveRecord<T extends Record<string, unknown>>(
    store: StoreName,
    id: string,
    data: T,
    synced = true
  ): Promise<void> {
    const db = await initDB();
    const record: OfflineRecord = {
      id,
      data,
      synced,
      lastModified: new Date().toISOString(),
    };
    await db.put(store, record);
  },

  async getRecord<T>(store: StoreName, id: string): Promise<T | undefined> {
    const db = await initDB();
    const record = await db.get(store, id) as OfflineRecord | undefined;
    return record?.data as T | undefined;
  },

  async getAllRecords<T>(store: StoreName): Promise<T[]> {
    const db = await initDB();
    const records = await db.getAll(store) as OfflineRecord[];
    return records.map(r => r.data as T);
  },

  async deleteRecord(store: StoreName, id: string): Promise<void> {
    const db = await initDB();
    await db.delete(store, id);
  },

  async getUnsyncedRecords(store: StoreName): Promise<Array<{ id: string; data: Record<string, unknown> }>> {
    const db = await initDB();
    const tx = db.transaction(store, 'readonly');
    const index = tx.store.index('by-synced');
    const records = await index.getAll(IDBKeyRange.only(false)) as OfflineRecord[];
    return records.map(r => ({ id: r.id, data: r.data }));
  },

  async markAsSynced(store: StoreName, id: string): Promise<void> {
    const db = await initDB();
    const record = await db.get(store, id) as OfflineRecord | undefined;
    if (record) {
      record.synced = true;
      await db.put(store, record);
    }
  },

  async bulkSave<T extends Record<string, unknown>>(
    store: StoreName,
    records: Array<{ id: string; data: T }>
  ): Promise<void> {
    const db = await initDB();
    const tx = db.transaction(store, 'readwrite');
    await Promise.all([
      ...records.map(r =>
        tx.store.put({
          id: r.id,
          data: r.data,
          synced: true,
          lastModified: new Date().toISOString(),
        } as OfflineRecord)
      ),
      tx.done,
    ]);
  },

  async clearStore(store: StoreName): Promise<void> {
    const db = await initDB();
    await db.clear(store);
  },

  // Sync queue operations
  async addToSyncQueue(
    table: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    data: Record<string, unknown>
  ): Promise<void> {
    const db = await initDB();
    const id = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const item: SyncQueueItem = {
      id,
      table,
      operation,
      data,
      timestamp: new Date().toISOString(),
      retries: 0,
    };
    await db.put('sync_queue', item);
  },

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const db = await initDB();
    const tx = db.transaction('sync_queue', 'readonly');
    const index = tx.store.index('by-timestamp');
    return await index.getAll() as SyncQueueItem[];
  },

  async removeSyncQueueItem(id: string): Promise<void> {
    const db = await initDB();
    await db.delete('sync_queue', id);
  },

  async updateSyncQueueItem(
    id: string,
    updates: { retries?: number; error?: string }
  ): Promise<void> {
    const db = await initDB();
    const record = await db.get('sync_queue', id) as SyncQueueItem | undefined;
    if (record) {
      await db.put('sync_queue', { ...record, ...updates });
    }
  },

  async getSyncQueueCount(): Promise<number> {
    const db = await initDB();
    return db.count('sync_queue');
  },

  // Metadata operations
  async setMetadata(key: string, value: unknown): Promise<void> {
    const db = await initDB();
    const item: MetadataItem = { key, value };
    await db.put('metadata', item);
  },

  async getMetadata<T>(key: string): Promise<T | undefined> {
    const db = await initDB();
    const record = await db.get('metadata', key) as MetadataItem | undefined;
    return record?.value as T | undefined;
  },
};

export type { StoreName, OfflineRecord, SyncQueueItem };
