import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface RFIDDevice {
  id: string;
  organization_id: string;
  device_name: string;
  device_type: 'bluetooth' | 'usb' | 'network';
  device_id: string | null;
  last_connected_at: string | null;
  is_active: boolean;
  settings: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface RFIDReading {
  id: string;
  organization_id: string;
  device_id: string | null;
  tag_id: string;
  animal_id: string | null;
  read_at: string;
  signal_strength: number | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  action_triggered: string | null;
  created_at: string;
  // Joined data
  animal?: { tag_id: string; name: string | null; rfid_tag: string | null };
  device?: { device_name: string };
}

export interface CreateDeviceData {
  device_name: string;
  device_type: 'bluetooth' | 'usb' | 'network';
  device_id?: string;
  settings?: Record<string, any>;
}

export const useRFID = () => {
  const [devices, setDevices] = useState<RFIDDevice[]>([]);
  const [readings, setReadings] = useState<RFIDReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();

  const fetchDevices = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .single();

      if (!profile?.organization_id) return;

      const { data, error } = await supabase
        .from('rfid_devices')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('device_name');

      if (error) throw error;
      setDevices((data as RFIDDevice[]) || []);
    } catch (error: any) {
      console.error('Error fetching RFID devices:', error);
    }
  };

  const fetchReadings = async (limit = 50) => {
    try {
      setLoading(true);
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .single();

      if (!profile?.organization_id) return;

      const { data, error } = await supabase
        .from('rfid_readings')
        .select(`
          *,
          animal:animals(tag_id, name, rfid_tag),
          device:rfid_devices(device_name)
        `)
        .eq('organization_id', profile.organization_id)
        .order('read_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setReadings((data as any[]) || []);
    } catch (error: any) {
      console.error('Error fetching RFID readings:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDevice = async (deviceData: CreateDeviceData) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .single();

      if (!profile?.organization_id) {
        throw new Error('No organization found');
      }

      const { error } = await supabase.from('rfid_devices').insert({
        organization_id: profile.organization_id,
        ...deviceData,
      });

      if (error) throw error;

      toast({
        title: '¡Dispositivo registrado!',
        description: 'El lector RFID se ha configurado correctamente.',
      });

      await fetchDevices();
      return { success: true };
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
      return { success: false, error };
    }
  };

  const updateDevice = async (deviceId: string, updates: Partial<RFIDDevice>) => {
    try {
      const { error } = await supabase
        .from('rfid_devices')
        .update(updates)
        .eq('id', deviceId);

      if (error) throw error;

      toast({
        title: '¡Dispositivo actualizado!',
        description: 'Los cambios se han guardado.',
      });

      await fetchDevices();
      return { success: true };
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
      return { success: false, error };
    }
  };

  const deleteDevice = async (deviceId: string) => {
    try {
      const { error } = await supabase
        .from('rfid_devices')
        .delete()
        .eq('id', deviceId);

      if (error) throw error;

      toast({
        title: '¡Dispositivo eliminado!',
        description: 'El lector se ha eliminado correctamente.',
      });

      await fetchDevices();
      return { success: true };
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
      return { success: false, error };
    }
  };

  const recordReading = async (tagId: string, deviceId?: string, location?: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .single();

      if (!profile?.organization_id) {
        throw new Error('No organization found');
      }

      // Find animal by RFID tag
      const { data: animal } = await supabase
        .from('animals')
        .select('id, tag_id, name')
        .eq('organization_id', profile.organization_id)
        .eq('rfid_tag', tagId)
        .maybeSingle();

      const { data, error } = await supabase.from('rfid_readings').insert({
        organization_id: profile.organization_id,
        tag_id: tagId,
        device_id: deviceId,
        animal_id: animal?.id || null,
        location,
        read_at: new Date().toISOString(),
      }).select().single();

      if (error) throw error;

      await fetchReadings();
      
      return { 
        success: true, 
        reading: data,
        animal: animal || null,
        isNewTag: !animal,
      };
    } catch (error: any) {
      console.error('Error recording RFID reading:', error);
      return { success: false, error };
    }
  };

  const linkTagToAnimal = async (tagId: string, animalId: string) => {
    try {
      const { error } = await supabase
        .from('animals')
        .update({ rfid_tag: tagId })
        .eq('id', animalId);

      if (error) throw error;

      toast({
        title: '¡Tag vinculado!',
        description: 'El tag RFID se ha asociado al animal correctamente.',
      });

      await fetchReadings();
      return { success: true };
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
      return { success: false, error };
    }
  };

  // Simulated Bluetooth scan for demo purposes
  const startBluetoothScan = useCallback(async () => {
    setIsScanning(true);
    
    // Check if Web Bluetooth API is available
    const nav = navigator as any;
    if (!nav.bluetooth) {
      toast({
        variant: 'destructive',
        title: 'Bluetooth no disponible',
        description: 'Tu navegador no soporta Web Bluetooth. Usa Chrome en un dispositivo compatible.',
      });
      setIsScanning(false);
      return { success: false };
    }

    try {
      // This would connect to a real RFID reader
      // For now, we show a toast explaining the feature
      toast({
        title: 'Buscando dispositivos...',
        description: 'Asegúrate de que tu lector RFID esté encendido y en modo de emparejamiento.',
      });

      // Simulated delay
      await new Promise(resolve => setTimeout(resolve, 3000));

      toast({
        title: 'Escaneo completado',
        description: 'Conecta un lector RFID Bluetooth compatible para usar esta función.',
      });

      setIsScanning(false);
      return { success: true };
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error de conexión',
        description: error.message,
      });
      setIsScanning(false);
      return { success: false, error };
    }
  }, [toast]);

  useEffect(() => {
    fetchDevices();
    fetchReadings();
  }, []);

  const activeDevices = devices.filter(d => d.is_active);
  const recentReadings = readings.slice(0, 10);
  const unlinkedReadings = readings.filter(r => !r.animal_id);

  return {
    devices,
    readings,
    loading,
    isScanning,
    activeDevices,
    recentReadings,
    unlinkedReadings,
    createDevice,
    updateDevice,
    deleteDevice,
    recordReading,
    linkTagToAnimal,
    startBluetoothScan,
    refetchDevices: fetchDevices,
    refetchReadings: fetchReadings,
  };
};
