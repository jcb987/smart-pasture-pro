import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useCostos, 
  INCOME_CATEGORIES, 
  EXPENSE_CATEGORIES, 
  PAYMENT_METHODS 
} from '@/hooks/useCostos';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: 'ingreso' | 'egreso';
}

export const AddTransactionDialog = ({ 
  open, 
  onOpenChange,
  defaultType = 'ingreso'
}: AddTransactionDialogProps) => {
  const { createTransaction, animals, lots } = useCostos();
  const [transactionType, setTransactionType] = useState<'ingreso' | 'egreso'>(defaultType);
  const [formData, setFormData] = useState({
    transaction_date: new Date().toISOString().split('T')[0],
    category: '',
    subcategory: '',
    amount: '',
    description: '',
    animal_id: '',
    lot_name: '',
    payment_method: '',
    reference_number: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createTransaction.mutateAsync({
      transaction_date: formData.transaction_date,
      transaction_type: transactionType,
      category: formData.category,
      subcategory: formData.subcategory || undefined,
      amount: parseFloat(formData.amount),
      description: formData.description || undefined,
      animal_id: formData.animal_id || undefined,
      lot_name: formData.lot_name || undefined,
      payment_method: formData.payment_method || undefined,
      reference_number: formData.reference_number || undefined,
      notes: formData.notes || undefined,
    });

    setFormData({
      transaction_date: new Date().toISOString().split('T')[0],
      category: '',
      subcategory: '',
      amount: '',
      description: '',
      animal_id: '',
      lot_name: '',
      payment_method: '',
      reference_number: '',
      notes: '',
    });
    onOpenChange(false);
  };

  const categories = transactionType === 'ingreso' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar Transacción</DialogTitle>
        </DialogHeader>

        <Tabs value={transactionType} onValueChange={(v) => setTransactionType(v as 'ingreso' | 'egreso')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ingreso" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Ingreso
            </TabsTrigger>
            <TabsTrigger value="egreso" className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Egreso
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Fecha *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Monto *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                placeholder="Descripción de la transacción"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lot">Lote/Potrero</Label>
                <Select
                  value={formData.lot_name}
                  onValueChange={(value) => setFormData({ ...formData, lot_name: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar lote" />
                  </SelectTrigger>
                  <SelectContent>
                    {lots.map((lot) => (
                      <SelectItem key={lot} value={lot}>
                        {lot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="animal">Animal (opcional)</Label>
                <Select
                  value={formData.animal_id}
                  onValueChange={(value) => setFormData({ ...formData, animal_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar animal" />
                  </SelectTrigger>
                  <SelectContent>
                    {animals.map((animal) => (
                      <SelectItem key={animal.id} value={animal.id}>
                        {animal.tag_id} - {animal.name || animal.category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment">Método de Pago</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar método" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reference">Referencia</Label>
                <Input
                  id="reference"
                  placeholder="Nº de factura, recibo..."
                  value={formData.reference_number}
                  onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                placeholder="Notas adicionales..."
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
                disabled={createTransaction.isPending}
                className={transactionType === 'ingreso' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {createTransaction.isPending ? 'Guardando...' : `Registrar ${transactionType === 'ingreso' ? 'Ingreso' : 'Egreso'}`}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
