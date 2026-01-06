import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SimulationScenario } from '@/hooks/useSimulations';
import { Trash2, GitCompare, Check, X } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ScenarioComparisonProps {
  scenarios: SimulationScenario[];
  onDelete: (id: string) => void;
  onCompare: (ids: string[]) => void;
}

const formatCurrency = (value: number) => {
  if (Math.abs(value) >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toLocaleString()}`;
};

export const ScenarioComparison = ({ scenarios, onDelete, onCompare }: ScenarioComparisonProps) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : prev.length < 2 ? [...prev, id] : [prev[1], id]
    );
  };

  const handleCompare = () => {
    if (selectedIds.length === 2) {
      onCompare(selectedIds);
    }
  };

  if (scenarios.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            Escenarios Guardados
          </CardTitle>
          <CardDescription>
            Guarda escenarios para compararlos entre sí
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <GitCompare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay escenarios guardados aún.</p>
            <p className="text-sm">Crea una simulación y guárdala para comparar.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              Escenarios Guardados ({scenarios.length})
            </CardTitle>
            <CardDescription>
              Selecciona 2 escenarios para comparar
            </CardDescription>
          </div>
          {selectedIds.length === 2 && (
            <Button onClick={handleCompare} size="sm">
              <GitCompare className="h-4 w-4 mr-2" />
              Comparar Seleccionados
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Escenario</TableHead>
                <TableHead className="text-right">Ingresos</TableHead>
                <TableHead className="text-right">Costos</TableHead>
                <TableHead className="text-right">Utilidad</TableHead>
                <TableHead className="text-right">ROI</TableHead>
                <TableHead className="text-right">Meses</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scenarios.map((scenario) => {
                const isSelected = selectedIds.includes(scenario.id);
                return (
                  <TableRow 
                    key={scenario.id}
                    className={`cursor-pointer ${isSelected ? 'bg-primary/10' : ''}`}
                    onClick={() => toggleSelection(scenario.id)}
                  >
                    <TableCell>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
                      }`}>
                        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{scenario.name}</p>
                        <p className="text-xs text-muted-foreground">{scenario.description}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-primary">
                      {formatCurrency(scenario.results.totalRevenue)}
                    </TableCell>
                    <TableCell className="text-right text-orange-600">
                      {formatCurrency(scenario.results.totalCosts)}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${
                      scenario.results.netProfit > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(scenario.results.netProfit)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={scenario.results.roi > 0 ? 'default' : 'destructive'}>
                        {scenario.results.roi}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {scenario.variables.projectionMonths}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(scenario.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {selectedIds.length === 1 && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Selecciona un segundo escenario para comparar
          </p>
        )}
      </CardContent>
    </Card>
  );
};
