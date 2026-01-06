import { useState, useEffect } from 'react';

export interface SyncStatus {
  isOnline: boolean;
  lastSyncDate: string | null;
  pendingChanges: number;
  syncInProgress: boolean;
  devices: DeviceInfo[];
}

export interface DeviceInfo {
  id: string;
  name: string;
  type: 'mobile' | 'desktop' | 'tablet';
  lastActive: string;
  isCurrentDevice: boolean;
}

export interface OfflineEvent {
  id: string;
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
  synced: boolean;
}

const OFFLINE_EVENTS_KEY = 'offline_events';
const SYNC_STATUS_KEY = 'sync_status';

export const useMobileSync = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    lastSyncDate: null,
    pendingChanges: 0,
    syncInProgress: false,
    devices: [],
  });

  const [offlineEvents, setOfflineEvents] = useState<OfflineEvent[]>([]);

  // Cargar eventos pendientes del localStorage
  const loadOfflineEvents = () => {
    try {
      const saved = localStorage.getItem(OFFLINE_EVENTS_KEY);
      if (saved) {
        const events = JSON.parse(saved);
        setOfflineEvents(events);
        setSyncStatus(prev => ({
          ...prev,
          pendingChanges: events.filter((e: OfflineEvent) => !e.synced).length,
        }));
      }
    } catch (error) {
      console.error('Error loading offline events:', error);
    }
  };

  // Guardar evento offline
  const saveOfflineEvent = (type: string, data: Record<string, unknown>) => {
    const event: OfflineEvent = {
      id: `offline_${Date.now()}`,
      type,
      data,
      timestamp: new Date().toISOString(),
      synced: false,
    };

    const updated = [...offlineEvents, event];
    setOfflineEvents(updated);
    localStorage.setItem(OFFLINE_EVENTS_KEY, JSON.stringify(updated));
    setSyncStatus(prev => ({
      ...prev,
      pendingChanges: prev.pendingChanges + 1,
    }));

    return event;
  };

  // Simular sincronización
  const syncNow = async () => {
    if (!syncStatus.isOnline) {
      return { success: false, message: 'Sin conexión a internet' };
    }

    setSyncStatus(prev => ({ ...prev, syncInProgress: true }));

    try {
      // Simular delay de sincronización
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Marcar todos los eventos como sincronizados
      const syncedEvents = offlineEvents.map(e => ({ ...e, synced: true }));
      setOfflineEvents(syncedEvents);
      localStorage.setItem(OFFLINE_EVENTS_KEY, JSON.stringify(syncedEvents));

      const now = new Date().toISOString();
      setSyncStatus(prev => ({
        ...prev,
        syncInProgress: false,
        lastSyncDate: now,
        pendingChanges: 0,
      }));

      localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify({
        lastSyncDate: now,
      }));

      return { success: true, message: 'Sincronización completada' };
    } catch (error) {
      setSyncStatus(prev => ({ ...prev, syncInProgress: false }));
      return { success: false, message: 'Error durante la sincronización' };
    }
  };

  // Limpiar eventos sincronizados
  const clearSyncedEvents = () => {
    const pending = offlineEvents.filter(e => !e.synced);
    setOfflineEvents(pending);
    localStorage.setItem(OFFLINE_EVENTS_KEY, JSON.stringify(pending));
  };

  // Obtener dispositivos conectados (simulado)
  const getConnectedDevices = (): DeviceInfo[] => {
    const userAgent = navigator.userAgent;
    const isMobile = /iPhone|iPad|Android/i.test(userAgent);

    return [
      {
        id: 'current',
        name: isMobile ? 'Este dispositivo móvil' : 'Este equipo',
        type: isMobile ? 'mobile' : 'desktop',
        lastActive: new Date().toISOString(),
        isCurrentDevice: true,
      },
    ];
  };

  // Detectar estado de conexión
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cargar estado inicial
    loadOfflineEvents();
    const savedStatus = localStorage.getItem(SYNC_STATUS_KEY);
    if (savedStatus) {
      const parsed = JSON.parse(savedStatus);
      setSyncStatus(prev => ({
        ...prev,
        lastSyncDate: parsed.lastSyncDate,
        devices: getConnectedDevices(),
      }));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sincronización automática cuando vuelve la conexión
  useEffect(() => {
    if (syncStatus.isOnline && syncStatus.pendingChanges > 0) {
      syncNow();
    }
  }, [syncStatus.isOnline]);

  return {
    syncStatus,
    offlineEvents,
    saveOfflineEvent,
    syncNow,
    clearSyncedEvents,
    getConnectedDevices,
  };
};
