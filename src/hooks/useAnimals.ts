import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

  const getOrganizationId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    return profile?.organization_id || null;
  };

  const fetchAnimals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('animals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnimals((data as Animal[]) || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error',
        description: `No se pudieron cargar los animales: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createAnimal = async (animal: Omit<Animal, 'id' | 'created_at' | 'updated_at' | 'organization_id'>) => {
    try {
      if (!organizationId) {
        throw new Error('No se encontró la organización');
      }

      const { data, error } = await supabase
        .from('animals')
        .insert({ ...animal, organization_id: organizationId })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Animal registrado',
        description: `${animal.tag_id} ha sido agregado exitosamente`,
      });

      await fetchAnimals();
      return data;
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
      const { error } = await supabase
        .from('animals')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Animal actualizado',
        description: 'Los datos han sido actualizados',
      });

      await fetchAnimals();
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
      const { error } = await supabase
        .from('animals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Animal eliminado',
        description: 'El registro ha sido eliminado',
      });

      await fetchAnimals();
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
      if (!organizationId) throw new Error('No se encontró la organización');

      const { error } = await supabase
        .from('animal_events')
        .insert({
          animal_id: event.animal_id,
          event_type: event.event_type,
          event_date: event.event_date,
          weight: event.weight || null,
          notes: event.notes || null,
          organization_id: organizationId,
        });

      if (error) throw error;

      // Si es un pesaje, actualizar el peso actual del animal
      if (event.event_type === 'pesaje' && event.weight) {
        await supabase
          .from('animals')
          .update({ 
            current_weight: event.weight, 
            last_weight_date: event.event_date 
          })
          .eq('id', event.animal_id);
      }

      toast({
        title: 'Evento registrado',
        description: 'El evento ha sido agregado al historial',
      });

      await fetchAnimals();
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
      const orgId = await getOrganizationId();
      setOrganizationId(orgId);
      await fetchAnimals();
    };
    init();
  }, []);

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
