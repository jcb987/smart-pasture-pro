import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface FarmBoundary {
  id: string;
  organization_id: string;
  name: string;
  boundary_polygon: any; // GeoJSON
  area_hectares: number | null;
  center_lat: number | null;
  center_lng: number | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MapLot {
  id: string;
  name: string;
  boundary_polygon: any; // GeoJSON
  area_hectares: number | null;
  center_lat: number | null;
  center_lng: number | null;
  lot_color: string;
  lot_usage: string;
  current_status: string;
  current_animals: number;
  max_capacity: number | null;
  grass_type: string | null;
  farm_boundary_id: string | null;
}

// Calculate area of a polygon in hectares using the Shoelace formula with lat/lng
export function calculatePolygonAreaHectares(latlngs: { lat: number; lng: number }[]): number {
  if (latlngs.length < 3) return 0;
  
  // Use a simple spherical approximation
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  let area = 0;
  const n = latlngs.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const lat1 = toRad(latlngs[i].lat);
    const lat2 = toRad(latlngs[j].lat);
    const dLng = toRad(latlngs[j].lng - latlngs[i].lng);
    area += dLng * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  
  area = Math.abs((area * 6378137 * 6378137) / 2);
  return area / 10000; // Convert m² to hectares
}

export function getPolygonCenter(latlngs: { lat: number; lng: number }[]): { lat: number; lng: number } {
  if (latlngs.length === 0) return { lat: 4.6, lng: -74.08 };
  const lat = latlngs.reduce((s, p) => s + p.lat, 0) / latlngs.length;
  const lng = latlngs.reduce((s, p) => s + p.lng, 0) / latlngs.length;
  return { lat, lng };
}

const LOT_COLORS = [
  '#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#F97316', '#EC4899', '#14B8A6', '#6366F1',
];

export const useFarmMap = () => {
  const [farmBoundary, setFarmBoundary] = useState<FarmBoundary | null>(null);
  const [lots, setLots] = useState<MapLot[]>([]);
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

  const fetchFarmBoundary = async () => {
    try {
      const { data, error } = await supabase
        .from('farm_boundaries')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      setFarmBoundary(data as FarmBoundary | null);
    } catch (error: any) {
      console.error('Error fetching farm boundary:', error);
    }
  };

  const fetchLots = async () => {
    try {
      const { data, error } = await supabase
        .from('paddocks')
        .select('id, name, boundary_polygon, area_hectares, center_lat, center_lng, lot_color, lot_usage, current_status, current_animals, max_capacity, grass_type, farm_boundary_id')
        .not('boundary_polygon', 'is', null)
        .order('name');
      if (error) throw error;
      setLots((data || []) as MapLot[]);
    } catch (error: any) {
      console.error('Error fetching lots:', error);
    }
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchFarmBoundary(), fetchLots()]);
    setLoading(false);
  }, []);

  const saveFarmBoundary = async (data: {
    name: string;
    boundary_polygon: any;
    area_hectares: number;
    center_lat: number;
    center_lng: number;
    address?: string;
  }) => {
    if (!organizationId) {
      toast({ title: 'Error', description: 'Organización no encontrada', variant: 'destructive' });
      return null;
    }

    try {
      if (farmBoundary) {
        // Update
        const { error } = await supabase
          .from('farm_boundaries')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', farmBoundary.id);
        if (error) throw error;
        toast({ title: 'Éxito', description: 'Límites de finca actualizados' });
      } else {
        // Insert
        const { error } = await supabase
          .from('farm_boundaries')
          .insert({ ...data, organization_id: organizationId });
        if (error) throw error;
        toast({ title: 'Éxito', description: 'Finca definida correctamente' });
      }
      await fetchFarmBoundary();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const saveLot = async (data: {
    name: string;
    boundary_polygon: any;
    area_hectares: number;
    center_lat: number;
    center_lng: number;
    lot_color?: string;
    lot_usage?: string;
    max_capacity?: number;
    grass_type?: string;
  }) => {
    if (!organizationId) {
      toast({ title: 'Error', description: 'Organización no encontrada', variant: 'destructive' });
      return null;
    }

    try {
      const color = data.lot_color || LOT_COLORS[lots.length % LOT_COLORS.length];
      const { error } = await supabase
        .from('paddocks')
        .insert({
          name: data.name,
          boundary_polygon: data.boundary_polygon,
          area_hectares: data.area_hectares,
          center_lat: data.center_lat,
          center_lng: data.center_lng,
          lot_color: color,
          lot_usage: data.lot_usage || 'pastoreo',
          max_capacity: data.max_capacity,
          grass_type: data.grass_type,
          organization_id: organizationId,
          farm_boundary_id: farmBoundary?.id || null,
        });
      if (error) throw error;
      toast({ title: 'Éxito', description: `Lote "${data.name}" creado` });
      await fetchLots();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const updateLotPolygon = async (id: string, polygon: any, area: number, center: { lat: number; lng: number }) => {
    try {
      const { error } = await supabase
        .from('paddocks')
        .update({
          boundary_polygon: polygon,
          area_hectares: area,
          center_lat: center.lat,
          center_lng: center.lng,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
      await fetchLots();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const deleteLotPolygon = async (id: string) => {
    try {
      const { error } = await supabase
        .from('paddocks')
        .update({
          boundary_polygon: null,
          center_lat: null,
          center_lng: null,
          farm_boundary_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Éxito', description: 'Polígono del lote eliminado' });
      await fetchLots();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  useEffect(() => {
    const init = async () => {
      const orgId = await getOrganizationId();
      setOrganizationId(orgId);
      if (orgId) await fetchAll();
      else setLoading(false);
    };
    init();
  }, [user]);

  return {
    farmBoundary,
    lots,
    loading,
    organizationId,
    saveFarmBoundary,
    saveLot,
    updateLotPolygon,
    deleteLotPolygon,
    fetchAll,
    LOT_COLORS,
  };
};
