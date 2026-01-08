import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { offlineDB, initDB, type StoreName } from '@/lib/offlineDB';
import { toast } from 'sonner';

interface OfflineContextType {
  isOnline: boolean;
  isSyncing: boolean;
  pendingChanges: number;
  lastSyncDate: string | null;
  syncNow: () => Promise<void>;
  saveOffline: <T extends Record<string, unknown>>(
    store: StoreName,
    table: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    data: T
  ) => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

// Map IndexedDB store names to Supabase table names
const STORE_TO_TABLE: Record<StoreName, string> = {
  animals: 'animals',
  health_events: 'health_events',
  reproductive_events: 'reproductive_events',
  milk_production: 'milk_production',
  weight_records: 'weight_records',
  feed_inventory: 'feed_inventory',
  paddocks: 'paddocks',
  financial_transactions: 'financial_transactions',
};

export const OfflineProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);

  // Initialize database on mount
  useEffect(() => {
    initDB().then(async () => {
      const count = await offlineDB.getSyncQueueCount();
      setPendingChanges(count);
      
      const lastSync = await offlineDB.getMetadata<string>('lastSyncDate');
      if (lastSync) setLastSyncDate(lastSync);
    });
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Conexión restaurada', {
        description: 'Sincronizando cambios pendientes...',
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Modo Offline', {
        description: 'Los cambios se guardarán localmente',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingChanges > 0) {
      syncNow();
    }
  }, [isOnline, pendingChanges]);

  // Sync function
  const syncNow = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    let syncedCount = 0;
    let errorCount = 0;

    try {
      const queue = await offlineDB.getSyncQueue();

      for (const item of queue) {
        try {
          const tableName = item.table;
          
          switch (item.operation) {
            case 'INSERT':
              const { error: insertError } = await supabase
                .from(tableName as keyof typeof STORE_TO_TABLE)
                .insert(item.data as never);
              if (insertError) throw insertError;
              break;

            case 'UPDATE':
              const { error: updateError } = await supabase
                .from(tableName as keyof typeof STORE_TO_TABLE)
                .update(item.data as never)
                .eq('id', item.data.id as string);
              if (updateError) throw updateError;
              break;

            case 'DELETE':
              const { error: deleteError } = await supabase
                .from(tableName as keyof typeof STORE_TO_TABLE)
                .delete()
                .eq('id', item.data.id as string);
              if (deleteError) throw deleteError;
              break;
          }

          await offlineDB.removeSyncQueueItem(item.id);
          syncedCount++;
        } catch (error) {
          console.error('Sync error for item:', item, error);
          await offlineDB.updateSyncQueueItem(item.id, {
            retries: item.retries + 1,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          errorCount++;
        }
      }

      const newCount = await offlineDB.getSyncQueueCount();
      setPendingChanges(newCount);

      const now = new Date().toISOString();
      setLastSyncDate(now);
      await offlineDB.setMetadata('lastSyncDate', now);

      if (syncedCount > 0) {
        toast.success(`Sincronización completada`, {
          description: `${syncedCount} cambios sincronizados${errorCount > 0 ? `, ${errorCount} errores` : ''}`,
        });
      }
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Error de sincronización', {
        description: 'Algunos cambios no pudieron sincronizarse',
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing]);

  // Save data with offline support
  const saveOffline = useCallback(async <T extends Record<string, unknown>>(
    store: StoreName,
    table: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    data: T
  ) => {
    // Always save to local DB first
    if (operation !== 'DELETE') {
      await offlineDB.saveRecord(store, data.id as string, data, isOnline);
    } else {
      await offlineDB.deleteRecord(store, data.id as string);
    }

    // If online, sync immediately
    if (isOnline) {
      try {
        switch (operation) {
          case 'INSERT':
            const { error: insertError } = await supabase
              .from(table as keyof typeof STORE_TO_TABLE)
              .insert(data as never);
            if (insertError) throw insertError;
            await offlineDB.markAsSynced(store, data.id as string);
            break;

          case 'UPDATE':
            const { error: updateError } = await supabase
              .from(table as keyof typeof STORE_TO_TABLE)
              .update(data as never)
              .eq('id', data.id as string);
            if (updateError) throw updateError;
            await offlineDB.markAsSynced(store, data.id as string);
            break;

          case 'DELETE':
            const { error: deleteError } = await supabase
              .from(table as keyof typeof STORE_TO_TABLE)
              .delete()
              .eq('id', data.id as string);
            if (deleteError) throw deleteError;
            break;
        }
      } catch (error) {
        console.error('Failed to sync immediately, queuing:', error);
        await offlineDB.addToSyncQueue(table, operation, data);
        const count = await offlineDB.getSyncQueueCount();
        setPendingChanges(count);
      }
    } else {
      // Add to sync queue for later
      await offlineDB.addToSyncQueue(table, operation, data);
      const count = await offlineDB.getSyncQueueCount();
      setPendingChanges(count);
    }
  }, [isOnline]);

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isSyncing,
        pendingChanges,
        lastSyncDate,
        syncNow,
        saveOffline,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = (): OfflineContextType => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};
