import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOffline } from '@/contexts/OfflineContext';
import { offlineDB, initDB } from '@/lib/offlineDB';

export type AnimalCategory = 'vaca' | 'toro' | 'novilla' | 'novillo' | 'ternera' | 'ternero' | 'becerra' | 'becerro' | 'bufala' | 'bufalo';
export type AnimalStatus = 'activo' | 'vendido' | 'muerto' | 'descartado' | 'trasladado';
export type AnimalSex = 'macho' | 'hembra';

export interface Animal {
  id: string;
  organization_id: string;
  tag_id: string;
  name: string | null;
  rfid_tag: string | null;
  category: AnimalCategory;
  sex: AnimalSex;
  breed: string | null;
  color: string | null;
  birth_date: string | null;
  entry_date: string | null;
  status: AnimalStatus;
  status_date: string | null;
  status_reason: string | null;
  current_weight: number | null;
  last_weight_date: string | null;
  origin: string | null;
  purchase_price: number | null;
  purchase_date: string | null;
  lot_name: string | null;
  mother_id: string | null;
  father_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnimalEvent {
  id: string;
  animal_id: string;
  organization_id: string;
  event_type: string;
  event_date: string;
  weight: number | null;
  details: unknown;
  notes: string | null;
  created_at: string;
}

export interface AnimalFilters {
  search: string;
  category: AnimalCategory | 'all';
  status: AnimalStatus | 'all';
  sex: AnimalSex | 'all';
  lot: string | 'all';
}

export interface AnimalStats {
  total: number;
  hembras: number;
  machos: number;
  porCategoria: Record<AnimalCategory, number>;
  lotes: string[];
}

export function useAnimals() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const { toast } = useToast();
  const { isOnline, saveOffline } = useOffline();

  const getOrganizationId = async () => {
    // Try from cache first if offline
    if (!isOnline) {
      const cachedOrgId = await offlineDB.getMetadata<string>('organizationId');
      if (cachedOrgId) return cachedOrgId;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    const orgId = profile?.organization_id || null;
    
    // Cache for offline use
    if (orgId) {
      await offlineDB.setMetadata('organizationId', orgId);
    }
    
    return orgId;
  };

  const fetchAnimals = useCallback(async () => {
    try {
      setLoading(true);
      await initDB();

      if (isOnline) {
        // Try to fetch from server
        const { data, error } = await supabase
          .from('animals')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        const serverAnimals = (data as Animal[]) || [];
        setAnimals(serverAnimals);
        
        // Cache animals locally for offline use
        if (serverAnimals.length > 0) {
          await offlineDB.bulkSave(
            'animals',
            serverAnimals.map(animal => ({ id: animal.id, data: animal as unknown as Record<string, unknown> }))
          );
          await offlineDB.setMetadata('lastSync_animals', new Date().toISOString());
        }
      } else {
        // Load from offline storage
        const offlineAnimals = await offlineDB.getAllRecords<Animal>('animals');
        setAnimals(offlineAnimals);
        
        toast({
          title: 'Modo Offline',
          description: `Mostrando ${offlineAnimals.length} animales guardados localmente`,
        });
      }
    } catch (error: unknown) {
      console.error('Error fetching animals:', error);
      
      // Fallback to offline data
      try {
        const offlineAnimals = await offlineDB.getAllRecords<Animal>('animals');
        setAnimals(offlineAnimals);
        
        if (offlineAnimals.length > 0) {
          toast({
            title: 'Usando datos offline',
            description: `Mostrando ${offlineAnimals.length} animales guardados localmente`,
          });
        }
      } catch {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        toast({
          title: 'Error',
          description: `No se pudieron cargar los animales: ${errorMessage}`,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [isOnline, toast]);

  const createAnimal = async (animal: Omit<Animal, 'id' | 'created_at' | 'updated_at' | 'organization_id'>) => {
    try {
      const orgId = organizationId || await getOrganizationId();
      if (!orgId) {
        throw new Error('No se encontró la organización');
      }

      const newAnimal: Animal = {
        ...animal,
        id: crypto.randomUUID(),
        organization_id: orgId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Add to local state immediately
      setAnimals(prev => [newAnimal, ...prev]);

      // Save with offline support
      await saveOffline('animals', 'animals', 'INSERT', newAnimal as unknown as Record<string, unknown>);

      toast({
        title: 'Animal registrado',
        description: isOnline 
          ? `${animal.tag_id} ha sido agregado exitosamente`
          : `${animal.tag_id} guardado localmente. Se sincronizará cuando haya conexión.`,
      });

      return newAnimal;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error',
        description: `No se pudo registrar el animal: ${errorMessage}`,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateAnimal = async (id: string, updates: Partial<Animal>) => {
    try {
      const existingAnimal = animals.find(a => a.id === id);
      if (!existingAnimal) {
        throw new Error('Animal no encontrado');
      }

      const updatedAnimal: Animal = {
        ...existingAnimal,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      // Update local state immediately
      setAnimals(prev => prev.map(a => a.id === id ? updatedAnimal : a));

      // Save with offline support
      await saveOffline('animals', 'animals', 'UPDATE', updatedAnimal as unknown as Record<string, unknown>);

      toast({
        title: 'Animal actualizado',
        description: isOnline 
          ? 'Los datos han sido actualizados'
          : 'Cambios guardados localmente. Se sincronizarán cuando haya conexión.',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error',
        description: `No se pudo actualizar: ${errorMessage}`,
        variant: 'destructive',
      });
    }
  };

  const deleteAnimal = async (id: string) => {
    try {
      // Remove from local state immediately
      setAnimals(prev => prev.filter(a => a.id !== id));

      // Save with offline support
      await saveOffline('animals', 'animals', 'DELETE', { id } as unknown as Record<string, unknown>);

      toast({
        title: 'Animal eliminado',
        description: isOnline 
          ? 'El registro ha sido eliminado'
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

  const getAnimalEvents = async (animalId: string): Promise<AnimalEvent[]> => {
    if (!isOnline) {
      // Try to get from local cache
      const allEvents = await offlineDB.getAllRecords<AnimalEvent>('health_events');
      return allEvents.filter(e => e.animal_id === animalId);
    }

    const { data, error } = await supabase
      .from('animal_events')
      .select('*')
      .eq('animal_id', animalId)
      .order('event_date', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar el historial',
        variant: 'destructive',
      });
      return [];
    }

    return (data as AnimalEvent[]) || [];
  };

  const addAnimalEvent = async (event: { animal_id: string; event_type: string; event_date: string; weight?: number | null; notes?: string | null }) => {
    try {
      const orgId = organizationId || await getOrganizationId();
      if (!orgId) throw new Error('No se encontró la organización');

      const newEvent = {
        id: crypto.randomUUID(),
        animal_id: event.animal_id,
        event_type: event.event_type,
        event_date: event.event_date,
        weight: event.weight || null,
        notes: event.notes || null,
        organization_id: orgId,
        created_at: new Date().toISOString(),
        details: null,
      };

      // Save event with offline support
      await saveOffline('health_events', 'animal_events', 'INSERT', newEvent);

      // Si es un pesaje, actualizar el peso actual del animal
      if (event.event_type === 'pesaje' && event.weight) {
        await updateAnimal(event.animal_id, { 
          current_weight: event.weight, 
          last_weight_date: event.event_date 
        });
      }

      toast({
        title: 'Evento registrado',
        description: isOnline 
          ? 'El evento ha sido agregado al historial'
          : 'Evento guardado localmente. Se sincronizará cuando haya conexión.',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error',
        description: `No se pudo registrar el evento: ${errorMessage}`,
        variant: 'destructive',
      });
    }
  };

  const getStats = (): AnimalStats => {
    const activeAnimals = animals.filter(a => a.status === 'activo');
    
    const porCategoria = {} as Record<AnimalCategory, number>;
    const categories: AnimalCategory[] = ['vaca', 'toro', 'novilla', 'novillo', 'ternera', 'ternero', 'becerra', 'becerro', 'bufala', 'bufalo'];
    categories.forEach(cat => {
      porCategoria[cat] = activeAnimals.filter(a => a.category === cat).length;
    });

    const lotesSet = new Set(activeAnimals.map(a => a.lot_name).filter(Boolean) as string[]);

    return {
      total: activeAnimals.length,
      hembras: activeAnimals.filter(a => a.sex === 'hembra').length,
      machos: activeAnimals.filter(a => a.sex === 'macho').length,
      porCategoria,
      lotes: Array.from(lotesSet),
    };
  };

  const filterAnimals = (filters: AnimalFilters): Animal[] => {
    return animals.filter(animal => {
      // Búsqueda por texto
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matchesSearch = 
          animal.tag_id.toLowerCase().includes(search) ||
          animal.name?.toLowerCase().includes(search) ||
          animal.breed?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      // Filtro por categoría
      if (filters.category !== 'all' && animal.category !== filters.category) {
        return false;
      }

      // Filtro por estado
      if (filters.status !== 'all' && animal.status !== filters.status) {
        return false;
      }

      // Filtro por sexo
      if (filters.sex !== 'all' && animal.sex !== filters.sex) {
        return false;
      }

      // Filtro por lote
      if (filters.lot !== 'all' && animal.lot_name !== filters.lot) {
        return false;
      }

      return true;
    });
  };

  const getAlertas = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return animals.filter(animal => {
      if (animal.status !== 'activo') return false;

      // Sin pesaje en los últimos 30 días
      if (!animal.last_weight_date) return true;
      const lastWeight = new Date(animal.last_weight_date);
      if (lastWeight < thirtyDaysAgo) return true;

      return false;
    });
  };

  useEffect(() => {
    const init = async () => {
      await initDB();
      const orgId = await getOrganizationId();
      setOrganizationId(orgId);
      await fetchAnimals();
    };
    init();
  }, []);

  // Re-fetch when coming back online
  useEffect(() => {
    if (isOnline) {
      fetchAnimals();
    }
  }, [isOnline, fetchAnimals]);

  return {
    animals,
    loading,
    organizationId,
    fetchAnimals,
    createAnimal,
    updateAnimal,
    deleteAnimal,
    getAnimalEvents,
    addAnimalEvent,
    getStats,
    filterAnimals,
    getAlertas,
  };
}
