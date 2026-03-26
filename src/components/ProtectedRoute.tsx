import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOffline } from '@/contexts/OfflineContext';
import { Loader2, WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

import { WelcomeDialog } from '@/components/onboarding/WelcomeDialog';
import { FarmSetupWizard } from '@/components/onboarding/FarmSetupWizard';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, hasOfflineSession } = useAuth();
  const { isOnline } = useOffline();
  const [showFarmSetup, setShowFarmSetup] = useState(false);
  
  const [showWelcome, setShowWelcome] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!isOnline && (user || hasOfflineSession)) {
        setShowWelcome(false);
        setCheckingOnboarding(false);
        return;
      }

      if (!user) {
        setCheckingOnboarding(false);
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id, is_blocked, is_team_member, farm_name')
          .eq('user_id', user.id)
          .single();

        if (profile?.is_blocked) {
          console.log('[ProtectedRoute] User is blocked, signing out');
          await supabase.auth.signOut();
          window.location.href = '/auth?blocked=true';
          return;
        }

        setOrganizationId(profile?.organization_id || null);
        const isTeamMember = (profile as any)?.is_team_member === true;

        // Show farm setup wizard if farm_name is not set yet
        if (!profile?.farm_name) {
          setShowFarmSetup(true);
        }

        const { data: onboarding } = await supabase
          .from('user_onboarding')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!onboarding) {
          if (isTeamMember) {
            if (profile?.organization_id) {
              const { data: org } = await supabase
                .from('organizations')
                .select('name')
                .eq('id', profile.organization_id)
                .single();
              setOrganizationName(org?.name || null);
            }
            const { data: roleData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', user.id)
              .maybeSingle();
            setUserRole(roleData?.role || null);
            setShowWelcome(true);
          }
          // Non-team users: no survey, farm setup wizard handles onboarding record
        }
      } catch (error) {
        console.error('Error checking onboarding:', error);
        if (!isOnline) {
          setShowOnboarding(false);
          setShowWelcome(false);
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

  if (!user && !(!isOnline && hasOfflineSession)) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <>
      {isOnline && (
        <>
          <FarmSetupWizard
            open={showFarmSetup}
            onComplete={() => setShowFarmSetup(false)}
            userId={user?.id || ''}
            organizationId={organizationId}
          />
          <OnboardingSurvey
            open={!showFarmSetup && showOnboarding}
            onComplete={() => setShowOnboarding(false)}
            userId={user?.id || ''}
            organizationId={organizationId}
          />
          <WelcomeDialog
            open={!showFarmSetup && showWelcome}
            onComplete={() => setShowWelcome(false)}
            userId={user?.id || ''}
            organizationId={organizationId}
            organizationName={organizationName}
            userRole={userRole}
          />
        </>
      )}
      {children}
    </>
  );
};

export default ProtectedRoute;
