import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSupplies } from '@/hooks/useSupplies';
import { AlertTriangle, Clock, Package, Calendar } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

export const SupplyAlerts = () => {
  const { getAlerts, supplies } = useSupplies();
  const { lowStockAlerts, expiringLots, expiredLots } = getAlerts();

  const getSupplyName = (supplyId: string) => {
    return supplies.find(s => s.id === supplyId)?.name || 'Desconocido';
  };

  const totalAlerts = lowStockAlerts.length + expiringLots.length + expiredLots.length;

  if (totalAlerts === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No hay alertas activas</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Low Stock Alerts */}
      {lowStockAlerts.length > 0 && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Stock Bajo ({lowStockAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockAlerts.map((supply) => (
                <div 
                  key={supply.id} 
                  className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-950/30"
                >
                  <div>
                    <p className="font-medium">{supply.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Stock: {supply.current_stock} / Mínimo: {supply.min_stock} {supply.unit}
                    </p>
                  </div>
                  <Badge variant="destructive">
                    {supply.current_stock === 0 ? 'Agotado' : 'Bajo'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expired Lots */}
      {expiredLots.length > 0 && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-red-600">
              <Calendar className="h-5 w-5" />
              Lotes Vencidos ({expiredLots.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiredLots.map((lot) => (
                <div 
                  key={lot.id} 
                  className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-950/30"
                >
                  <div>
                    <p className="font-medium">{getSupplyName(lot.supply_id)}</p>
                    <p className="text-sm text-muted-foreground">
                      Lote: {lot.lot_number} | Cantidad: {lot.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive">Vencido</Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {lot.expiration_date && format(new Date(lot.expiration_date), 'dd MMM yyyy', { locale: es })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expiring Soon */}
      {expiringLots.filter(l => !expiredLots.find(e => e.id === l.id)).length > 0 && (
        <Card className="border-amber-200 dark:border-amber-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-amber-600">
              <Clock className="h-5 w-5" />
              Próximos a Vencer ({expiringLots.filter(l => !expiredLots.find(e => e.id === l.id)).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiringLots
                .filter(l => !expiredLots.find(e => e.id === l.id))
                .map((lot) => {
                  const daysUntilExpiry = lot.expiration_date 
                    ? differenceInDays(new Date(lot.expiration_date), new Date())
                    : 0;
                  
                  return (
                    <div 
                      key={lot.id} 
                      className="flex items-center justify-between p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30"
                    >
                      <div>
                        <p className="font-medium">{getSupplyName(lot.supply_id)}</p>
                        <p className="text-sm text-muted-foreground">
                          Lote: {lot.lot_number} | Cantidad: {lot.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                          {daysUntilExpiry} días
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {lot.expiration_date && format(new Date(lot.expiration_date), 'dd MMM yyyy', { locale: es })}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
