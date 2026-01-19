import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useOffline } from '@/contexts/OfflineContext';
import { offlineDB, initDB } from '@/lib/offlineDB';
import { addDays, differenceInDays, parseISO } from 'date-fns';

export interface ReproductiveEvent {
  id: string;
  organization_id: string;
  animal_id: string;
  event_type: 'celo' | 'servicio' | 'inseminacion' | 'palpacion' | 'parto' | 'aborto' | 'secado';
  event_date: string;
  bull_id?: string;
  semen_batch?: string;
  technician?: string;
  pregnancy_result?: 'positivo' | 'negativo' | 'dudoso';
  estimated_gestation_days?: number;
  calf_id?: string;
  birth_type?: 'normal' | 'distocico' | 'cesarea' | 'gemelar';
  calf_sex?: 'macho' | 'hembra';
  calf_weight?: number;
  expected_birth_date?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface FemaleAnimal {
  id: string;
  tag_id: string;
  name?: string;
  category: string;
  birth_date?: string;
  reproductive_status?: string;
  last_calving_date?: string;
  last_service_date?: string;
  expected_calving_date?: string;
  total_calvings?: number;
  first_calving_date?: string;
  mother_id?: string;
  father_id?: string;
}

export interface ReproductiveStats {
  totalFemales: number;
  pregnantCount: number;
  servicedCount: number;
  emptyCount: number;
  lactatingCount: number;
  pregnancyRate: number;
  avgOpenDays: number;
  avgCalvingInterval: number;
  expectedBirthsThisMonth: number;
  overdueCount: number;
  heatAlerts: number;
}

const GESTATION_DAYS = 283;
const HEAT_CYCLE_DAYS = 21;

export const useReproduction = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isOnline, saveOffline } = useOffline();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [females, setFemales] = useState<FemaleAnimal[]>([]);
  const [bulls, setBulls] = useState<{ id: string; tag_id: string; name: string | null }[]>([]);
  const [events, setEvents] = useState<ReproductiveEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get organization ID with offline cache
  const getOrganizationId = useCallback(async () => {
    if (!isOnline) {
      const cachedOrgId = await offlineDB.getMetadata<string>('organizationId');
      if (cachedOrgId) return cachedOrgId;
    }

    if (!user) return null;
    
    const { data } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    const orgId = data?.organization_id || null;
    if (orgId) {
      await offlineDB.setMetadata('organizationId', orgId);
    }
    return orgId;
  }, [user, isOnline]);

  // Fetch females with offline support
  const fetchFemales = useCallback(async (orgId: string) => {
    try {
      if (isOnline) {
        const { data, error } = await supabase
          .from('animals')
          .select('*')
          .eq('organization_id', orgId)
          .eq('sex', 'hembra')
          .eq('status', 'activo')
          .in('category', ['vaca', 'novilla', 'bufala'])
          .order('tag_id');
        
        if (error) throw error;
        
        const femaleData = (data as FemaleAnimal[]) || [];
        setFemales(femaleData);
        
        // Cache for offline
        await offlineDB.setMetadata('reproductive_females', femaleData);
      } else {
        // Load from cache
        const cached = await offlineDB.getMetadata<FemaleAnimal[]>('reproductive_females');
        setFemales(cached || []);
      }
    } catch (error) {
      console.error('Error fetching females:', error);
      const cached = await offlineDB.getMetadata<FemaleAnimal[]>('reproductive_females');
      setFemales(cached || []);
    }
  }, [isOnline]);

  // Fetch bulls with offline support
  const fetchBulls = useCallback(async (orgId: string) => {
    try {
      if (isOnline) {
        const { data, error } = await supabase
          .from('animals')
          .select('id, tag_id, name')
          .eq('organization_id', orgId)
          .eq('sex', 'macho')
          .eq('status', 'activo')
          .in('category', ['toro', 'bufalo'])
          .order('tag_id');
        
        if (error) throw error;
        
        const bullData = data || [];
        setBulls(bullData);
        
        // Cache for offline
        await offlineDB.setMetadata('reproductive_bulls', bullData);
      } else {
        const cached = await offlineDB.getMetadata<typeof bulls>('reproductive_bulls');
        setBulls(cached || []);
      }
    } catch (error) {
      console.error('Error fetching bulls:', error);
      const cached = await offlineDB.getMetadata<typeof bulls>('reproductive_bulls');
      setBulls(cached || []);
    }
  }, [isOnline]);

  // Fetch events with offline support
  const fetchEvents = useCallback(async (orgId: string) => {
    try {
      if (isOnline) {
        const { data, error } = await supabase
          .from('reproductive_events')
          .select('*')
          .eq('organization_id', orgId)
          .order('event_date', { ascending: false });
        
        if (error) throw error;
        
        const eventData = (data as ReproductiveEvent[]) || [];
        setEvents(eventData);
        
        // Cache locally
        if (eventData.length > 0) {
          await offlineDB.bulkSave(
            'reproductive_events',
            eventData.map(e => ({ id: e.id, data: e as unknown as Record<string, unknown> }))
          );
          await offlineDB.setMetadata('lastSync_reproductive_events', new Date().toISOString());
        }
      } else {
        // Load from offline storage
        const offlineEvents = await offlineDB.getAllRecords<ReproductiveEvent>('reproductive_events');
        setEvents(offlineEvents);
        
        if (offlineEvents.length > 0) {
          toast({
            title: 'Modo Offline',
            description: `Mostrando ${offlineEvents.length} eventos reproductivos guardados`,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      const offlineEvents = await offlineDB.getAllRecords<ReproductiveEvent>('reproductive_events');
      setEvents(offlineEvents);
    }
  }, [isOnline, toast]);

  // Initialize
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await initDB();
      const orgId = await getOrganizationId();
      setOrganizationId(orgId);
      
      if (orgId) {
        await Promise.all([
          fetchFemales(orgId),
          fetchBulls(orgId),
          fetchEvents(orgId),
        ]);
      }
      setIsLoading(false);
    };
    
    init();
  }, [user]);

  // Re-fetch when coming back online
  useEffect(() => {
    if (isOnline && organizationId) {
      fetchEvents(organizationId);
      fetchFemales(organizationId);
    }
  }, [isOnline, organizationId, fetchEvents, fetchFemales]);

  // Calculate stats
  const stats: ReproductiveStats = {
    totalFemales: females.length,
    pregnantCount: females.filter(f => f.reproductive_status === 'preñada').length,
    servicedCount: females.filter(f => f.reproductive_status === 'servida').length,
    emptyCount: females.filter(f => f.reproductive_status === 'vacia').length,
    lactatingCount: females.filter(f => f.reproductive_status === 'lactando').length,
    pregnancyRate: 0,
    avgOpenDays: 0,
    avgCalvingInterval: 0,
    expectedBirthsThisMonth: 0,
    overdueCount: 0,
    heatAlerts: 0,
  };

  const servicedOrPregnant = stats.pregnantCount + stats.servicedCount;
  if (servicedOrPregnant > 0) {
    stats.pregnancyRate = Math.round((stats.pregnantCount / stats.totalFemales) * 100);
  }

  const today = new Date();
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  females.forEach(female => {
    if (female.expected_calving_date) {
      const expectedDate = parseISO(female.expected_calving_date);
      if (expectedDate <= endOfMonth && expectedDate >= today) {
        stats.expectedBirthsThisMonth++;
      }
      if (expectedDate < today && female.reproductive_status === 'preñada') {
        stats.overdueCount++;
      }
    }
  });

  const recentCeloEvents = events.filter(e => 
    e.event_type === 'celo' && 
    differenceInDays(today, parseISO(e.event_date)) <= HEAT_CYCLE_DAYS * 2
  );
  
  females.forEach(female => {
    if (female.reproductive_status === 'vacia') {
      const lastCelo = recentCeloEvents.find(e => e.animal_id === female.id);
      if (lastCelo) {
        const daysSinceCelo = differenceInDays(today, parseISO(lastCelo.event_date));
        if (daysSinceCelo >= HEAT_CYCLE_DAYS - 3 && daysSinceCelo <= HEAT_CYCLE_DAYS + 3) {
          stats.heatAlerts++;
        }
      }
    }
  });

  const femalesWithData = females.filter(f => f.last_calving_date && f.reproductive_status !== 'preñada');
  if (femalesWithData.length > 0) {
    const totalOpenDays = femalesWithData.reduce((sum, f) => {
      return sum + differenceInDays(today, parseISO(f.last_calving_date!));
    }, 0);
    stats.avgOpenDays = Math.round(totalOpenDays / femalesWithData.length);
  }

  // Add event with offline support
  const addEvent = async (event: Omit<ReproductiveEvent, 'id' | 'created_at' | 'organization_id'> & {
    create_calf?: boolean;
    calf_tag_id?: string;
    calf_name?: string;
    father_id?: string;
  }) => {
    try {
      const orgId = organizationId || await getOrganizationId();
      if (!orgId) throw new Error('No organization');
      
      let expectedBirthDate = event.expected_birth_date;
      if ((event.event_type === 'servicio' || event.event_type === 'inseminacion') && !expectedBirthDate) {
        expectedBirthDate = addDays(parseISO(event.event_date), GESTATION_DAYS).toISOString().split('T')[0];
      }

      const newEvent: ReproductiveEvent = {
        id: crypto.randomUUID(),
        animal_id: event.animal_id,
        event_type: event.event_type,
        event_date: event.event_date,
        bull_id: event.bull_id || event.father_id,
        semen_batch: event.semen_batch,
        technician: event.technician,
        pregnancy_result: event.pregnancy_result,
        estimated_gestation_days: event.estimated_gestation_days,
        birth_type: event.birth_type,
        calf_sex: event.calf_sex,
        calf_weight: event.calf_weight,
        calf_id: event.calf_id,
        organization_id: orgId,
        expected_birth_date: expectedBirthDate,
        notes: event.notes,
        created_by: user?.id,
        created_at: new Date().toISOString(),
      };

      // Add to local state immediately
      setEvents(prev => [newEvent, ...prev]);

      // Save with offline support
      await saveOffline('reproductive_events', 'reproductive_events', 'INSERT', newEvent as unknown as Record<string, unknown>);

      // Update animal reproductive status locally
      let reproductiveStatus = undefined;
      switch (event.event_type) {
        case 'celo':
          reproductiveStatus = 'vacia';
          break;
        case 'servicio':
        case 'inseminacion':
          reproductiveStatus = 'servida';
          break;
        case 'palpacion':
          if (event.pregnancy_result === 'positivo') reproductiveStatus = 'preñada';
          else if (event.pregnancy_result === 'negativo') reproductiveStatus = 'vacia';
          break;
        case 'parto':
          reproductiveStatus = 'lactando';
          break;
        case 'aborto':
          reproductiveStatus = 'vacia';
          break;
        case 'secado':
          reproductiveStatus = 'seca';
          break;
      }

      if (reproductiveStatus) {
        setFemales(prev => prev.map(f => 
          f.id === event.animal_id 
            ? { ...f, reproductive_status: reproductiveStatus }
            : f
        ));
      }

      toast({
        title: 'Evento registrado',
        description: isOnline 
          ? 'Evento reproductivo guardado correctamente'
          : 'Evento guardado localmente. Se sincronizará cuando haya conexión.',
      });

      return newEvent;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error',
        description: `No se pudo registrar: ${errorMessage}`,
        variant: 'destructive',
      });
      return null;
    }
  };

  // Delete event with offline support
  const deleteEvent = async (eventId: string) => {
    try {
      setEvents(prev => prev.filter(e => e.id !== eventId));
      
      await saveOffline('reproductive_events', 'reproductive_events', 'DELETE', { id: eventId });

      toast({
        title: 'Evento eliminado',
        description: isOnline 
          ? 'Registro eliminado'
          : 'Eliminación guardada. Se sincronizará cuando haya conexión.',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error',
        description: `No se pudo eliminar: ${errorMessage}`,
        variant: 'destructive',
      });
    }
  };

  const getAnimalHistory = (animalId: string) => {
    return events.filter(e => e.animal_id === animalId);
  };

  const getPedigree = async (animalId: string) => {
    if (!isOnline) {
      // Return basic info from cached animals
      const animal = females.find(f => f.id === animalId);
      return animal || null;
    }

    const { data: animal } = await supabase
      .from('animals')
      .select('*, mother:mother_id(id, tag_id, name), father:father_id(id, tag_id, name)')
      .eq('id', animalId)
      .single();
    
    return animal;
  };

  return {
    females,
    bulls,
    events,
    stats,
    isLoading,
    addEvent,
    deleteEvent,
    getAnimalHistory,
    getPedigree,
    GESTATION_DAYS,
    HEAT_CYCLE_DAYS,
  };
};
