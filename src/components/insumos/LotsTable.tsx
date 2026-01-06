import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useSupplies } from '@/hooks/useSupplies';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export const LotsTable = () => {
  const { lots, supplies, loading } = useSupplies();

  const getSupplyName = (supplyId: string) => {
    return supplies.find(s => s.id === supplyId)?.name || 'Desconocido';
  };

  const getSupplyUnit = (supplyId: string) => {
    return supplies.find(s => s.id === supplyId)?.unit || 'unidad';
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const today = new Date();

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando lotes...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Insumo</TableHead>
            <TableHead>Nº Lote</TableHead>
            <TableHead className="text-center">Cantidad</TableHead>
            <TableHead>Fecha Compra</TableHead>
            <TableHead>Vencimiento</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Costo Unit.</TableHead>
            <TableHead>Proveedor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lots.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                No hay lotes registrados
              </TableCell>
            </TableRow>
          ) : (
            lots.map((lot) => {
              const isExpired = lot.expiration_date && new Date(lot.expiration_date) < today;
              const daysUntilExpiry = lot.expiration_date 
                ? differenceInDays(new Date(lot.expiration_date), today)
                : null;
              const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;

              return (
                <TableRow 
                  key={lot.id}
                  className={isExpired ? 'bg-red-50 dark:bg-red-950/20' : isExpiringSoon ? 'bg-amber-50 dark:bg-amber-950/20' : ''}
                >
                  <TableCell className="font-medium">{getSupplyName(lot.supply_id)}</TableCell>
                  <TableCell>{lot.lot_number}</TableCell>
                  <TableCell className="text-center">
                    {lot.quantity} {getSupplyUnit(lot.supply_id)}
                  </TableCell>
                  <TableCell>
                    {lot.purchase_date 
                      ? format(new Date(lot.purchase_date), 'dd MMM yyyy', { locale: es })
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    {lot.expiration_date 
                      ? format(new Date(lot.expiration_date), 'dd MMM yyyy', { locale: es })
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    {isExpired ? (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Vencido
                      </Badge>
                    ) : isExpiringSoon ? (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {daysUntilExpiry}d
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                        <CheckCircle className="h-3 w-3" />
                        Vigente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(lot.unit_cost)}</TableCell>
                  <TableCell className="text-muted-foreground">{lot.supplier || '-'}</TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};
