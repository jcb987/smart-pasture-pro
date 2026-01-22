import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { CreateInvoiceData, InvoiceItem } from '@/hooks/useInvoices';

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateInvoiceData) => Promise<{ success: boolean }>;
}

export const CreateInvoiceDialog = ({ open, onOpenChange, onSubmit }: CreateInvoiceDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    invoice_number: '',
    invoice_type: 'purchase' as const,
    supplier_name: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    notes: '',
  });
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unit_price: 0, total: 0 },
  ]);

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    
    // Recalculate total
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
    }
    
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * 0.19; // 19% IVA
  const totalAmount = subtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const invoiceData: CreateInvoiceData = {
      ...formData,
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      items: items.filter(item => item.description),
    };

    const result = await onSubmit(invoiceData);
    setLoading(false);

    if (result.success) {
      onOpenChange(false);
      // Reset form
      setFormData({
        invoice_number: '',
        invoice_type: 'purchase',
        supplier_name: '',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: '',
        notes: '',
      });
      setItems([{ description: '', quantity: 1, unit_price: 0, total: 0 }]);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Factura</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_number">Número de Factura</Label>
              <Input
                id="invoice_number"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                placeholder="FAC-001"
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={formData.invoice_type}
                onValueChange={(value: any) => setFormData({ ...formData, invoice_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchase">Compra</SelectItem>
                  <SelectItem value="sale">Venta</SelectItem>
                  <SelectItem value="expense">Gasto</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier_name">Proveedor / Cliente</Label>
            <Input
              id="supplier_name"
              value={formData.supplier_name}
              onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
              placeholder="Nombre del proveedor"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issue_date">Fecha de Emisión</Label>
              <Input
                id="issue_date"
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Fecha de Vencimiento</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Ítems</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" />
                Agregar ítem
              </Button>
            </div>
            
            <div className="space-y-2 border rounded-lg p-4">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    {index === 0 && <Label className="text-xs">Descripción</Label>}
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Descripción del producto"
                    />
                  </div>
                  <div className="col-span-2">
                    {index === 0 && <Label className="text-xs">Cantidad</Label>}
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                      min={1}
                    />
                  </div>
                  <div className="col-span-2">
                    {index === 0 && <Label className="text-xs">Precio Unit.</Label>}
                    <Input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))}
                      min={0}
                    />
                  </div>
                  <div className="col-span-2">
                    {index === 0 && <Label className="text-xs">Total</Label>}
                    <Input
                      value={formatCurrency(item.total)}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>IVA (19%):</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
              <span>Total:</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas adicionales..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Factura
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
