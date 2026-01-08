import { useState, useEffect, useCallback } from 'react';
import { offlineDB, initDB } from '@/lib/offlineDB';

interface DataSyncStatus {
  animals: { count: number; lastSync: string | null };
  health_events: { count: number; lastSync: string | null };
  reproductive_events: { count: number; lastSync: string | null };
  milk_production: { count: number; lastSync: string | null };
  weight_records: { count: number; lastSync: string | null };
  feed_inventory: { count: number; lastSync: string | null };
  paddocks: { count: number; lastSync: string | null };
  financial_transactions: { count: number; lastSync: string | null };
}

export const useDataSync = () => {
  const [status, setStatus] = useState<DataSyncStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStatus = useCallback(async () => {
    try {
      await initDB();
      
      const stores = [
        'animals',
        'health_events',
        'reproductive_events',
        'milk_production',
        'weight_records',
        'feed_inventory',
        'paddocks',
        'financial_transactions',
      ] as const;

      const statusData: Record<string, { count: number; lastSync: string | null }> = {};

      for (const store of stores) {
        const records = await offlineDB.getAllRecords(store);
        const lastSync = await offlineDB.getMetadata<string>(`lastSync_${store}`);
        statusData[store] = {
          count: records.length,
          lastSync: lastSync || null,
        };
      }

      setStatus(statusData as unknown as DataSyncStatus);
    } catch (error) {
      console.error('Error loading sync status:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const clearAllData = useCallback(async () => {
    const stores = [
      'animals',
      'health_events',
      'reproductive_events',
      'milk_production',
      'weight_records',
      'feed_inventory',
      'paddocks',
      'financial_transactions',
    ] as const;

    for (const store of stores) {
      await offlineDB.clearStore(store);
    }

    await loadStatus();
  }, [loadStatus]);

  const getTotalRecords = useCallback(() => {
    if (!status) return 0;
    return Object.values(status).reduce((acc, s) => acc + s.count, 0);
  }, [status]);

  return {
    status,
    loading,
    clearAllData,
    getTotalRecords,
    refresh: loadStatus,
  };
};
