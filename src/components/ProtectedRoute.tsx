import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOffline } from '@/contexts/OfflineContext';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { OnboardingSurvey } from '@/components/onboarding/OnboardingSurvey';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const { isOnline } = useOffline();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
        setCheckingOnboarding(false);
        return;
      }

      // Offline: no bloqueamos el acceso por onboarding (requiere consultas online)
      if (!isOnline) {
        setShowOnboarding(false);
        setCheckingOnboarding(false);
        return;
      }

      try {
        // Get user's organization
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();

        setOrganizationId(profile?.organization_id || null);

        // Check if onboarding is completed
        const { data: onboarding } = await supabase
          .from('user_onboarding')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!onboarding) {
          setShowOnboarding(true);
        }
      } catch (error) {
        console.error('Error checking onboarding:', error);
      } finally {
        setCheckingOnboarding(false);
      }
    };

    if (user) {
      checkOnboardingStatus();
    } else {
      setCheckingOnboarding(false);
    }
  }, [user, isOnline]);

  if (loading || checkingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <>
      <OnboardingSurvey
        open={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
        userId={user.id}
        organizationId={organizationId}
      />
      {children}
    </>
  );
};

export default ProtectedRoute;
