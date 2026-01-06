import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useGenetics, InbreedingResult } from '@/hooks/useGenetics';
import { useAnimals } from '@/hooks/useAnimals';
import { AlertTriangle, CheckCircle, Calculator, Users } from 'lucide-react';

export const InbreedingCalculator = () => {
  const { animals } = useAnimals();
  const { calculateInbreeding } = useGenetics();
  const [femaleId, setFemaleId] = useState('');
  const [maleId, setMaleId] = useState('');
  const [result, setResult] = useState<InbreedingResult | null>(null);

  const females = animals.filter(a => a.sex === 'hembra' && a.status === 'activo');
  const males = animals.filter(a => a.sex === 'macho' && a.status === 'activo');

  const handleCalculate = () => {
    if (!femaleId || !maleId) return;
    const inbreedingResult = calculateInbreeding(femaleId, maleId);
    setResult(inbreedingResult);
  };

  const getRiskInfo = (risk: InbreedingResult['risk']) => {
    switch (risk) {
      case 'bajo':
        return {
          color: 'bg-green-500',
          icon: CheckCircle,
          message: 'El nivel de consanguinidad es aceptable. Este apareamiento tiene bajo riesgo genético.',
        };
      case 'moderado':
        return {
          color: 'bg-yellow-500',
          icon: AlertTriangle,
          message: 'Nivel moderado de consanguinidad. Considere alternativas si hay disponibles.',
        };
      case 'alto':
        return {
          color: 'bg-orange-500',
          icon: AlertTriangle,
          message: 'Alto nivel de consanguinidad. Se recomienda buscar otro reproductor.',
        };
      case 'muy_alto':
        return {
          color: 'bg-destructive',
          icon: AlertTriangle,
          message: 'Nivel crítico de consanguinidad. Este apareamiento NO es recomendable.',
        };
    }
  };

  const getAnimalName = (id: string) => {
    const animal = animals.find(a => a.id === id);
    return animal ? `${animal.tag_id}${animal.name ? ` (${animal.name})` : ''}` : '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Calculadora de Consanguinidad
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Hembra</Label>
            <Select value={femaleId} onValueChange={setFemaleId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar hembra" />
              </SelectTrigger>
              <SelectContent>
                {females.map((female) => (
                  <SelectItem key={female.id} value={female.id}>
                    {female.tag_id} - {female.name || female.category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Macho</Label>
            <Select value={maleId} onValueChange={setMaleId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar macho" />
              </SelectTrigger>
              <SelectContent>
                {males.map((male) => (
                  <SelectItem key={male.id} value={male.id}>
                    {male.tag_id} - {male.name || male.category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleCalculate} disabled={!femaleId || !maleId} className="w-full">
          <Calculator className="mr-2 h-4 w-4" />
          Calcular Consanguinidad
        </Button>

        {result && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Coeficiente de Consanguinidad</p>
                <p className="text-4xl font-bold">{result.coefficient.toFixed(2)}%</p>
              </div>
              <Badge className={`${getRiskInfo(result.risk).color} text-white text-lg px-4 py-2`}>
                Riesgo {result.risk.replace('_', ' ')}
              </Badge>
            </div>

            <Alert variant={result.risk === 'bajo' ? 'default' : 'destructive'}>
              {result.risk === 'bajo' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertTitle>Evaluación del Apareamiento</AlertTitle>
              <AlertDescription>
                {getRiskInfo(result.risk).message}
              </AlertDescription>
            </Alert>

            {result.commonAncestors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Users className="h-4 w-4" />
                  Ancestros Comunes Encontrados
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.commonAncestors.map((ancestor, index) => (
                    <Badge key={index} variant="outline">
                      {ancestor}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Referencia de coeficientes:</strong>
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• <span className="text-green-500">0-6.25%</span>: Riesgo bajo (apareamiento seguro)</li>
                <li>• <span className="text-yellow-500">6.25-12.5%</span>: Riesgo moderado (considerar alternativas)</li>
                <li>• <span className="text-orange-500">12.5-25%</span>: Riesgo alto (no recomendado)</li>
                <li>• <span className="text-destructive">{'>'} 25%</span>: Riesgo crítico (evitar)</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
