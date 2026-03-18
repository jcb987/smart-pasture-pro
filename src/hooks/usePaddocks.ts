import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface Paddock {
  id: string;
  name: string;
  area_hectares: number | null;
  grass_type: string | null;
  soil_type: string | null;
  irrigation: boolean;
  current_status: string;
  current_animals: number;
  max_capacity: number | null;
  last_occupation_date: string | null;
  last_rest_start: string | null;
  recommended_rest_days: number;
  notes: string | null;
  created_at: string;
}

export interface PaddockRotation {
  id: string;
  paddock_id: string;
  lot_name: string | null;
  animals_count: number | null;
  entry_date: string;
  exit_date: string | null;
  days_occupied: number | null;
  entry_forage_kg: number | null;
  exit_forage_kg: number | null;
  forage_consumed_kg: number | null;
  notes: string | null;
  created_at: string;
  paddock?: Paddock;
}

export interface ForageMeasurement {
  id: string;
  paddock_id: string;
  measurement_date: string;
  measurement_type: string;
  grass_height_cm: number | null;
  forage_kg_per_ha: number | null;
  total_forage_kg: number | null;
  dry_matter_percentage: number | null;
  quality_score: number | null;
  notes: string | null;
  created_at: string;
  paddock?: Paddock;
}

export interface PaddockStats {
  totalPaddocks: number;
  totalHectares: number;
  occupiedPaddocks: number;
  restingPaddocks: number;
  availablePaddocks: number;
  avgRestDays: number;
  totalAnimalsInPasture: number;
}

const GRASS_TYPES = [
  'Kikuyo',
  'Ryegrass',
  'Brachiaria',
  'Estrella',
  'Guinea',
  'Pará',
  'Angleton',
  'Mixto',
  'Otro',
];

const PADDOCK_STATUSES = [
  { value: 'disponible', label: 'Disponible', color: 'bg-green-600' },
  { value: 'ocupado', label: 'Ocupado', color: 'bg-blue-600' },
  { value: 'en_descanso', label: 'En Descanso', color: 'bg-amber-600' },
  { value: 'en_recuperacion', label: 'En Recuperación', color: 'bg-purple-600' },
];

export const usePaddocks = () => {
  const [paddocks, setPaddocks] = useState<Paddock[]>([]);
  const [rotations, setRotations] = useState<PaddockRotation[]>([]);
  const [measurements, setMeasurements] = useState<ForageMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const getOrganizationId = async () => {
    if (!user) return null;
    const { data } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();
    return data?.organization_id || null;
  };

  const fetchPaddocks = async (orgId?: string) => {
    const resolvedId = orgId || organizationId;
    if (!resolvedId) return;
    try {
      const { data, error } = await supabase
        .from('paddocks')
        .select('*')
        .eq('organization_id', resolvedId)
        .order('name');

      if (error) throw error;
      setPaddocks((data || []) as Paddock[]);
    } catch (error: any) {
      toast({ title: 'Error', description: 'No se pudieron cargar los potreros', variant: 'destructive' });
    }
  };

  const fetchRotations = async (orgId?: string) => {
    const resolvedId = orgId || organizationId;
    if (!resolvedId) return;
    try {
      const { data, error } = await supabase
        .from('paddock_rotations')
        .select(`*, paddock:paddocks(*)`)
        .eq('organization_id', resolvedId)
        .order('entry_date', { ascending: false })
        .limit(100);

      if (error) throw error;
      setRotations((data || []) as PaddockRotation[]);
    } catch (error: any) {
      toast({ title: 'Error', description: 'No se pudo cargar el historial', variant: 'destructive' });
    }
  };

  const fetchMeasurements = async (orgId?: string) => {
    const resolvedId = orgId || organizationId;
    if (!resolvedId) return;
    try {
      const { data, error } = await supabase
        .from('forage_measurements')
        .select(`*, paddock:paddocks(*)`)
        .eq('organization_id', resolvedId)
        .order('measurement_date', { ascending: false })
        .limit(100);

      if (error) throw error;
      setMeasurements((data || []) as ForageMeasurement[]);
    } catch (error: any) {
      toast({ title: 'Error', description: 'No se pudieron cargar los aforos', variant: 'destructive' });
    }
  };

  const fetchAll = async (orgId?: string) => {
    const resolvedId = orgId || organizationId || await getOrganizationId();
    if (!resolvedId) return;
    setLoading(true);
    await Promise.all([fetchPaddocks(resolvedId), fetchRotations(resolvedId), fetchMeasurements(resolvedId)]);
    setLoading(false);
  };

  // Paddock CRUD
  const addPaddock = async (paddock: {
    name: string;
    area_hectares?: number;
    grass_type?: string;
    soil_type?: string;
    irrigation?: boolean;
    max_capacity?: number;
    recommended_rest_days?: number;
    notes?: string;
  }) => {
    if (!organizationId) {
      toast({ title: 'Error', description: 'Organización no encontrada', variant: 'destructive' });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('paddocks')
        .insert({ ...paddock, organization_id: organizationId })
        .select()
        .single();

      if (error) throw error;
      toast({ title: 'Éxito', description: 'Potrero agregado' });
      await fetchPaddocks();
      return data;
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const updatePaddock = async (id: string, updates: Partial<Paddock>) => {
    try {
      const { error } = await supabase
        .from('paddocks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Éxito', description: 'Potrero actualizado' });
      await fetchPaddocks();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const deletePaddock = async (id: string) => {
    try {
      const { error } = await supabase.from('paddocks').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Éxito', description: 'Potrero eliminado' });
      await fetchPaddocks();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // Rotation management
  const startRotation = async (rotation: {
    paddock_id: string;
    lot_name: string;
    animals_count: number;
    entry_date: string;
    entry_forage_kg?: number;
    notes?: string;
  }) => {
    if (!organizationId) {
      toast({ title: 'Error', description: 'Organización no encontrada', variant: 'destructive' });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('paddock_rotations')
        .insert({ ...rotation, organization_id: organizationId, created_by: user?.id })
        .select()
        .single();

      if (error) throw error;

      // Update paddock status
      await supabase
        .from('paddocks')
        .update({
          current_status: 'ocupado',
          current_animals: rotation.animals_count,
          last_occupation_date: rotation.entry_date,
          updated_at: new Date().toISOString(),
        })
        .eq('id', rotation.paddock_id);

      toast({ title: 'Éxito', description: 'Rotación iniciada' });
      await Promise.all([fetchPaddocks(), fetchRotations()]);
      return data;
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const endRotation = async (rotationId: string, exitData: {
    exit_date: string;
    exit_forage_kg?: number;
    notes?: string;
  }) => {
    try {
      const rotation = rotations.find(r => r.id === rotationId);
      if (!rotation) throw new Error('Rotación no encontrada');

      const entryDate = new Date(rotation.entry_date);
      const exitDate = new Date(exitData.exit_date);
      const daysOccupied = Math.ceil((exitDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      const forageConsumed = rotation.entry_forage_kg && exitData.exit_forage_kg
        ? rotation.entry_forage_kg - exitData.exit_forage_kg
        : null;

      const { error } = await supabase
        .from('paddock_rotations')
        .update({
          exit_date: exitData.exit_date,
          exit_forage_kg: exitData.exit_forage_kg,
          days_occupied: daysOccupied,
          forage_consumed_kg: forageConsumed,
          notes: exitData.notes,
        })
        .eq('id', rotationId);

      if (error) throw error;

      // Update paddock status to resting
      await supabase
        .from('paddocks')
        .update({
          current_status: 'en_descanso',
          current_animals: 0,
          last_rest_start: exitData.exit_date,
          updated_at: new Date().toISOString(),
        })
        .eq('id', rotation.paddock_id);

      toast({ title: 'Éxito', description: 'Rotación finalizada' });
      await Promise.all([fetchPaddocks(), fetchRotations()]);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // Forage measurements
  const addMeasurement = async (measurement: {
    paddock_id: string;
    measurement_date: string;
    measurement_type?: string;
    grass_height_cm?: number;
    forage_kg_per_ha?: number;
    dry_matter_percentage?: number;
    quality_score?: number;
    notes?: string;
  }) => {
    if (!organizationId) {
      toast({ title: 'Error', description: 'Organización no encontrada', variant: 'destructive' });
      return null;
    }

    try {
      const paddock = paddocks.find(p => p.id === measurement.paddock_id);
      const totalForage = measurement.forage_kg_per_ha && paddock?.area_hectares
        ? measurement.forage_kg_per_ha * paddock.area_hectares
        : null;

      const { data, error } = await supabase
        .from('forage_measurements')
        .insert({
          ...measurement,
          total_forage_kg: totalForage,
          organization_id: organizationId,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      toast({ title: 'Éxito', description: 'Aforo registrado' });
      await fetchMeasurements();
      return data;
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const deleteMeasurement = async (id: string) => {
    try {
      const { error } = await supabase.from('forage_measurements').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Éxito', description: 'Aforo eliminado' });
      await fetchMeasurements();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const getStats = (): PaddockStats => {
    const totalHectares = paddocks.reduce((sum, p) => sum + (p.area_hectares || 0), 0);
    const occupiedPaddocks = paddocks.filter(p => p.current_status === 'ocupado').length;
    const restingPaddocks = paddocks.filter(p => p.current_status === 'en_descanso').length;
    const availablePaddocks = paddocks.filter(p => p.current_status === 'disponible').length;
    const totalAnimalsInPasture = paddocks.reduce((sum, p) => sum + (p.current_animals || 0), 0);

    // Calculate average rest days for paddocks in rest
    const restingWithDates = paddocks.filter(p => p.current_status === 'en_descanso' && p.last_rest_start);
    const avgRestDays = restingWithDates.length > 0
      ? restingWithDates.reduce((sum, p) => {
          const days = Math.ceil(
            (new Date().getTime() - new Date(p.last_rest_start!).getTime()) / (1000 * 60 * 60 * 24)
          );
          return sum + days;
        }, 0) / restingWithDates.length
      : 0;

    return {
      totalPaddocks: paddocks.length,
      totalHectares,
      occupiedPaddocks,
      restingPaddocks,
      availablePaddocks,
      avgRestDays,
      totalAnimalsInPasture,
    };
  };

  const getRestAlerts = () => {
    const today = new Date();
    return paddocks.filter(p => {
      if (p.current_status !== 'en_descanso' || !p.last_rest_start) return false;
      const restDays = Math.ceil(
        (today.getTime() - new Date(p.last_rest_start).getTime()) / (1000 * 60 * 60 * 24)
      );
      return restDays >= p.recommended_rest_days;
    });
  };

  useEffect(() => {
    const init = async () => {
      const orgId = await getOrganizationId();
      setOrganizationId(orgId);
      if (orgId) {
        await fetchAll(orgId);
      }
    };
    init();
  }, [user]);

  return {
    paddocks,
    rotations,
    measurements,
    loading,
    addPaddock,
    updatePaddock,
    deletePaddock,
    startRotation,
    endRotation,
    addMeasurement,
    deleteMeasurement,
    getStats,
    getRestAlerts,
    fetchAll,
    GRASS_TYPES,
    PADDOCK_STATUSES,
  };
};
