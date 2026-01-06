import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface AddPaddockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (paddock: {
    name: string;
    area_hectares?: number;
    grass_type?: string;
    soil_type?: string;
    irrigation?: boolean;
    max_capacity?: number;
    recommended_rest_days?: number;
    notes?: string;
  }) => Promise<any>;
  grassTypes: string[];
}

export const AddPaddockDialog = ({ open, onOpenChange, onSubmit, grassTypes }: AddPaddockDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    area_hectares: '',
    grass_type: '',
    soil_type: '',
    irrigation: false,
    max_capacity: '',
    recommended_rest_days: '30',
    notes: '',
  });

  const resetForm = () => {
    setForm({
      name: '',
      area_hectares: '',
      grass_type: '',
      soil_type: '',
      irrigation: false,
      max_capacity: '',
      recommended_rest_days: '30',
      notes: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;

    setLoading(true);
    const result = await onSubmit({
      name: form.name,
      area_hectares: form.area_hectares ? parseFloat(form.area_hectares) : undefined,
      grass_type: form.grass_type || undefined,
      soil_type: form.soil_type || undefined,
      irrigation: form.irrigation,
      max_capacity: form.max_capacity ? parseInt(form.max_capacity) : undefined,
      recommended_rest_days: form.recommended_rest_days ? parseInt(form.recommended_rest_days) : undefined,
      notes: form.notes || undefined,
    });

    setLoading(false);
    if (result) {
      resetForm();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { onOpenChange(open); if (!open) resetForm(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Potrero</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                placeholder="Ej: Potrero Norte 1"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Área (hectáreas)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="10.5"
                value={form.area_hectares}
                onChange={(e) => setForm({ ...form, area_hectares: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Pasto</Label>
              <Select value={form.grass_type} onValueChange={(v) => setForm({ ...form, grass_type: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {grassTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Suelo</Label>
              <Input
                placeholder="Ej: Franco arcilloso"
                value={form.soil_type}
                onChange={(e) => setForm({ ...form, soil_type: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Capacidad Máxima (animales)</Label>
              <Input
                type="number"
                placeholder="20"
                value={form.max_capacity}
                onChange={(e) => setForm({ ...form, max_capacity: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Días Descanso Recomendados</Label>
              <Input
                type="number"
                placeholder="30"
                value={form.recommended_rest_days}
                onChange={(e) => setForm({ ...form, recommended_rest_days: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="irrigation"
              checked={form.irrigation}
              onCheckedChange={(checked) => setForm({ ...form, irrigation: checked })}
            />
            <Label htmlFor="irrigation">Tiene sistema de riego</Label>
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              placeholder="Observaciones del potrero..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !form.name}>
              {loading ? 'Guardando...' : 'Agregar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
