import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Json } from '@/integrations/supabase/types';

interface FounderContextType {
  isFounder: boolean;
  isFounderMode: boolean;
  targetOrganizationId: string | null;
  targetOrganizationName: string | null;
  enterFounderMode: (orgId: string, orgName: string) => Promise<void>;
  exitFounderMode: () => void;
  logFounderAction: (action: string, details?: Record<string, unknown>) => Promise<void>;
  loading: boolean;
}

const FounderContext = createContext<FounderContextType | undefined>(undefined);

export const useFounder = () => {
  const context = useContext(FounderContext);
  if (context === undefined) {
    throw new Error('useFounder must be used within a FounderProvider');
  }
  return context;
};

export const FounderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isFounder, setIsFounder] = useState(false);
  const [isFounderMode, setIsFounderMode] = useState(false);
  const [targetOrganizationId, setTargetOrganizationId] = useState<string | null>(null);
  const [targetOrganizationName, setTargetOrganizationName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkFounderStatus = async () => {
      if (!user) {
        setIsFounder(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'founder')
          .maybeSingle();

        if (error) throw error;
        setIsFounder(!!data);
      } catch (error) {
        console.error('Error checking founder status:', error);
        setIsFounder(false);
      } finally {
        setLoading(false);
      }
    };

    checkFounderStatus();
  }, [user]);

  const logFounderAction = useCallback(async (action: string, details?: Record<string, unknown>) => {
    if (!isFounder || !user) return;

    try {
      await supabase.from('founder_access_logs').insert([{
        founder_user_id: user.id,
        target_organization_id: targetOrganizationId,
        action,
        details: (details || null) as Json,
      }]);
    } catch (error) {
      console.error('Error logging founder action:', error);
    }
  }, [isFounder, user, targetOrganizationId]);

  const enterFounderMode = useCallback(async (orgId: string, orgName: string) => {
    if (!isFounder) return;

    setTargetOrganizationId(orgId);
    setTargetOrganizationName(orgName);
    setIsFounderMode(true);

    await logFounderAction('enter_founder_mode', { 
      organization_id: orgId,
      organization_name: orgName 
    });
  }, [isFounder, logFounderAction]);

  const exitFounderMode = useCallback(() => {
    logFounderAction('exit_founder_mode', { 
      organization_id: targetOrganizationId,
      organization_name: targetOrganizationName 
    });
    
    setTargetOrganizationId(null);
    setTargetOrganizationName(null);
    setIsFounderMode(false);
  }, [logFounderAction, targetOrganizationId, targetOrganizationName]);

  return (
    <FounderContext.Provider 
      value={{ 
        isFounder, 
        isFounderMode, 
        targetOrganizationId, 
        targetOrganizationName,
        enterFounderMode, 
        exitFounderMode, 
        logFounderAction,
        loading 
      }}
    >
      {children}
    </FounderContext.Provider>
  );
};
