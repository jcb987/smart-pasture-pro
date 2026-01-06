import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useSupplies, SUPPLY_CATEGORIES, UNITS } from '@/hooks/useSupplies';

interface AddSupplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddSupplyDialog = ({ open, onOpenChange }: AddSupplyDialogProps) => {
  const { addSupply } = useSupplies();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: 'unidad',
    current_stock: '',
    min_stock: '',
    unit_cost: '',
    supplier: '',
    location: '',
    withdrawal_days: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await addSupply.mutateAsync({
      name: formData.name,
      category: formData.category,
      unit: formData.unit,
      current_stock: parseFloat(formData.current_stock) || 0,
      min_stock: parseFloat(formData.min_stock) || 0,
      unit_cost: formData.unit_cost ? parseFloat(formData.unit_cost) : null,
      supplier: formData.supplier || null,
      location: formData.location || null,
      withdrawal_days: parseInt(formData.withdrawal_days) || 0,
      notes: formData.notes || null,
      is_active: true,
    });

    setFormData({
      name: '',
      category: '',
      unit: 'unidad',
      current_stock: '',
      min_stock: '',
      unit_cost: '',
      supplier: '',
      location: '',
      withdrawal_days: '',
      notes: '',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Insumo</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Insumo *</Label>
            <Input
              id="name"
              placeholder="Ej: Ivermectina 1%"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoría *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPLY_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unidad de Medida *</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="current_stock">Stock Actual</Label>
              <Input
                id="current_stock"
                type="number"
                step="0.01"
                placeholder="0"
                value={formData.current_stock}
                onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_stock">Stock Mínimo</Label>
              <Input
                id="min_stock"
                type="number"
                step="0.01"
                placeholder="0"
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit_cost">Costo Unitario</Label>
              <Input
                id="unit_cost"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.unit_cost}
                onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Proveedor</Label>
              <Input
                id="supplier"
                placeholder="Nombre del proveedor"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                placeholder="Bodega, estante..."
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="withdrawal_days">Días de Retiro (antes de ordeño/faena)</Label>
            <Input
              id="withdrawal_days"
              type="number"
              placeholder="0"
              value={formData.withdrawal_days}
              onChange={(e) => setFormData({ ...formData, withdrawal_days: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Tiempo de espera después de aplicar antes de usar leche o carne
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Observaciones adicionales..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={addSupply.isPending || !formData.name || !formData.category}>
              {addSupply.isPending ? 'Guardando...' : 'Agregar Insumo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
