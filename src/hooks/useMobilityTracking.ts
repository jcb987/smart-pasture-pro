import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type MobilityType = 'feria' | 'traslado_temporal' | 'venta' | 'sacrificio';
export type ResolutionType = 'returned' | 'sold' | 'dead' | 'extended';

export interface MobilityEvent {
  id: string;
  animal_id: string;
  tag_id: string;
  name?: string;
  mobility_type: MobilityType;
  destination: string;
  start_date: string;
  return_date?: string;
  document_id: string;
  resolved: boolean;
  resolved_at?: string;
  resolved_as?: ResolutionType;
}

export const MOBILITY_LABELS: Record<MobilityType, string> = {
  feria: 'Feria / Exposición',
  traslado_temporal: 'Traslado Temporal',
  venta: 'Venta',
  sacrificio: 'Sacrificio / Faena',
};

const getStorageKey = (orgId: string) => `agrodata_mobility_${orgId}`;

export const useMobilityTracking = () => {
  const [events, setEvents] = useState<MobilityEvent[]>([]);
  const { user } = useAuth();

  const getOrganizationId = useCallback(async () => {
    if (!user) return null;
    const { data } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();
    return data?.organization_id || null;
  }, [user]);

  const loadEvents = useCallback(async () => {
    const orgId = await getOrganizationId();
    if (!orgId) return;
    try {
      const raw = localStorage.getItem(getStorageKey(orgId));
      setEvents(raw ? JSON.parse(raw) : []);
    } catch {
      setEvents([]);
    }
  }, [getOrganizationId]);

  const saveEvents = useCallback(async (updated: MobilityEvent[]) => {
    const orgId = await getOrganizationId();
    if (!orgId) return;
    localStorage.setItem(getStorageKey(orgId), JSON.stringify(updated));
    setEvents(updated);
  }, [getOrganizationId]);

  useEffect(() => {
    if (user) loadEvents();
  }, [user, loadEvents]);

  const addMobilityEvents = async (
    animals: { id: string; tag_id: string; name?: string | null }[],
    params: {
      mobility_type: MobilityType;
      destination: string;
      start_date: string;
      return_date?: string;
      document_id: string;
    }
  ) => {
    const now = new Date().toISOString();
    const newEvents: MobilityEvent[] = animals.map(a => ({
      id: `mob_${a.id}_${Date.now()}`,
      animal_id: a.id,
      tag_id: a.tag_id,
      name: a.name || undefined,
      mobility_type: params.mobility_type,
      destination: params.destination,
      start_date: params.start_date,
      return_date: params.return_date,
      document_id: params.document_id,
      resolved: false,
    }));
    // Remove any previous unresolved events for same animals
    const filtered = events.filter(e => !e.resolved || !animals.some(a => a.id === e.animal_id));
    await saveEvents([...filtered, ...newEvents]);
  };

  const getAnimalMobility = (animalId: string): MobilityEvent | null => {
    return events.find(e => e.animal_id === animalId && !e.resolved) || null;
  };

  const resolveEvent = async (id: string, resolution: ResolutionType) => {
    const updated = events.map(e =>
      e.id === id
        ? { ...e, resolved: true, resolved_at: new Date().toISOString(), resolved_as: resolution }
        : e
    );
    await saveEvents(updated);
  };

  const extendReturnDate = async (id: string, newDate: string) => {
    const updated = events.map(e => e.id === id ? { ...e, return_date: newDate } : e);
    await saveEvents(updated);
  };

  const isExpired = (event: MobilityEvent): boolean => {
    if (!event.return_date) return false;
    return new Date(event.return_date) < new Date();
  };

  const activeEvents = events.filter(e => !e.resolved);
  const expiredEvents = activeEvents.filter(e => isExpired(e));

  return {
    events,
    activeEvents,
    expiredEvents,
    addMobilityEvents,
    getAnimalMobility,
    resolveEvent,
    extendReturnDate,
    isExpired,
    loadEvents,
  };
};
