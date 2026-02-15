import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PartyPopper } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WelcomeDialogProps {
  open: boolean;
  onComplete: () => void;
  userId: string;
  organizationId: string | null;
  organizationName: string | null;
  userRole: string | null;
}

export const WelcomeDialog = ({ open, onComplete, userId, organizationId, organizationName, userRole }: WelcomeDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const roleLabel = {
    admin: 'Administrador',
    ganadero: 'Ganadero',
    veterinario: 'Veterinario',
    tecnico: 'Técnico',
  }[userRole || ''] || userRole || 'Miembro del equipo';

  const handleStart = async () => {
    setLoading(true);
    try {
      // Map role to valid primary_role value
      const validRole = ['ganadero', 'veterinario', 'administrador'].includes(userRole || '')
        ? userRole!
        : userRole === 'tecnico' ? 'ganadero' : 'ganadero';

      await supabase.from('user_onboarding').insert({
        user_id: userId,
        organization_id: organizationId,
        primary_role: validRole,
        production_type: 'doble_proposito',
        species: ['bovinos'],
        herd_size: '1-50',
        main_challenge: 'organizacion',
      });
      onComplete();
    } catch (error) {
      console.error('Error completing welcome:', error);
      toast({ title: 'Error', description: 'No se pudo completar. Intenta de nuevo.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center items-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <PartyPopper className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl">¡Bienvenido al equipo!</DialogTitle>
          <DialogDescription className="text-base mt-2">
            Has sido agregado como <strong>{roleLabel}</strong>
            {organizationName && (
              <> en <strong>{organizationName}</strong></>
            )}
            . Ya puedes comenzar a usar el sistema.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <Button onClick={handleStart} disabled={loading} className="w-full" size="lg">
            {loading ? 'Preparando...' : 'Comenzar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
