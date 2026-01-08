import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
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

const GESTATION_DAYS = 283; // Días promedio de gestación bovina
const HEAT_CYCLE_DAYS = 21; // Ciclo de celo promedio

export const useReproduction = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  // Obtener organization_id del perfil del usuario
  useEffect(() => {
    const fetchOrgId = async () => {
      if (!user) {
        setOrganizationId(null);
        return;
      }
      
      const { data } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setOrganizationId(data?.organization_id || null);
    };
    
    fetchOrgId();
  }, [user]);

  // Obtener hembras reproductivas
  const { data: females = [], isLoading: loadingFemales } = useQuery({
    queryKey: ['reproductive-females', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('animals')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('sex', 'hembra')
        .eq('status', 'activo')
        .in('category', ['vaca', 'novilla'])
        .order('tag_id');
      
      if (error) throw error;
      return data as FemaleAnimal[];
    },
    enabled: !!organizationId,
  });

  // Obtener toros para servicios
  const { data: bulls = [] } = useQuery({
    queryKey: ['bulls', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('animals')
        .select('id, tag_id, name')
        .eq('organization_id', organizationId)
        .eq('sex', 'macho')
        .eq('status', 'activo')
        .in('category', ['toro'])
        .order('tag_id');
      
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  // Obtener eventos reproductivos
  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ['reproductive-events', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('reproductive_events')
        .select('*')
        .eq('organization_id', organizationId)
        .order('event_date', { ascending: false });
      
      if (error) throw error;
      return data as ReproductiveEvent[];
    },
    enabled: !!organizationId,
  });

  // Calcular estadísticas reproductivas
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

  // Calcular tasa de preñez
  const servicedOrPregnant = stats.pregnantCount + stats.servicedCount;
  if (servicedOrPregnant > 0) {
    stats.pregnancyRate = Math.round((stats.pregnantCount / stats.totalFemales) * 100);
  }

  // Calcular partos esperados este mes y atrasados
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

  // Calcular alertas de celo (hembras vacías sin servicio reciente)
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

  // Calcular días abiertos promedio
  const femalesWithData = females.filter(f => f.last_calving_date && f.reproductive_status !== 'preñada');
  if (femalesWithData.length > 0) {
    const totalOpenDays = femalesWithData.reduce((sum, f) => {
      return sum + differenceInDays(today, parseISO(f.last_calving_date!));
    }, 0);
    stats.avgOpenDays = Math.round(totalOpenDays / femalesWithData.length);
  }

  // Registrar evento reproductivo
  const addEventMutation = useMutation({
    mutationFn: async (event: Omit<ReproductiveEvent, 'id' | 'created_at' | 'organization_id'> & {
      create_calf?: boolean;
      calf_tag_id?: string;
      calf_name?: string;
      father_id?: string;
    }) => {
      if (!organizationId) throw new Error('No organization');
      
      // Calcular fecha esperada de parto si es servicio o inseminación
      let expectedBirthDate = event.expected_birth_date;
      if ((event.event_type === 'servicio' || event.event_type === 'inseminacion') && !expectedBirthDate) {
        expectedBirthDate = addDays(parseISO(event.event_date), GESTATION_DAYS).toISOString().split('T')[0];
      }

      // Create calf record if it's a birth event and create_calf is true
      let calfId: string | undefined = undefined;
      if (event.event_type === 'parto' && event.create_calf && event.calf_tag_id && event.calf_sex) {
        const calfCategory = event.calf_sex === 'macho' ? 'ternero' : 'ternera';
        
        const { data: calfData, error: calfError } = await supabase
          .from('animals')
          .insert({
            tag_id: event.calf_tag_id,
            name: event.calf_name || null,
            category: calfCategory,
            sex: event.calf_sex,
            birth_date: event.event_date,
            entry_date: event.event_date,
            current_weight: event.calf_weight || null,
            last_weight_date: event.calf_weight ? event.event_date : null,
            mother_id: event.animal_id,
            father_id: event.father_id && event.father_id !== 'unknown' ? event.father_id : null,
            organization_id: organizationId,
            status: 'activo',
            reproductive_status: 'vacia',
          })
          .select('id')
          .single();
        
        if (calfError) throw calfError;
        calfId = calfData.id;
      }

      const { data, error } = await supabase
        .from('reproductive_events')
        .insert({
          animal_id: event.animal_id,
          event_type: event.event_type,
          event_date: event.event_date,
          bull_id: event.bull_id || event.father_id || undefined,
          semen_batch: event.semen_batch,
          technician: event.technician,
          pregnancy_result: event.pregnancy_result,
          estimated_gestation_days: event.estimated_gestation_days,
          birth_type: event.birth_type,
          calf_sex: event.calf_sex,
          calf_weight: event.calf_weight,
          calf_id: calfId,
          organization_id: organizationId,
          expected_birth_date: expectedBirthDate,
          notes: event.notes,
        })
        .select()
        .single();
      
      if (error) throw error;

      // Actualizar estado reproductivo del animal
      let reproductiveStatus = undefined;
      let updates: Record<string, unknown> = {};

      switch (event.event_type) {
        case 'celo':
          reproductiveStatus = 'vacia';
          break;
        case 'servicio':
        case 'inseminacion':
          reproductiveStatus = 'servida';
          updates.last_service_date = event.event_date;
          updates.expected_calving_date = expectedBirthDate;
          break;
        case 'palpacion':
          if (event.pregnancy_result === 'positivo') {
            reproductiveStatus = 'preñada';
          } else if (event.pregnancy_result === 'negativo') {
            reproductiveStatus = 'vacia';
            updates.expected_calving_date = null;
          }
          break;
        case 'parto':
          reproductiveStatus = 'lactando';
          updates.last_calving_date = event.event_date;
          updates.expected_calving_date = null;
          break;
        case 'aborto':
          reproductiveStatus = 'vacia';
          updates.expected_calving_date = null;
          break;
        case 'secado':
          reproductiveStatus = 'seca';
          break;
      }

      if (reproductiveStatus) {
        // Get current total_calvings for parto event
        if (event.event_type === 'parto') {
          const { data: animalData } = await supabase
            .from('animals')
            .select('total_calvings, first_calving_date')
            .eq('id', event.animal_id)
            .single();
          
          updates.total_calvings = (animalData?.total_calvings || 0) + 1;
          if (!animalData?.first_calving_date) {
            updates.first_calving_date = event.event_date;
          }
        }

        await supabase
          .from('animals')
          .update({
            reproductive_status: reproductiveStatus,
            ...updates,
          })
          .eq('id', event.animal_id);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reproductive-events'] });
      queryClient.invalidateQueries({ queryKey: ['reproductive-females'] });
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      toast.success('Evento reproductivo registrado');
    },
    onError: (error) => {
      toast.error('Error al registrar evento: ' + error.message);
    },
  });

  // Eliminar evento reproductivo
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from('reproductive_events')
        .delete()
        .eq('id', eventId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reproductive-events'] });
      toast.success('Evento eliminado');
    },
    onError: (error) => {
      toast.error('Error al eliminar: ' + error.message);
    },
  });

  // Obtener historial reproductivo de un animal
  const getAnimalHistory = (animalId: string) => {
    return events.filter(e => e.animal_id === animalId);
  };

  // Obtener pedigrí de un animal
  const getPedigree = async (animalId: string) => {
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
    isLoading: loadingFemales || loadingEvents,
    addEvent: addEventMutation.mutate,
    deleteEvent: deleteEventMutation.mutate,
    getAnimalHistory,
    getPedigree,
    GESTATION_DAYS,
    HEAT_CYCLE_DAYS,
  };
};
