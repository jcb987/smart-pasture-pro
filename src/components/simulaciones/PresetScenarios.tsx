import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SimulationVariables } from '@/hooks/useSimulations';
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, Dna, Scissors } from 'lucide-react';

interface PresetScenariosProps {
  presets: { name: string; description: string; variables: SimulationVariables }[];
  onSelect: (variables: SimulationVariables) => void;
}

const getPresetIcon = (name: string) => {
  switch (name) {
    case 'Optimista':
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    case 'Pesimista':
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    case 'Crisis Sanitaria':
      return <AlertTriangle className="h-4 w-4 text-amber-600" />;
    case 'Mejora Genética':
      return <Dna className="h-4 w-4 text-purple-600" />;
    case 'Reducción de Costos':
      return <Scissors className="h-4 w-4 text-blue-600" />;
    default:
      return <Sparkles className="h-4 w-4" />;
  }
};

const getPresetColor = (name: string) => {
  switch (name) {
    case 'Optimista':
      return 'border-green-200 bg-green-50/50 hover:bg-green-100/50 dark:border-green-800 dark:bg-green-950/20';
    case 'Pesimista':
      return 'border-red-200 bg-red-50/50 hover:bg-red-100/50 dark:border-red-800 dark:bg-red-950/20';
    case 'Crisis Sanitaria':
      return 'border-amber-200 bg-amber-50/50 hover:bg-amber-100/50 dark:border-amber-800 dark:bg-amber-950/20';
    case 'Mejora Genética':
      return 'border-purple-200 bg-purple-50/50 hover:bg-purple-100/50 dark:border-purple-800 dark:bg-purple-950/20';
    case 'Reducción de Costos':
      return 'border-blue-200 bg-blue-50/50 hover:bg-blue-100/50 dark:border-blue-800 dark:bg-blue-950/20';
    default:
      return '';
  }
};

export const PresetScenarios = ({ presets, onSelect }: PresetScenariosProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Escenarios Predefinidos
        </CardTitle>
        <CardDescription>
          Selecciona un escenario base para comenzar tu simulación
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => onSelect(preset.variables)}
              className={`p-4 rounded-lg border text-left transition-colors ${getPresetColor(preset.name)}`}
            >
              <div className="flex items-center gap-2 mb-2">
                {getPresetIcon(preset.name)}
                <span className="font-medium text-sm">{preset.name}</span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{preset.description}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {preset.variables.projectionMonths !== 12 && (
                  <Badge variant="outline" className="text-xs">
                    {preset.variables.projectionMonths}m
                  </Badge>
                )}
                {preset.variables.milkProductionChange !== 0 && (
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${preset.variables.milkProductionChange > 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    Leche {preset.variables.milkProductionChange > 0 ? '+' : ''}{preset.variables.milkProductionChange}%
                  </Badge>
                )}
                {preset.variables.mortalityRate > 2 && (
                  <Badge variant="outline" className="text-xs text-red-600">
                    Mort. {preset.variables.mortalityRate}%
                  </Badge>
                )}
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
