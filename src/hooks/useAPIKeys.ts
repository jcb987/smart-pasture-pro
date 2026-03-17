import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface APIKey {
  id: string;
  organization_id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  permissions: string[];
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
}

export interface CreateAPIKeyData {
  name: string;
  permissions: string[];
  expires_at?: string;
}

// Simple hash function for demo purposes
// In production, use a proper crypto library
const hashKey = async (key: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const generateAPIKey = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const prefix = 'agd_';
  let key = prefix;
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
};

export const useAPIKeys = () => {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAPIKeys = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.organization_id) return;

      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys((data as APIKey[]) || []);
    } catch (error: any) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAPIKey = async (keyData: CreateAPIKeyData): Promise<{ success: boolean; key?: string; error?: any }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.organization_id) {
        throw new Error('No organization found');
      }

      const newKey = generateAPIKey();
      const keyHash = await hashKey(newKey);
      const keyPrefix = newKey.substring(0, 8);

      const { error } = await supabase.from('api_keys').insert({
        organization_id: profile.organization_id,
        created_by: user.id,
        name: keyData.name,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        permissions: keyData.permissions,
        expires_at: keyData.expires_at,
      });

      if (error) throw error;

      toast({
        title: '¡API Key creada!',
        description: 'Guarda esta clave, no se mostrará de nuevo.',
      });

      await fetchAPIKeys();
      return { success: true, key: newKey };
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
      return { success: false, error };
    }
  };

  const revokeAPIKey = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: false })
        .eq('id', keyId);

      if (error) throw error;

      toast({
        title: '¡API Key revocada!',
        description: 'La clave ya no funcionará.',
      });

      await fetchAPIKeys();
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

  const deleteAPIKey = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId);

      if (error) throw error;

      toast({
        title: '¡API Key eliminada!',
        description: 'La clave se ha eliminado permanentemente.',
      });

      await fetchAPIKeys();
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

  useEffect(() => {
    fetchAPIKeys();
  }, []);

  const activeKeys = apiKeys.filter(k => k.is_active);
  const revokedKeys = apiKeys.filter(k => !k.is_active);

  return {
    apiKeys,
    loading,
    activeKeys,
    revokedKeys,
    createAPIKey,
    revokeAPIKey,
    deleteAPIKey,
    refetch: fetchAPIKeys,
  };
};

// Available permissions for ERP integration
export const API_PERMISSIONS = [
  { value: 'animals:read', label: 'Leer animales' },
  { value: 'animals:write', label: 'Escribir animales' },
  { value: 'health:read', label: 'Leer salud' },
  { value: 'health:write', label: 'Escribir salud' },
  { value: 'production:read', label: 'Leer producción' },
  { value: 'production:write', label: 'Escribir producción' },
  { value: 'reproduction:read', label: 'Leer reproducción' },
  { value: 'reproduction:write', label: 'Escribir reproducción' },
  { value: 'financial:read', label: 'Leer finanzas' },
  { value: 'financial:write', label: 'Escribir finanzas' },
  { value: 'inventory:read', label: 'Leer inventario' },
  { value: 'inventory:write', label: 'Escribir inventario' },
  { value: 'feed:read', label: 'Leer alimentación' },
  { value: 'feed:write', label: 'Escribir alimentación' },
  { value: 'paddocks:read', label: 'Leer praderas' },
  { value: 'paddocks:write', label: 'Escribir praderas' },
  { value: 'tasks:read', label: 'Leer tareas' },
  { value: 'tasks:write', label: 'Escribir tareas' },
  { value: 'invoices:read', label: 'Leer facturas' },
  { value: 'invoices:write', label: 'Escribir facturas' },
  { value: 'genetics:read', label: 'Leer genética' },
  { value: 'genetics:write', label: 'Escribir genética' },
  { value: '*', label: 'Acceso total (todos los permisos)' },
];
