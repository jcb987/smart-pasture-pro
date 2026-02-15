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
import { Info, Shield, CheckCircle, UserPlus, Eye, EyeOff } from 'lucide-react';

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated: () => void;
  organizationId: string | null;
}

const ROLE_DESCRIPTIONS: Record<AppRole, { emoji: string; label: string; description: string }> = {
  admin: {
    emoji: '⚙️',
    label: 'Administrador',
    description: 'Acceso total: gestión de usuarios, configuración, costos, reportes y todos los módulos',
  },
  ganadero: {
    emoji: '🐄',
    label: 'Ganadero (Mayordomo)',
    description: 'Registro de animales, producción, alimentación, praderas e insumos. Sin acceso a costos ni configuración',
  },
  veterinario: {
    emoji: '🩺',
    label: 'Veterinario',
    description: 'Salud, reproducción, genética y animales. Sin acceso a costos, configuración ni usuarios',
  },
  tecnico: {
    emoji: '🔧',
    label: 'Técnico',
    description: 'Registro de producción, alimentación, praderas e insumos. Sin acceso a salud, costos ni configuración',
  },
};

const createUserSchema = z.object({
  email: z.string().trim().email({ message: 'Email inválido' }),
  fullName: z.string().trim().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
  phone: z.string().optional(),
});

export function CreateUserDialog({ open, onOpenChange, onUserCreated, organizationId }: CreateUserDialogProps) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<AppRole>('ganadero');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [created, setCreated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setEmail('');
    setFullName('');
    setPassword('');
    setPhone('');
    setRole('ganadero');
    setErrors({});
    setCreated(false);
    setShowPassword(false);
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

      const validation = createUserSchema.safeParse({ email, fullName, password, phone });

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

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: 'Error', description: 'Sesión expirada. Inicia sesión de nuevo.', variant: 'destructive' });
        return;
      }

      const response = await supabase.functions.invoke('create-team-user', {
        body: {
          email: email.toLowerCase().trim(),
          password,
          full_name: fullName.trim(),
          phone: phone || null,
          role,
          organization_id: organizationId,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Error al crear usuario');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      setCreated(true);
      toast({
        title: '¡Usuario creado!',
        description: `${fullName} fue creado como ${ROLE_DESCRIPTIONS[role].label}`,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (created) {
      resetForm();
      onUserCreated();
    }
    onOpenChange(false);
  };

  if (created) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Usuario Creado
            </DialogTitle>
          </DialogHeader>

          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-3xl">
              {ROLE_DESCRIPTIONS[role].emoji}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{fullName}</h3>
              <p className="text-muted-foreground">{email}</p>
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Credenciales de acceso:</strong>
                <br />
                Email: <code className="bg-muted px-1 rounded">{email}</code>
                <br />
                Contraseña: la que definiste
                <br />
                Rol: <strong className="capitalize">{ROLE_DESCRIPTIONS[role].label}</strong>
                <br /><br />
                Los permisos por módulo fueron asignados automáticamente según el rol.
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Crear Nuevo Usuario
          </DialogTitle>
          <DialogDescription>
            Crea una cuenta con contraseña. Los permisos se asignan automáticamente según el rol.
          </DialogDescription>
        </DialogHeader>

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
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
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
            <Label htmlFor="role">Rol en la finca *</Label>
            <Select value={role} onValueChange={(value) => setRole(value as AppRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                {(['ganadero', 'veterinario', 'tecnico', 'admin'] as AppRole[]).map((r) => (
                  <SelectItem key={r} value={r}>
                    <span className="flex items-center gap-2">
                      {ROLE_DESCRIPTIONS[r].emoji} {ROLE_DESCRIPTIONS[r].label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {ROLE_DESCRIPTIONS[role] && (
              <p className="text-xs text-muted-foreground p-2 bg-muted/50 rounded-md">
                {ROLE_DESCRIPTIONS[role].description}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              'Creando usuario...'
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Crear Usuario
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
