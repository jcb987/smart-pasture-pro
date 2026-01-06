import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupplies, MOVEMENT_REASONS, Supply } from '@/hooks/useSupplies';
import { useAnimals } from '@/hooks/useAnimals';
import { ArrowDownCircle, ArrowUpCircle, RefreshCw } from 'lucide-react';

interface AddMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedSupply?: Supply;
}

export const AddMovementDialog = ({ open, onOpenChange, preselectedSupply }: AddMovementDialogProps) => {
  const { supplies, lots, addMovement } = useSupplies();
  const { animals } = useAnimals();
  const [movementType, setMovementType] = useState<'entrada' | 'salida' | 'ajuste'>('entrada');
  const [formData, setFormData] = useState({
    supply_id: preselectedSupply?.id || '',
    lot_id: '',
    quantity: '',
    unit_cost: '',
    reason: '',
    reference_number: '',
    animal_id: '',
    lot_name: '',
    movement_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const selectedSupply = supplies.find(s => s.id === formData.supply_id);
  const availableLots = lots.filter(l => l.supply_id === formData.supply_id && l.quantity > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await addMovement.mutateAsync({
      supply_id: formData.supply_id,
      lot_id: formData.lot_id || null,
      movement_type: movementType,
      quantity: parseFloat(formData.quantity),
      unit_cost: formData.unit_cost ? parseFloat(formData.unit_cost) : null,
      reason: formData.reason || null,
      reference_number: formData.reference_number || null,
      animal_id: formData.animal_id || null,
      lot_name: formData.lot_name || null,
      movement_date: formData.movement_date,
      notes: formData.notes || null,
      total_cost: null,
      created_by: null,
    });

    setFormData({
      supply_id: '',
      lot_id: '',
      quantity: '',
      unit_cost: '',
      reason: '',
      reference_number: '',
      animal_id: '',
      lot_name: '',
      movement_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    onOpenChange(false);
  };

  const reasons = MOVEMENT_REASONS[movementType];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Movimiento de Inventario</DialogTitle>
        </DialogHeader>

        <Tabs value={movementType} onValueChange={(v) => setMovementType(v as typeof movementType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="entrada" className="flex items-center gap-2">
              <ArrowDownCircle className="h-4 w-4" />
              Entrada
            </TabsTrigger>
            <TabsTrigger value="salida" className="flex items-center gap-2">
              <ArrowUpCircle className="h-4 w-4" />
              Salida
            </TabsTrigger>
            <TabsTrigger value="ajuste" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Ajuste
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supply">Insumo *</Label>
                <Select
                  value={formData.supply_id}
                  onValueChange={(value) => setFormData({ ...formData, supply_id: value, lot_id: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar insumo" />
                  </SelectTrigger>
                  <SelectContent>
                    {supplies.filter(s => s.is_active).map((supply) => (
                      <SelectItem key={supply.id} value={supply.id}>
                        {supply.name} ({supply.current_stock} {supply.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Fecha *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.movement_date}
                  onChange={(e) => setFormData({ ...formData, movement_date: e.target.value })}
                  required
                />
              </div>
            </div>

            {movementType === 'salida' && availableLots.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="lot">Lote (FIFO recomendado)</Label>
                <Select
                  value={formData.lot_id}
                  onValueChange={(value) => setFormData({ ...formData, lot_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar lote" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLots.map((lot) => (
                      <SelectItem key={lot.id} value={lot.id}>
                        {lot.lot_number} - {lot.quantity} unid. 
                        {lot.expiration_date && ` (Vence: ${lot.expiration_date})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">
                  {movementType === 'ajuste' ? 'Nuevo Stock *' : 'Cantidad *'}
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                />
                {selectedSupply && movementType !== 'ajuste' && (
                  <p className="text-xs text-muted-foreground">
                    Stock actual: {selectedSupply.current_stock} {selectedSupply.unit}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Motivo</Label>
                <Select
                  value={formData.reason}
                  onValueChange={(value) => setFormData({ ...formData, reason: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {reasons.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {movementType === 'entrada' && (
              <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label htmlFor="reference">Nº Factura/Referencia</Label>
                  <Input
                    id="reference"
                    placeholder="Ej: FAC-001"
                    value={formData.reference_number}
                    onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                  />
                </div>
              </div>
            )}

            {movementType === 'salida' && formData.reason === 'uso_animal' && (
              <div className="space-y-2">
                <Label htmlFor="animal">Animal</Label>
                <Select
                  value={formData.animal_id}
                  onValueChange={(value) => setFormData({ ...formData, animal_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar animal" />
                  </SelectTrigger>
                  <SelectContent>
                    {animals.filter(a => a.status === 'activo').map((animal) => (
                      <SelectItem key={animal.id} value={animal.id}>
                        {animal.tag_id} - {animal.name || animal.category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSupply && selectedSupply.withdrawal_days > 0 && (
                  <p className="text-xs text-amber-600">
                    ⚠️ Este producto tiene {selectedSupply.withdrawal_days} días de retiro
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                placeholder="Observaciones..."
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
                disabled={addMovement.isPending || !formData.supply_id || !formData.quantity}
                className={
                  movementType === 'entrada' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : movementType === 'salida' 
                    ? 'bg-red-600 hover:bg-red-700'
                    : ''
                }
              >
                {addMovement.isPending ? 'Guardando...' : `Registrar ${movementType.charAt(0).toUpperCase() + movementType.slice(1)}`}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
