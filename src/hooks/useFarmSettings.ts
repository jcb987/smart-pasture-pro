import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FarmSettings {
  farmName: string;
  ownerName: string;
  phone: string;
  municipio: string;
  departamento: string;
  productionType: string;
  organizationId: string | null;
}

interface UseFarmSettingsReturn {
  settings: FarmSettings | null;
  loading: boolean;
  isConfigured: boolean;
  refetch: () => void;
}

export const useFarmSettings = (): UseFarmSettingsReturn => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<FarmSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // 1. Read profiles: farm_name, full_name, phone, organization_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('farm_name, full_name, phone, organization_id')
        .eq('user_id', user.id)
        .maybeSingle();

      const orgId = profile?.organization_id || null;

      // 2. Read organization_settings: municipality, region
      let municipio = '';
      let departamento = '';
      if (orgId) {
        const { data: orgSettings } = await supabase
          .from('organization_settings')
          .select('municipality, region')
          .eq('organization_id', orgId)
          .maybeSingle();
        municipio = orgSettings?.municipality || '';
        departamento = orgSettings?.region || '';
      }

      // 3. Read production_type from localStorage (set by FarmSetupWizard)
      const productionType = orgId
        ? localStorage.getItem(`agrodata_prod_type_${orgId}`) || ''
        : '';

      setSettings({
        farmName: profile?.farm_name || '',
        ownerName: profile?.full_name || '',
        phone: profile?.phone || '',
        municipio,
        departamento,
        productionType,
        organizationId: orgId,
      });
    } catch (err) {
      console.error('[useFarmSettings] Error fetching settings:', err);
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    isConfigured: !!settings?.farmName,
    refetch: fetchSettings,
  };
};
