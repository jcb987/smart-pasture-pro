import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTerminology } from '@/hooks/useTerminology';

interface AddDietDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (diet: {
    name: string;
    target_group?: string;
    target_lot?: string;
    target_protein?: number;
    target_energy?: number;
    target_fdn?: number;
    target_dry_matter?: number;
    notes?: string;
  }) => Promise<any>;
  targetGroups: { value: string; label: string }[];
}

export const AddDietDialog = ({ open, onOpenChange, onSubmit, targetGroups }: AddDietDialogProps) => {
  const { t } = useTerminology();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    target_group: '',
    target_lot: '',
    target_protein: '',
    target_energy: '',
    target_fdn: '',
    target_dry_matter: '',
    notes: '',
  });

  const resetForm = () => {
    setForm({
      name: '',
      target_group: '',
      target_lot: '',
      target_protein: '',
      target_energy: '',
      target_fdn: '',
      target_dry_matter: '',
      notes: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;

    setLoading(true);
    const result = await onSubmit({
      name: form.name,
      target_group: form.target_group || undefined,
      target_lot: form.target_lot || undefined,
      target_protein: form.target_protein ? parseFloat(form.target_protein) : undefined,
      target_energy: form.target_energy ? parseFloat(form.target_energy) : undefined,
      target_fdn: form.target_fdn ? parseFloat(form.target_fdn) : undefined,
      target_dry_matter: form.target_dry_matter ? parseFloat(form.target_dry_matter) : undefined,
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
          <DialogTitle>Crear Nueva Dieta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre de la Dieta *</Label>
            <Input
              placeholder="Ej: Dieta Lactancia Alta"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Grupo Objetivo</Label>
              <Select value={form.target_group} onValueChange={(v) => setForm({ ...form, target_group: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {targetGroups.map((g) => (
                    <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Lote Específico</Label>
              <Input
                placeholder="Nombre del lote"
                value={form.target_lot}
                onChange={(e) => setForm({ ...form, target_lot: e.target.value })}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">Objetivos Nutricionales</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Proteína Objetivo (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ej: 16"
                  value={form.target_protein}
                  onChange={(e) => setForm({ ...form, target_protein: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('mcal')}</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ej: 35"
                  value={form.target_energy}
                  onChange={(e) => setForm({ ...form, target_energy: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('fdn')}</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ej: 32"
                  value={form.target_fdn}
                  onChange={(e) => setForm({ ...form, target_fdn: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('materia_seca')}</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ej: 22"
                  value={form.target_dry_matter}
                  onChange={(e) => setForm({ ...form, target_dry_matter: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              placeholder="Descripción de la dieta..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !form.name}>
              {loading ? 'Guardando...' : 'Crear Dieta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
