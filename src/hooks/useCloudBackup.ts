import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { offlineDB, initDB } from '@/lib/offlineDB';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface BackupInfo {
  lastBackup: string | null;
  backupSize: number;
  isAutoBackupEnabled: boolean;
  backupInterval: number; // in hours
}

interface BackupMetadata {
  createdAt: string;
  stores: string[];
  recordCount: number;
  version: string;
}

const BACKUP_SETTINGS_KEY = 'cloud_backup_settings';
const DEFAULT_BACKUP_INTERVAL = 24; // hours

export const useCloudBackup = () => {
  const { user } = useAuth();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupInfo, setBackupInfo] = useState<BackupInfo>({
    lastBackup: null,
    backupSize: 0,
    isAutoBackupEnabled: true,
    backupInterval: DEFAULT_BACKUP_INTERVAL,
  });
  const [availableBackups, setAvailableBackups] = useState<Array<{
    name: string;
    created_at: string;
    size: number;
  }>>([]);

  // Load backup settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem(BACKUP_SETTINGS_KEY);
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setBackupInfo(prev => ({
          ...prev,
          isAutoBackupEnabled: settings.isAutoBackupEnabled ?? true,
          backupInterval: settings.backupInterval ?? DEFAULT_BACKUP_INTERVAL,
          lastBackup: settings.lastBackup ?? null,
        }));
      } catch {
        console.error('Error parsing backup settings');
      }
    }
  }, []);

  // Save backup settings to localStorage
  const saveSettings = useCallback((newSettings: Partial<BackupInfo>) => {
    const updatedInfo = { ...backupInfo, ...newSettings };
    setBackupInfo(updatedInfo);
    localStorage.setItem(BACKUP_SETTINGS_KEY, JSON.stringify({
      isAutoBackupEnabled: updatedInfo.isAutoBackupEnabled,
      backupInterval: updatedInfo.backupInterval,
      lastBackup: updatedInfo.lastBackup,
    }));
  }, [backupInfo]);

  // Create backup
  const createBackup = useCallback(async (): Promise<boolean> => {
    if (!user) {
      toast.error('Debes iniciar sesión para crear un respaldo');
      return false;
    }

    setIsBackingUp(true);
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

      const backupData: Record<string, unknown[]> = {};
      let totalRecords = 0;

      for (const store of stores) {
        const records = await offlineDB.getAllRecords(store);
        backupData[store] = records;
        totalRecords += records.length;
      }

      const metadata: BackupMetadata = {
        createdAt: new Date().toISOString(),
        stores: [...stores],
        recordCount: totalRecords,
        version: '1.0',
      };

      const backupPayload = {
        metadata,
        data: backupData,
      };

      const backupBlob = new Blob([JSON.stringify(backupPayload)], {
        type: 'application/json',
      });

      const fileName = `${user.id}/backup_${Date.now()}.json`;

      const { error } = await supabase.storage
        .from('user-backups')
        .upload(fileName, backupBlob, {
          contentType: 'application/json',
          upsert: false,
        });

      if (error) throw error;

      const now = new Date().toISOString();
      saveSettings({ 
        lastBackup: now,
        backupSize: backupBlob.size,
      });

      toast.success(`Respaldo creado: ${totalRecords} registros guardados`);
      await loadAvailableBackups();
      return true;
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Error al crear el respaldo');
      return false;
    } finally {
      setIsBackingUp(false);
    }
  }, [user, saveSettings]);

  // Load available backups
  const loadAvailableBackups = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.storage
        .from('user-backups')
        .list(user.id, {
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) throw error;

      setAvailableBackups(
        data?.map(file => ({
          name: file.name,
          created_at: file.created_at || '',
          size: file.metadata?.size || 0,
        })) || []
      );
    } catch (error) {
      console.error('Error loading backups:', error);
    }
  }, [user]);

  // Restore from backup
  const restoreBackup = useCallback(async (backupName: string): Promise<boolean> => {
    if (!user) {
      toast.error('Debes iniciar sesión para restaurar');
      return false;
    }

    setIsRestoring(true);
    try {
      const { data, error } = await supabase.storage
        .from('user-backups')
        .download(`${user.id}/${backupName}`);

      if (error) throw error;

      const text = await data.text();
      const backupPayload = JSON.parse(text);

      await initDB();

      const stores = backupPayload.metadata.stores as string[];
      let restoredCount = 0;

      for (const store of stores) {
        const records = backupPayload.data[store];
        if (records && Array.isArray(records)) {
          // Clear existing data in store
          await offlineDB.clearStore(store as Parameters<typeof offlineDB.clearStore>[0]);
          
          // Restore records
          for (const record of records) {
            if (record.id && record.data) {
              await offlineDB.saveRecord(
                store as Parameters<typeof offlineDB.saveRecord>[0],
                record.id,
                record.data,
                record.synced
              );
              restoredCount++;
            }
          }
        }
      }

      toast.success(`Respaldo restaurado: ${restoredCount} registros`);
      return true;
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast.error('Error al restaurar el respaldo');
      return false;
    } finally {
      setIsRestoring(false);
    }
  }, [user]);

  // Delete backup
  const deleteBackup = useCallback(async (backupName: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase.storage
        .from('user-backups')
        .remove([`${user.id}/${backupName}`]);

      if (error) throw error;

      toast.success('Respaldo eliminado');
      await loadAvailableBackups();
      return true;
    } catch (error) {
      console.error('Error deleting backup:', error);
      toast.error('Error al eliminar el respaldo');
      return false;
    }
  }, [user, loadAvailableBackups]);

  // Toggle auto backup
  const toggleAutoBackup = useCallback((enabled: boolean) => {
    saveSettings({ isAutoBackupEnabled: enabled });
    toast.success(enabled ? 'Respaldo automático activado' : 'Respaldo automático desactivado');
  }, [saveSettings]);

  // Set backup interval
  const setBackupInterval = useCallback((hours: number) => {
    saveSettings({ backupInterval: hours });
    toast.success(`Intervalo de respaldo: cada ${hours} horas`);
  }, [saveSettings]);

  // Check if backup is needed
  const checkAutoBackup = useCallback(async () => {
    if (!backupInfo.isAutoBackupEnabled || !user) return;

    const lastBackup = backupInfo.lastBackup;
    if (!lastBackup) {
      // No previous backup, create one
      await createBackup();
      return;
    }

    const lastBackupDate = new Date(lastBackup);
    const now = new Date();
    const hoursSinceLastBackup = (now.getTime() - lastBackupDate.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastBackup >= backupInfo.backupInterval) {
      console.log('Auto backup triggered');
      await createBackup();
    }
  }, [backupInfo, user, createBackup]);

  // Auto backup check on mount and when settings change
  useEffect(() => {
    if (user && backupInfo.isAutoBackupEnabled) {
      // Check on mount
      const timeoutId = setTimeout(() => {
        checkAutoBackup();
      }, 5000); // Wait 5 seconds after mount

      // Check periodically (every hour)
      const intervalId = setInterval(() => {
        checkAutoBackup();
      }, 60 * 60 * 1000);

      return () => {
        clearTimeout(timeoutId);
        clearInterval(intervalId);
      };
    }
  }, [user, backupInfo.isAutoBackupEnabled, checkAutoBackup]);

  // Load backups on mount
  useEffect(() => {
    if (user) {
      loadAvailableBackups();
    }
  }, [user, loadAvailableBackups]);

  return {
    isBackingUp,
    isRestoring,
    backupInfo,
    availableBackups,
    createBackup,
    restoreBackup,
    deleteBackup,
    toggleAutoBackup,
    setBackupInterval,
    loadAvailableBackups,
  };
};
