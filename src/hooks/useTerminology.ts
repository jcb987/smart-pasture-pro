import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getTerms, TermKey } from '@/lib/terminology';

export const useTerminology = () => {
  const { user } = useAuth();
  const [isVet, setIsVet] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkRole = async () => {
      // Check user_roles table first
      const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'veterinario')
        .maybeSingle();

      if (roleRow) {
        setIsVet(true);
        return;
      }

      // Fallback: check onboarding primary_role
      const { data: onboarding } = await supabase
        .from('user_onboarding')
        .select('primary_role')
        .eq('user_id', user.id)
        .maybeSingle();

      setIsVet(onboarding?.primary_role === 'veterinario');
    };

    checkRole();
  }, [user]);

  const terms = getTerms(isVet);

  const t = (key: TermKey): string => terms[key];

  return { isVet, t, terms };
};
