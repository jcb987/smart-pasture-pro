import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useCostos } from '@/hooks/useCostos';
import { Milk, Beef, TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';

export const CostAnalysis = () => {
  const { costPerUnit, lotProfitability, summary } = useCostos();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Cost per Unit Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Costo por Litro de Leche</CardTitle>
            <Milk className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(costPerUnit.costoPorLitroLeche)}
            </div>
            <p className="text-xs text-muted-foreground">
              Basado en {costPerUnit.litrosTotales.toFixed(0)} litros producidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Costo por Kg de Carne</CardTitle>
            <Beef className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(costPerUnit.costoPorKiloCarne)}
            </div>
            <p className="text-xs text-muted-foreground">
              Basado en {costPerUnit.kilosTotales.toFixed(0)} kg de ganancia
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Costos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(costPerUnit.costosTotales)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de egresos registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Margen Neto</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.margenNeto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.margenNeto.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              (Ingresos - Egresos) / Ingresos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Profitability by Lot */}
      <Card>
        <CardHeader>
          <CardTitle>Rentabilidad por Lote</CardTitle>
          <CardDescription>
            Análisis de ingresos, costos y rentabilidad para cada lote de animales
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lotProfitability.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay lotes con transacciones asociadas
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lote</TableHead>
                  <TableHead className="text-center">Animales</TableHead>
                  <TableHead className="text-right">Ingresos</TableHead>
                  <TableHead className="text-right">Egresos</TableHead>
                  <TableHead className="text-right">Margen</TableHead>
                  <TableHead className="text-right">Rentabilidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lotProfitability.map((lot) => (
                  <TableRow key={lot.lotName}>
                    <TableCell className="font-medium">{lot.lotName}</TableCell>
                    <TableCell className="text-center">{lot.animales}</TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatCurrency(lot.ingresos)}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatCurrency(lot.egresos)}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${lot.margen >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(lot.margen)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={lot.rentabilidad >= 0 ? 'default' : 'destructive'}>
                        {lot.rentabilidad >= 0 ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {lot.rentabilidad.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Desglose de Ingresos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary.ingresosPorCategoria.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No hay ingresos registrados
              </div>
            ) : (
              <div className="space-y-3">
                {summary.ingresosPorCategoria
                  .sort((a, b) => b.amount - a.amount)
                  .map((item, index) => {
                    const percentage = (item.amount / summary.totalIngresos) * 100;
                    return (
                      <div key={item.category} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{item.category.replace(/_/g, ' ')}</span>
                          <span className="font-medium">{formatCurrency(item.amount)}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Desglose de Egresos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary.costosPorCategoria.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No hay egresos registrados
              </div>
            ) : (
              <div className="space-y-3">
                {summary.costosPorCategoria
                  .sort((a, b) => b.amount - a.amount)
                  .map((item, index) => {
                    const percentage = (item.amount / summary.totalEgresos) * 100;
                    return (
                      <div key={item.category} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{item.category.replace(/_/g, ' ')}</span>
                          <span className="font-medium">{formatCurrency(item.amount)}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-red-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
