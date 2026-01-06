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
  organizationId: string | null;
}

const userSchema = z.object({
  email: z.string().trim().email({ message: 'Email inválido' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
  fullName: z.string().trim().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
  phone: z.string().optional(),
});

export function CreateUserDialog({ open, onOpenChange, onUserCreated, organizationId }: CreateUserDialogProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<AppRole>('ganadero');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setPhone('');
    setRole('ganadero');
    setErrors({});
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
      const validation = userSchema.safeParse({
        email,
        password,
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

      // Crear el perfil directamente en la base de datos (el usuario se unirá a la organización existente)
      // Primero insertar en profiles con la organización del dueño
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: crypto.randomUUID(), // ID temporal, se actualizará cuando el usuario se registre
          full_name: fullName,
          phone: phone || null,
          organization_id: organizationId,
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Insertar el rol
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: profileData.user_id,
          role: role,
          organization_id: organizationId,
        });

      if (roleError) {
        console.error('Error creating role:', roleError);
      }

      toast({
        title: 'Usuario agregado',
        description: `${fullName} ha sido agregado a tu equipo con el rol de ${role}`,
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
          <DialogTitle>Agregar miembro al equipo</DialogTitle>
          <DialogDescription>
            Agrega un nuevo miembro a tu finca. Podrás asignarle un rol y permisos específicos.
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
            <Label htmlFor="phone">Teléfono</Label>
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
                <SelectItem value="ganadero">Ganadero</SelectItem>
                <SelectItem value="tecnico">Técnico</SelectItem>
                <SelectItem value="veterinario">Veterinario</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
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
            {loading ? 'Agregando...' : 'Agregar miembro'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
