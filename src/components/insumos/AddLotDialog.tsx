import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useSupplies, Supply } from '@/hooks/useSupplies';

interface AddLotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedSupply?: Supply;
}

export const AddLotDialog = ({ open, onOpenChange, preselectedSupply }: AddLotDialogProps) => {
  const { supplies, addLot } = useSupplies();
  const [formData, setFormData] = useState({
    supply_id: preselectedSupply?.id || '',
    lot_number: '',
    quantity: '',
    expiration_date: '',
    manufacture_date: '',
    purchase_date: new Date().toISOString().split('T')[0],
    unit_cost: '',
    supplier: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await addLot.mutateAsync({
      supply_id: formData.supply_id,
      lot_number: formData.lot_number,
      quantity: parseFloat(formData.quantity),
      expiration_date: formData.expiration_date || null,
      manufacture_date: formData.manufacture_date || null,
      purchase_date: formData.purchase_date || null,
      unit_cost: formData.unit_cost ? parseFloat(formData.unit_cost) : null,
      supplier: formData.supplier || null,
      notes: formData.notes || null,
    });

    setFormData({
      supply_id: '',
      lot_number: '',
      quantity: '',
      expiration_date: '',
      manufacture_date: '',
      purchase_date: new Date().toISOString().split('T')[0],
      unit_cost: '',
      supplier: '',
      notes: '',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Agregar Lote de Insumo</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supply">Insumo *</Label>
            <Select
              value={formData.supply_id}
              onValueChange={(value) => setFormData({ ...formData, supply_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar insumo" />
              </SelectTrigger>
              <SelectContent>
                {supplies.filter(s => s.is_active).map((supply) => (
                  <SelectItem key={supply.id} value={supply.id}>
                    {supply.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lot_number">Número de Lote *</Label>
              <Input
                id="lot_number"
                placeholder="Ej: LOT-2024-001"
                value={formData.lot_number}
                onChange={(e) => setFormData({ ...formData, lot_number: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                placeholder="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manufacture_date">Fecha de Fabricación</Label>
              <Input
                id="manufacture_date"
                type="date"
                value={formData.manufacture_date}
                onChange={(e) => setFormData({ ...formData, manufacture_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiration_date">Fecha de Vencimiento</Label>
              <Input
                id="expiration_date"
                type="date"
                value={formData.expiration_date}
                onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchase_date">Fecha de Compra</Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
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
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Observaciones del lote..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={addLot.isPending || !formData.supply_id || !formData.lot_number || !formData.quantity}
            >
              {addLot.isPending ? 'Guardando...' : 'Agregar Lote'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
