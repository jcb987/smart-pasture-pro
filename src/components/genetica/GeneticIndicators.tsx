import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { GeneticEvaluation } from '@/hooks/useGenetics';
import { useAnimals } from '@/hooks/useAnimals';
import { Award, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface GeneticIndicatorsProps {
  evaluations: GeneticEvaluation[];
  stats: {
    avgGeneticValue: number;
    avgMilkIndex: number;
    avgMeatIndex: number;
    topReproducers: Array<GeneticEvaluation & { animal?: any }>;
  };
}

const getValueIndicator = (value: number | undefined, avg: number) => {
  if (!value) return <Minus className="h-4 w-4 text-muted-foreground" />;
  if (value > avg + 5) return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (value < avg - 5) return <TrendingDown className="h-4 w-4 text-destructive" />;
  return <Minus className="h-4 w-4 text-yellow-500" />;
};

export const GeneticIndicators = ({ evaluations, stats }: GeneticIndicatorsProps) => {
  const { animals } = useAnimals();

  const getAnimalInfo = (animalId: string) => {
    return animals.find(a => a.id === animalId);
  };

  // Agrupar por categoría
  const groupedStats = animals.reduce((acc, animal) => {
    if (animal.status !== 'activo') return acc;
    
    const eval_ = evaluations.find(e => e.animal_id === animal.id);
    if (!eval_) return acc;

    if (!acc[animal.category]) {
      acc[animal.category] = {
        count: 0,
        totalGeneticValue: 0,
        totalMilk: 0,
        totalMeat: 0,
      };
    }

    acc[animal.category].count++;
    acc[animal.category].totalGeneticValue += eval_.overall_genetic_value || 0;
    acc[animal.category].totalMilk += eval_.milk_production_index || 0;
    acc[animal.category].totalMeat += eval_.meat_production_index || 0;

    return acc;
  }, {} as Record<string, { count: number; totalGeneticValue: number; totalMilk: number; totalMeat: number }>);

  const categoryLabels: Record<string, string> = {
    vaca: 'Vacas',
    toro: 'Toros',
    novilla: 'Novillas',
    novillo: 'Novillos',
    ternera: 'Terneras',
    ternero: 'Terneros',
    becerra: 'Becerras',
    becerro: 'Becerros',
  };

  return (
    <div className="space-y-6">
      {/* Resumen general */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Genético Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Award className="h-8 w-8 text-primary" />
              <span className="text-3xl font-bold">{stats.avgGeneticValue}</span>
            </div>
            <Progress value={stats.avgGeneticValue} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Índice Leche Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">{stats.avgMilkIndex}</span>
            </div>
            <Progress value={stats.avgMilkIndex} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Índice Carne Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">{stats.avgMeatIndex}</span>
            </div>
            <Progress value={stats.avgMeatIndex} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Por categoría */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Indicadores por Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(groupedStats).length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No hay evaluaciones genéticas registradas
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-center">Animales</TableHead>
                  <TableHead className="text-center">Valor Genético Prom.</TableHead>
                  <TableHead className="text-center">Índice Leche Prom.</TableHead>
                  <TableHead className="text-center">Índice Carne Prom.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(groupedStats).map(([category, data]) => (
                  <TableRow key={category}>
                    <TableCell className="font-medium">
                      {categoryLabels[category] || category}
                    </TableCell>
                    <TableCell className="text-center">{data.count}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {(data.totalGeneticValue / data.count).toFixed(1)}
                        {getValueIndicator(data.totalGeneticValue / data.count, stats.avgGeneticValue)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {(data.totalMilk / data.count).toFixed(1)}
                        {getValueIndicator(data.totalMilk / data.count, stats.avgMilkIndex)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {(data.totalMeat / data.count).toFixed(1)}
                        {getValueIndicator(data.totalMeat / data.count, stats.avgMeatIndex)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Top reproductores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Top 10 Reproductores
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topReproducers.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No hay evaluaciones genéticas registradas
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Animal</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-center">Valor Genético</TableHead>
                  <TableHead className="text-center">Leche</TableHead>
                  <TableHead className="text-center">Carne</TableHead>
                  <TableHead className="text-center">Fertilidad</TableHead>
                  <TableHead className="text-center">Confiabilidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topReproducers.map((eval_, index) => {
                  const animal = getAnimalInfo(eval_.animal_id);
                  return (
                    <TableRow key={eval_.id}>
                      <TableCell>
                        <Badge variant={index < 3 ? 'default' : 'secondary'}>
                          {index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {animal?.tag_id || 'N/A'}
                        {animal?.name && <span className="text-muted-foreground ml-1">({animal.name})</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {categoryLabels[animal?.category || ''] || animal?.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-bold text-primary">
                        {eval_.overall_genetic_value?.toFixed(1) || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {eval_.milk_production_index?.toFixed(1) || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {eval_.meat_production_index?.toFixed(1) || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {eval_.fertility_index?.toFixed(1) || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {eval_.reliability_percentage ? `${eval_.reliability_percentage}%` : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
