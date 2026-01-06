import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Paddock } from '@/hooks/usePaddocks';

interface AddMeasurementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (measurement: {
    paddock_id: string;
    measurement_date: string;
    measurement_type?: string;
    grass_height_cm?: number;
    forage_kg_per_ha?: number;
    dry_matter_percentage?: number;
    quality_score?: number;
    notes?: string;
  }) => Promise<any>;
  paddocks: Paddock[];
}

export const AddMeasurementDialog = ({ open, onOpenChange, onSubmit, paddocks }: AddMeasurementDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    paddock_id: '',
    measurement_date: new Date().toISOString().split('T')[0],
    measurement_type: 'manual',
    grass_height_cm: '',
    forage_kg_per_ha: '',
    dry_matter_percentage: '',
    quality_score: '',
    notes: '',
  });

  const selectedPaddock = paddocks.find(p => p.id === form.paddock_id);

  const resetForm = () => {
    setForm({
      paddock_id: '',
      measurement_date: new Date().toISOString().split('T')[0],
      measurement_type: 'manual',
      grass_height_cm: '',
      forage_kg_per_ha: '',
      dry_matter_percentage: '',
      quality_score: '',
      notes: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.paddock_id) return;

    setLoading(true);
    const result = await onSubmit({
      paddock_id: form.paddock_id,
      measurement_date: form.measurement_date,
      measurement_type: form.measurement_type,
      grass_height_cm: form.grass_height_cm ? parseFloat(form.grass_height_cm) : undefined,
      forage_kg_per_ha: form.forage_kg_per_ha ? parseFloat(form.forage_kg_per_ha) : undefined,
      dry_matter_percentage: form.dry_matter_percentage ? parseFloat(form.dry_matter_percentage) : undefined,
      quality_score: form.quality_score ? parseInt(form.quality_score) : undefined,
      notes: form.notes || undefined,
    });

    setLoading(false);
    if (result) {
      resetForm();
      onOpenChange(false);
    }
  };

  const estimatedTotal = form.forage_kg_per_ha && selectedPaddock?.area_hectares
    ? parseFloat(form.forage_kg_per_ha) * selectedPaddock.area_hectares
    : null;

  return (
    <Dialog open={open} onOpenChange={(open) => { onOpenChange(open); if (!open) resetForm(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Aforo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Potrero *</Label>
              <Select value={form.paddock_id} onValueChange={(v) => setForm({ ...form, paddock_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {paddocks.map((paddock) => (
                    <SelectItem key={paddock.id} value={paddock.id}>
                      {paddock.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha *</Label>
              <Input
                type="date"
                value={form.measurement_date}
                onChange={(e) => setForm({ ...form, measurement_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Medición</Label>
              <Select value={form.measurement_type} onValueChange={(v) => setForm({ ...form, measurement_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="estimado">Estimado</SelectItem>
                  <SelectItem value="plato">Plato Medidor</SelectItem>
                  <SelectItem value="drone">Drone/Imagen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Altura Pasto (cm)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="25"
                value={form.grass_height_cm}
                onChange={(e) => setForm({ ...form, grass_height_cm: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Forraje (kg/ha)</Label>
              <Input
                type="number"
                step="1"
                placeholder="2500"
                value={form.forage_kg_per_ha}
                onChange={(e) => setForm({ ...form, forage_kg_per_ha: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Materia Seca (%)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="18"
                value={form.dry_matter_percentage}
                onChange={(e) => setForm({ ...form, dry_matter_percentage: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Calidad Visual (1-5)</Label>
            <Select value={form.quality_score} onValueChange={(v) => setForm({ ...form, quality_score: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Muy pobre</SelectItem>
                <SelectItem value="2">2 - Pobre</SelectItem>
                <SelectItem value="3">3 - Regular</SelectItem>
                <SelectItem value="4">4 - Bueno</SelectItem>
                <SelectItem value="5">5 - Excelente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {estimatedTotal && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Forraje Total Estimado:</strong> {estimatedTotal.toLocaleString()} kg
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              placeholder="Observaciones del aforo..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !form.paddock_id}>
              {loading ? 'Guardando...' : 'Registrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
