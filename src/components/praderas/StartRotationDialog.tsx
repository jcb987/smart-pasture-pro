import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Paddock } from '@/hooks/usePaddocks';

interface StartRotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (rotation: {
    paddock_id: string;
    lot_name: string;
    animals_count: number;
    entry_date: string;
    entry_forage_kg?: number;
    notes?: string;
  }) => Promise<any>;
  paddocks: Paddock[];
}

export const StartRotationDialog = ({ open, onOpenChange, onSubmit, paddocks }: StartRotationDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    paddock_id: '',
    lot_name: '',
    animals_count: '',
    entry_date: new Date().toISOString().split('T')[0],
    entry_forage_kg: '',
    notes: '',
  });

  const availablePaddocks = paddocks.filter(p => 
    p.current_status === 'disponible' || p.current_status === 'en_descanso'
  );

  const selectedPaddock = paddocks.find(p => p.id === form.paddock_id);

  const resetForm = () => {
    setForm({
      paddock_id: '',
      lot_name: '',
      animals_count: '',
      entry_date: new Date().toISOString().split('T')[0],
      entry_forage_kg: '',
      notes: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.paddock_id || !form.lot_name || !form.animals_count) return;

    setLoading(true);
    const result = await onSubmit({
      paddock_id: form.paddock_id,
      lot_name: form.lot_name,
      animals_count: parseInt(form.animals_count),
      entry_date: form.entry_date,
      entry_forage_kg: form.entry_forage_kg ? parseFloat(form.entry_forage_kg) : undefined,
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
          <DialogTitle>Iniciar Rotación</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Potrero *</Label>
            <Select value={form.paddock_id} onValueChange={(v) => setForm({ ...form, paddock_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar potrero" />
              </SelectTrigger>
              <SelectContent>
                {availablePaddocks.map((paddock) => (
                  <SelectItem key={paddock.id} value={paddock.id}>
                    {paddock.name} ({paddock.area_hectares || '?'} ha) - {paddock.current_status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPaddock && (
              <p className="text-xs text-muted-foreground">
                Capacidad máx: {selectedPaddock.max_capacity || 'No definida'} animales
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lote de Animales *</Label>
              <Input
                placeholder="Ej: Lote Vacas Lactando"
                value={form.lot_name}
                onChange={(e) => setForm({ ...form, lot_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Cantidad Animales *</Label>
              <Input
                type="number"
                placeholder="20"
                value={form.animals_count}
                onChange={(e) => setForm({ ...form, animals_count: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha de Entrada *</Label>
              <Input
                type="date"
                value={form.entry_date}
                onChange={(e) => setForm({ ...form, entry_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Forraje Disponible (kg)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="Aforo inicial"
                value={form.entry_forage_kg}
                onChange={(e) => setForm({ ...form, entry_forage_kg: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              placeholder="Observaciones..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !form.paddock_id || !form.lot_name || !form.animals_count}>
              {loading ? 'Iniciando...' : 'Iniciar Rotación'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
