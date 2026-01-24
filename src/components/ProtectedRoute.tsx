import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOffline } from '@/contexts/OfflineContext';
import { Loader2, WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { OnboardingSurvey } from '@/components/onboarding/OnboardingSurvey';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, hasOfflineSession } = useAuth();
  const { isOnline } = useOffline();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      // If offline with a valid session, skip onboarding checks
      if (!isOnline && (user || hasOfflineSession)) {
        setShowOnboarding(false);
        setCheckingOnboarding(false);
        return;
      }

      if (!user) {
        setCheckingOnboarding(false);
        return;
      }

      try {
        // Get user's organization and blocked status
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id, is_blocked')
          .eq('user_id', user.id)
          .single();

        // Check if user is blocked
        if (profile?.is_blocked) {
          console.log('[ProtectedRoute] User is blocked, signing out');
          await supabase.auth.signOut();
          window.location.href = '/auth?blocked=true';
          return;
        }

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
        // If offline and we got an error, just let them through
        if (!isOnline) {
          setShowOnboarding(false);
        }
      } finally {
        setCheckingOnboarding(false);
      }
    };

    if (user || (!isOnline && hasOfflineSession)) {
      checkOnboardingStatus();
    } else {
      setCheckingOnboarding(false);
    }
  }, [user, isOnline, hasOfflineSession]);

  if (loading || checkingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          {!isOnline && (
            <div className="flex items-center gap-2 text-amber-600">
              <WifiOff className="h-4 w-4" />
              <span className="text-sm">Cargando datos offline...</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Allow access if user is logged in OR if offline with saved session
  if (!user && !(!isOnline && hasOfflineSession)) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <>
      {/* Only show onboarding when online */}
      {isOnline && (
        <OnboardingSurvey
          open={showOnboarding}
          onComplete={() => setShowOnboarding(false)}
          userId={user?.id || ''}
          organizationId={organizationId}
        />
      )}
      {children}
    </>
  );
};

export default ProtectedRoute;
