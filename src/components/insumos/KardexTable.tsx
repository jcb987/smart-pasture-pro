import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useSupplies, SUPPLY_CATEGORIES, MOVEMENT_REASONS, Supply } from '@/hooks/useSupplies';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowDownCircle, ArrowUpCircle, RefreshCw } from 'lucide-react';

interface KardexTableProps {
  supply?: Supply;
}

export const KardexTable = ({ supply }: KardexTableProps) => {
  const { movements, getKardex, loading } = useSupplies();

  const displayMovements = supply ? getKardex(supply.id) : movements.slice(0, 100);

  const getReasonLabel = (type: string, reason: string | null) => {
    if (!reason) return '-';
    const reasons = MOVEMENT_REASONS[type as keyof typeof MOVEMENT_REASONS] || [];
    const found = reasons.find(r => r.value === reason);
    return found?.label || reason;
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate running balance for the supply
  let runningBalance = 0;
  const movementsWithBalance = [...displayMovements].reverse().map(m => {
    if (m.movement_type === 'entrada') {
      runningBalance += m.quantity;
    } else if (m.movement_type === 'salida') {
      runningBalance -= m.quantity;
    } else {
      runningBalance = m.quantity;
    }
    return { ...m, balance: runningBalance };
  }).reverse();

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando kardex...</div>;
  }

  return (
    <div className="space-y-4">
      {supply && (
        <div className="p-4 bg-muted rounded-lg">
          <h3 className="font-semibold text-lg">{supply.name}</h3>
          <p className="text-sm text-muted-foreground">
            Stock actual: <span className="font-medium text-foreground">{supply.current_stock} {supply.unit}</span>
          </p>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Tipo</TableHead>
              {!supply && <TableHead>Insumo</TableHead>}
              <TableHead>Motivo</TableHead>
              <TableHead className="text-center">Cantidad</TableHead>
              <TableHead className="text-right">Costo Unit.</TableHead>
              <TableHead className="text-right">Total</TableHead>
              {supply && <TableHead className="text-right">Saldo</TableHead>}
              <TableHead>Referencia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movementsWithBalance.length === 0 ? (
              <TableRow>
                <TableCell colSpan={supply ? 8 : 8} className="text-center py-8 text-muted-foreground">
                  No hay movimientos registrados
                </TableCell>
              </TableRow>
            ) : (
              movementsWithBalance.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>
                    {format(new Date(movement.movement_date), 'dd MMM yyyy', { locale: es })}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        movement.movement_type === 'entrada' 
                          ? 'default' 
                          : movement.movement_type === 'salida' 
                          ? 'destructive' 
                          : 'secondary'
                      }
                      className={movement.movement_type === 'entrada' ? 'bg-green-600' : ''}
                    >
                      {movement.movement_type === 'entrada' && <ArrowDownCircle className="h-3 w-3 mr-1" />}
                      {movement.movement_type === 'salida' && <ArrowUpCircle className="h-3 w-3 mr-1" />}
                      {movement.movement_type === 'ajuste' && <RefreshCw className="h-3 w-3 mr-1" />}
                      {movement.movement_type.charAt(0).toUpperCase() + movement.movement_type.slice(1)}
                    </Badge>
                  </TableCell>
                  {!supply && (
                    <TableCell className="font-medium">
                      {movement.supply?.name || '-'}
                    </TableCell>
                  )}
                  <TableCell>{getReasonLabel(movement.movement_type, movement.reason)}</TableCell>
                  <TableCell className={`text-center font-medium ${
                    movement.movement_type === 'entrada' 
                      ? 'text-green-600' 
                      : movement.movement_type === 'salida' 
                      ? 'text-red-600' 
                      : ''
                  }`}>
                    {movement.movement_type === 'entrada' && '+'}
                    {movement.movement_type === 'salida' && '-'}
                    {movement.quantity}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(movement.unit_cost)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(movement.total_cost)}
                  </TableCell>
                  {supply && (
                    <TableCell className="text-right font-medium">
                      {movement.balance}
                    </TableCell>
                  )}
                  <TableCell className="text-muted-foreground">
                    {movement.reference_number || movement.animals?.tag_id || '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
