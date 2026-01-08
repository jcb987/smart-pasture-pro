import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOffline } from '@/contexts/OfflineContext';
import { offlineDB, initDB, type StoreName } from '@/lib/offlineDB';
import { useAuth } from '@/contexts/AuthContext';

interface UseOfflineDataOptions<T> {
  store: StoreName;
  table: string;
  fetchQuery: () => Promise<{ data: T[] | null; error: unknown }>;
  getId: (item: T) => string;
}

export function useOfflineData<T extends Record<string, unknown>>({
  store,
  table,
  fetchQuery,
  getId,
}: UseOfflineDataOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const { isOnline, saveOffline } = useOffline();
  const { user } = useAuth();

  // Initial load - try online first, fallback to offline
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await initDB();

      if (isOnline) {
        // Try to fetch from server
        const { data: serverData, error } = await fetchQuery();
        
        if (error) {
          console.error('Error fetching from server:', error);
          // Fallback to offline data
          const offlineData = await offlineDB.getAllRecords<T>(store);
          setData(offlineData);
        } else if (serverData) {
          setData(serverData);
          // Update local cache
          await offlineDB.bulkSave(
            store,
            serverData.map(item => ({ id: getId(item), data: item }))
          );
        }
      } else {
        // Load from offline storage
        const offlineData = await offlineDB.getAllRecords<T>(store);
        setData(offlineData);
      }
    } catch (error) {
      console.error('Error in fetchData:', error);
      // Try offline as last resort
      try {
        const offlineData = await offlineDB.getAllRecords<T>(store);
        setData(offlineData);
      } catch {
        setData([]);
      }
    } finally {
      setLoading(false);
    }
  }, [isOnline, fetchQuery, store, getId]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  // Create operation
  const create = useCallback(async (item: T): Promise<T | null> => {
    try {
      const id = getId(item);
      
      // Add to local state immediately
      setData(prev => [...prev, item]);
      
      // Save with offline support
      await saveOffline(store, table, 'INSERT', item);
      
      return item;
    } catch (error) {
      console.error('Error creating item:', error);
      return null;
    }
  }, [store, table, getId, saveOffline]);

  // Update operation
  const update = useCallback(async (id: string, updates: Partial<T>): Promise<boolean> => {
    try {
      // Update local state immediately
      setData(prev => prev.map(item => 
        getId(item) === id ? { ...item, ...updates } : item
      ));
      
      const existingItem = data.find(item => getId(item) === id);
      if (!existingItem) return false;
      
      const updatedItem = { ...existingItem, ...updates, id };
      
      // Save with offline support
      await saveOffline(store, table, 'UPDATE', updatedItem);
      
      return true;
    } catch (error) {
      console.error('Error updating item:', error);
      return false;
    }
  }, [data, store, table, getId, saveOffline]);

  // Delete operation
  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      // Remove from local state immediately
      setData(prev => prev.filter(item => getId(item) !== id));
      
      // Save with offline support
      await saveOffline(store, table, 'DELETE', { id } as unknown as T);
      
      return true;
    } catch (error) {
      console.error('Error deleting item:', error);
      return false;
    }
  }, [store, table, getId, saveOffline]);

  // Get single item
  const getById = useCallback((id: string): T | undefined => {
    return data.find(item => getId(item) === id);
  }, [data, getId]);

  return {
    data,
    loading,
    create,
    update,
    remove,
    getById,
    refresh: fetchData,
  };
}
