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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { type AppRole } from '@/hooks/useUsers';
import { z } from 'zod';

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated: () => void;
}

const userSchema = z.object({
  email: z.string().trim().email({ message: 'Email inválido' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
  fullName: z.string().trim().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
  phone: z.string().optional(),
  farmName: z.string().optional(),
});

export function CreateUserDialog({ open, onOpenChange, onUserCreated }: CreateUserDialogProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [farmName, setFarmName] = useState('');
  const [role, setRole] = useState<AppRole>('ganadero');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setPhone('');
    setFarmName('');
    setRole('ganadero');
    setErrors({});
  };

  const handleSubmit = async () => {
    try {
      setErrors({});
      
      // Validate input
      const validation = userSchema.safeParse({
        email,
        password,
        fullName,
        phone,
        farmName,
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

      // Create user via Supabase Auth
      const redirectUrl = `${window.location.origin}/`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Update profile with additional info
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            phone: phone || null,
            farm_name: farmName || null,
          })
          .eq('user_id', data.user.id);

        if (profileError) {
          console.error('Error updating profile:', profileError);
        }

        // If role is not default, update it
        if (role !== 'ganadero') {
          const { error: roleError } = await supabase
            .from('user_roles')
            .update({ role })
            .eq('user_id', data.user.id);

          if (roleError) {
            console.error('Error updating role:', roleError);
          }
        }
      }

      toast({
        title: 'Usuario creado',
        description: 'El usuario ha sido creado exitosamente',
      });

      resetForm();
      onOpenChange(false);
      onUserCreated();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error',
        description: `No se pudo crear el usuario: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear nuevo usuario</DialogTitle>
          <DialogDescription>
            Ingresa los datos del nuevo usuario. Recibirá un correo de confirmación.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
          </div>

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
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+57 300 123 4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="farmName">Nombre de la finca</Label>
            <Input
              id="farmName"
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              placeholder="Finca El Progreso"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Select value={role} onValueChange={(value) => setRole(value as AppRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="ganadero">Ganadero</SelectItem>
                <SelectItem value="tecnico">Técnico</SelectItem>
                <SelectItem value="veterinario">Veterinario</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creando...' : 'Crear usuario'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
