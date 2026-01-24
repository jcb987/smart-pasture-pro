import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { type AppRole } from '@/hooks/useUsers';
import { z } from 'zod';
import { Mail, Info, Shield, CheckCircle } from 'lucide-react';

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated: () => void;
  organizationId: string | null;
}

const inviteSchema = z.object({
  email: z.string().trim().email({ message: 'Email inválido' }),
  fullName: z.string().trim().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
  phone: z.string().optional(),
});

export function CreateUserDialog({ open, onOpenChange, onUserCreated, organizationId }: CreateUserDialogProps) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<AppRole>('ganadero');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [inviteSent, setInviteSent] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setEmail('');
    setFullName('');
    setPhone('');
    setRole('ganadero');
    setErrors({});
    setInviteSent(false);
  };

  const handleSubmit = async () => {
    try {
      setErrors({});
      
      if (!organizationId) {
        toast({
          title: 'Error',
          description: 'No se encontró la organización. Por favor recarga la página.',
          variant: 'destructive',
        });
        return;
      }

      // Validate input
      const validation = inviteSchema.safeParse({
        email,
        fullName,
        phone,
      });

      if (!validation.success) {
        const fieldErrors: Record<string, string> = {};
        validation.error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }

      setLoading(true);

      // Usar Supabase Auth magic link para invitar al usuario
      // El usuario recibirá un enlace para crear su cuenta
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth`,
          data: {
            full_name: fullName.trim(),
            phone: phone || null,
            role: role,
            organization_id: organizationId,
            invited: true,
          },
        },
      });

      if (authError) throw authError;
      
      setInviteSent(true);
      toast({
        title: '¡Invitación enviada!',
        description: `Se ha enviado un enlace de acceso a ${email}. El usuario podrá crear su contraseña al ingresar.`,
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error',
        description: `No se pudo enviar la invitación: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (inviteSent) {
      resetForm();
      onUserCreated();
    }
    onOpenChange(false);
  };

  // Vista de invitación enviada
  if (inviteSent) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Invitación Enviada
            </DialogTitle>
          </DialogHeader>

          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
              <Mail className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{fullName}</h3>
              <p className="text-muted-foreground">{email}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Hemos enviado un enlace de acceso al correo indicado. 
              El usuario podrá crear su propia contraseña al ingresar por primera vez.
            </p>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                El usuario será asignado automáticamente como <strong className="capitalize">{role}</strong> en tu organización.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button onClick={handleClose} className="w-full">
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Invitar Nuevo Usuario
          </DialogTitle>
          <DialogDescription>
            Envía una invitación por correo electrónico. El usuario creará su propia contraseña.
          </DialogDescription>
        </DialogHeader>

        <Alert className="bg-primary/5 border-primary/20">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Flujo seguro:</strong> El administrador no crea contraseñas. 
            El usuario recibirá un enlace para registrarse de forma segura.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre completo *</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Juan Pérez"
            />
            {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
            />
            <p className="text-xs text-muted-foreground">
              Se enviará un enlace de invitación a este correo
            </p>
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono (opcional)</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+57 300 123 4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rol en la finca</Label>
            <Select value={role} onValueChange={(value) => setRole(value as AppRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ganadero">
                  <span className="flex items-center gap-2">
                    🐄 Ganadero
                  </span>
                </SelectItem>
                <SelectItem value="tecnico">
                  <span className="flex items-center gap-2">
                    🔧 Técnico
                  </span>
                </SelectItem>
                <SelectItem value="veterinario">
                  <span className="flex items-center gap-2">
                    🩺 Veterinario
                  </span>
                </SelectItem>
                <SelectItem value="admin">
                  <span className="flex items-center gap-2">
                    ⚙️ Administrador
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Define qué puede hacer este miembro en el sistema
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>Enviando invitación...</>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Enviar Invitación
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}