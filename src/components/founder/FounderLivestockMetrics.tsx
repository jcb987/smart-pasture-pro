import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface LivestockData {
  totalAnimals: number;
  bySpecies: {
    bovinos: number;
    bufalos: number;
  };
  byProduction: {
    leche: number;
    carne: number;
    doblePropósito: number;
  };
}

interface FounderLivestockMetricsProps {
  data: LivestockData;
  loading?: boolean;
}

export function FounderLivestockMetrics({ data, loading }: FounderLivestockMetricsProps) {
  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-48" />
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const speciesTotal = data.bySpecies.bovinos + data.bySpecies.bufalos;
  const productionTotal = data.byProduction.leche + data.byProduction.carne + data.byProduction.doblePropósito;

  const getPercentage = (value: number, total: number) => 
    total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          🐄 Ganadería Agregada
          <Badge variant="secondary" className="ml-auto">
            {data.totalAnimals.toLocaleString()} cabezas
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Por Especie */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Por Especie</h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Bovinos</span>
              <span className="font-medium">
                {data.bySpecies.bovinos.toLocaleString()} ({getPercentage(data.bySpecies.bovinos, speciesTotal)}%)
              </span>
            </div>
            <Progress 
              value={getPercentage(data.bySpecies.bovinos, speciesTotal)} 
              className="h-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Búfalos</span>
              <span className="font-medium">
                {data.bySpecies.bufalos.toLocaleString()} ({getPercentage(data.bySpecies.bufalos, speciesTotal)}%)
              </span>
            </div>
            <Progress 
              value={getPercentage(data.bySpecies.bufalos, speciesTotal)} 
              className="h-2 [&>div]:bg-amber-500"
            />
          </div>
        </div>

        {/* Por Tipo de Producción */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Por Tipo de Producción</h4>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-blue-500/10 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">
                {data.byProduction.leche.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Lechería</div>
            </div>
            <div className="p-3 bg-red-500/10 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">
                {data.byProduction.carne.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Carne</div>
            </div>
            <div className="p-3 bg-violet-500/10 rounded-lg text-center">
              <div className="text-2xl font-bold text-violet-600">
                {data.byProduction.doblePropósito.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Doble Prop.</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
