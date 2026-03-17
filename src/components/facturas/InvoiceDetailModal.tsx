import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Clock, AlertCircle, Check } from 'lucide-react';
import { Invoice } from '@/hooks/useInvoices';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkAsPaid: (id: string) => void;
}

const statusConfig = {
  pending: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700', icon: Clock },
  paid: { label: 'Pagada', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { label: 'Cancelada', color: 'bg-slate-100 text-slate-700', icon: AlertCircle },
  overdue: { label: 'Vencida', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

const typeLabels: Record<string, string> = {
  purchase: 'Compra',
  sale: 'Venta',
  expense: 'Gasto',
  other: 'Otro',
};

const formatCurrency = (amount: number, currency = 'COP') =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount);

const formatDate = (dateStr: string | null) =>
  dateStr ? format(new Date(dateStr), 'dd MMM yyyy', { locale: es }) : '—';

export const InvoiceDetailModal = ({ invoice, open, onOpenChange, onMarkAsPaid }: InvoiceDetailModalProps) => {
  if (!invoice) return null;

  const isOverdue =
    invoice.status === 'pending' && invoice.due_date && new Date(invoice.due_date) < new Date();
  const effectiveStatus = isOverdue ? 'overdue' : invoice.status;
  const { label, color, icon: StatusIcon } = statusConfig[effectiveStatus];

  const handleMarkAsPaid = () => {
    onMarkAsPaid(invoice.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <DialogTitle className="text-lg">
              {invoice.invoice_number ? `Factura ${invoice.invoice_number}` : 'Detalle de Factura'}
            </DialogTitle>
            <Badge className={color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {label}
            </Badge>
          </div>
        </DialogHeader>

        {/* Información principal */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div>
            <p className="text-muted-foreground">Proveedor / Tercero</p>
            <p className="font-medium">{invoice.supplier_name || '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Tipo</p>
            <p className="font-medium">{typeLabels[invoice.invoice_type] ?? invoice.invoice_type}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Fecha de emisión</p>
            <p className="font-medium">{formatDate(invoice.issue_date)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Fecha de vencimiento</p>
            <p className="font-medium">{formatDate(invoice.due_date)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Moneda</p>
            <p className="font-medium">{invoice.currency}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Creada</p>
            <p className="font-medium">{formatDate(invoice.created_at)}</p>
          </div>
        </div>

        <Separator />

        {/* Ítems */}
        {invoice.items && invoice.items.length > 0 ? (
          <div>
            <p className="text-sm font-semibold mb-2">Ítems</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right w-20">Cant.</TableHead>
                  <TableHead className="text-right w-32">Precio unit.</TableHead>
                  <TableHead className="text-right w-32">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unit_price, invoice.currency)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.total, invoice.currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">Sin ítems detallados.</p>
        )}

        <Separator />

        {/* Resumen financiero */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">IVA</span>
            <span>{formatCurrency(invoice.tax_amount, invoice.currency)}</span>
          </div>
          <div className="flex justify-between font-semibold text-base pt-1 border-t">
            <span>Total</span>
            <span>{formatCurrency(invoice.total_amount, invoice.currency)}</span>
          </div>
        </div>

        {/* Notas */}
        {invoice.notes && (
          <>
            <Separator />
            <div className="text-sm">
              <p className="text-muted-foreground mb-1">Notas</p>
              <p className="whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          </>
        )}

        <DialogFooter className="gap-2">
          {invoice.status === 'pending' && (
            <Button variant="outline" onClick={handleMarkAsPaid}>
              <Check className="h-4 w-4 mr-2" />
              Marcar como pagada
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
