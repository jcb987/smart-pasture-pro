import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useFounderAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const signInAsFounder = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // First, sign in normally
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        toast({
          variant: 'destructive',
          title: 'Error de autenticación',
          description: authError.message === 'Invalid login credentials' 
            ? 'Credenciales inválidas. Verifica tu email y contraseña.'
            : authError.message,
        });
        return { success: false };
      }

      if (!authData.user) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo obtener información del usuario.',
        });
        return { success: false };
      }

      // Check if user has founder role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authData.user.id)
        .eq('role', 'founder')
        .maybeSingle();

      if (roleError) {
        console.error('Error checking founder role:', roleError);
        await supabase.auth.signOut();
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Error al verificar permisos.',
        });
        return { success: false };
      }

      if (!roleData) {
        // Not a founder, sign out
        await supabase.auth.signOut();
        toast({
          variant: 'destructive',
          title: 'Acceso Denegado',
          description: 'Esta cuenta no tiene permisos de Founder.',
        });
        return { success: false };
      }

      // Log founder login
      await supabase.from('founder_access_logs').insert({
        founder_user_id: authData.user.id,
        action: 'founder_login',
        details: { email },
      });

      toast({
        title: '¡Bienvenido Founder!',
        description: 'Has iniciado sesión como administrador del sistema.',
      });

      return { success: true };
    } catch (error) {
      console.error('Founder auth error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Ocurrió un error inesperado.',
      });
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  return { signInAsFounder, isLoading };
}
