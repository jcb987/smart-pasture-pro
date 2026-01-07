import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface OrganizationLocation {
  id?: string;
  organization_id?: string;
  country: string | null;
  region: string | null;
  municipality: string | null;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
}

export const useOrganizationSettings = () => {
  const [location, setLocation] = useState<OrganizationLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const { toast } = useToast();

  const getOrganizationId = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();
    
    return profile?.organization_id || null;
  }, []);

  const fetchLocation = useCallback(async () => {
    setLoading(true);
    try {
      const orgId = await getOrganizationId();
      if (!orgId) {
        setLoading(false);
        return;
      }
      setOrganizationId(orgId);

      const { data, error } = await supabase
        .from('organization_settings')
        .select('*')
        .eq('organization_id', orgId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setLocation({
          id: data.id,
          organization_id: data.organization_id,
          country: data.country,
          region: data.region,
          municipality: data.municipality,
          latitude: data.latitude ? Number(data.latitude) : null,
          longitude: data.longitude ? Number(data.longitude) : null,
          location_name: data.location_name,
        });
      }
    } catch (error) {
      console.error('Error fetching location:', error);
    } finally {
      setLoading(false);
    }
  }, [getOrganizationId]);

  const saveLocation = async (newLocation: Omit<OrganizationLocation, 'id' | 'organization_id'>) => {
    try {
      const orgId = organizationId || await getOrganizationId();
      if (!orgId) throw new Error('No organization found');

      const locationData = {
        organization_id: orgId,
        country: newLocation.country,
        region: newLocation.region,
        municipality: newLocation.municipality,
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
        location_name: newLocation.location_name,
      };

      if (location?.id) {
        // Update existing
        const { error } = await supabase
          .from('organization_settings')
          .update(locationData)
          .eq('id', location.id);
        
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('organization_settings')
          .insert(locationData);
        
        if (error) throw error;
      }

      await fetchLocation();
      
      toast({
        title: 'Ubicación guardada',
        description: 'La ubicación se ha guardado correctamente.',
      });

      return true;
    } catch (error) {
      console.error('Error saving location:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la ubicación.',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return {
    location,
    loading,
    saveLocation,
    refresh: fetchLocation,
    hasLocation: !!location?.country,
  };
};
