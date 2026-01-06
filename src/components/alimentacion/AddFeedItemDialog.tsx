import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AddFeedItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (item: {
    name: string;
    category: string;
    unit?: string;
    current_stock?: number;
    min_stock?: number;
    unit_cost?: number;
    supplier?: string;
    protein_percentage?: number;
    energy_mcal?: number;
    fdn_percentage?: number;
    dry_matter_percentage?: number;
    notes?: string;
  }) => Promise<any>;
  categories: { value: string; label: string }[];
}

export const AddFeedItemDialog = ({ open, onOpenChange, onSubmit, categories }: AddFeedItemDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: '',
    unit: 'kg',
    current_stock: '',
    min_stock: '',
    unit_cost: '',
    supplier: '',
    protein_percentage: '',
    energy_mcal: '',
    fdn_percentage: '',
    dry_matter_percentage: '',
    notes: '',
  });

  const resetForm = () => {
    setForm({
      name: '',
      category: '',
      unit: 'kg',
      current_stock: '',
      min_stock: '',
      unit_cost: '',
      supplier: '',
      protein_percentage: '',
      energy_mcal: '',
      fdn_percentage: '',
      dry_matter_percentage: '',
      notes: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.category) return;

    setLoading(true);
    const result = await onSubmit({
      name: form.name,
      category: form.category,
      unit: form.unit,
      current_stock: form.current_stock ? parseFloat(form.current_stock) : undefined,
      min_stock: form.min_stock ? parseFloat(form.min_stock) : undefined,
      unit_cost: form.unit_cost ? parseFloat(form.unit_cost) : undefined,
      supplier: form.supplier || undefined,
      protein_percentage: form.protein_percentage ? parseFloat(form.protein_percentage) : undefined,
      energy_mcal: form.energy_mcal ? parseFloat(form.energy_mcal) : undefined,
      fdn_percentage: form.fdn_percentage ? parseFloat(form.fdn_percentage) : undefined,
      dry_matter_percentage: form.dry_matter_percentage ? parseFloat(form.dry_matter_percentage) : undefined,
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Alimento al Inventario</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                placeholder="Ej: Maíz molido"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Categoría *</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Unidad</Label>
              <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="ton">Tonelada</SelectItem>
                  <SelectItem value="bulto">Bulto</SelectItem>
                  <SelectItem value="litro">Litro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Stock Actual</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="0"
                value={form.current_stock}
                onChange={(e) => setForm({ ...form, current_stock: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Stock Mínimo</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="0"
                value={form.min_stock}
                onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Costo por Unidad ($)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.unit_cost}
                onChange={(e) => setForm({ ...form, unit_cost: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Proveedor</Label>
              <Input
                placeholder="Nombre del proveedor"
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">Valores Nutricionales (opcional)</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Proteína (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ej: 14.5"
                  value={form.protein_percentage}
                  onChange={(e) => setForm({ ...form, protein_percentage: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Energía (Mcal/kg)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Ej: 2.5"
                  value={form.energy_mcal}
                  onChange={(e) => setForm({ ...form, energy_mcal: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>FDN (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ej: 35"
                  value={form.fdn_percentage}
                  onChange={(e) => setForm({ ...form, fdn_percentage: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Materia Seca (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ej: 88"
                  value={form.dry_matter_percentage}
                  onChange={(e) => setForm({ ...form, dry_matter_percentage: e.target.value })}
                />
              </div>
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
            <Button type="submit" disabled={loading || !form.name || !form.category}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
