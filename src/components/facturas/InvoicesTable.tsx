import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, 
  Search, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  MoreVertical,
  Trash2,
  Eye,
  Check
} from 'lucide-react';
import { Invoice } from '@/hooks/useInvoices';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface InvoicesTableProps {
  invoices: Invoice[];
  loading: boolean;
  onMarkAsPaid: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (invoice: Invoice) => void;
}

const statusConfig = {
  pending: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700', icon: Clock },
  paid: { label: 'Pagada', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { label: 'Cancelada', color: 'bg-slate-100 text-slate-700', icon: AlertCircle },
  overdue: { label: 'Vencida', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

const typeLabels = {
  purchase: 'Compra',
  sale: 'Venta',
  expense: 'Gasto',
  other: 'Otro',
};

const formatCurrency = (amount: number, currency = 'COP') => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
};

export const InvoicesTable = ({
  invoices,
  loading,
  onMarkAsPaid,
  onDelete,
  onView,
}: InvoicesTableProps) => {
  const [search, setSearch] = useState('');

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
    invoice.supplier_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Facturas y Notas Fiscales
          </CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar facturas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay facturas registradas</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map(invoice => {
                const status = invoice.status === 'pending' && invoice.due_date && new Date(invoice.due_date) < new Date()
                  ? 'overdue'
                  : invoice.status;
                const StatusIcon = statusConfig[status].icon;

                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoice_number || '-'}
                    </TableCell>
                    <TableCell>{invoice.supplier_name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {typeLabels[invoice.invoice_type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {invoice.issue_date 
                        ? format(new Date(invoice.issue_date), 'dd MMM yyyy', { locale: es })
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {invoice.due_date 
                        ? format(new Date(invoice.due_date), 'dd MMM yyyy', { locale: es })
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(invoice.total_amount, invoice.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig[status].color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig[status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onView(invoice)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalles
                          </DropdownMenuItem>
                          {invoice.status === 'pending' && (
                            <DropdownMenuItem onClick={() => onMarkAsPaid(invoice.id)}>
                              <Check className="h-4 w-4 mr-2" />
                              Marcar como pagada
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => onDelete(invoice.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
