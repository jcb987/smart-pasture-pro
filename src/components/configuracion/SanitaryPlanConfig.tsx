import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Syringe, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAnimals } from '@/hooks/useAnimals';
import { useToast } from '@/hooks/use-toast';

interface VaccineEntry {
  name: string;
  dates: string[];
  categories: string[];
  dose_number: number;
  enabled: boolean;
}

const INITIAL_CALENDAR: VaccineEntry[] = [
  {
    name: 'Fiebre Aftosa',
    dates: ['2026-02-15', '2026-08-15'],
    categories: ['vaca', 'toro', 'novilla', 'novillo', 'ternero', 'ternera'],
    dose_number: 1,
    enabled: true,
  },
  {
    name: 'Brucelosis (RB51)',
    dates: ['2026-03-01'],
    categories: ['ternera', 'novilla'],
    dose_number: 1,
    enabled: true,
  },
  {
    name: 'Carbón Sintomático',
    dates: ['2026-04-01'],
    categories: ['ternero', 'ternera', 'becerro', 'becerra'],
    dose_number: 1,
    enabled: true,
  },
  {
    name: 'Desparasitación',
    dates: ['2026-01-15', '2026-04-15', '2026-07-15', '2026-10-15'],
    categories: ['vaca', 'toro', 'novilla', 'novillo', 'ternero', 'ternera'],
    dose_number: 1,
    enabled: true,
  },
  {
    name: 'Leptospirosis',
    dates: ['2026-03-15', '2026-09-15'],
    categories: ['vaca', 'toro', 'novilla'],
    dose_number: 1,
    enabled: true,
  },
  {
    name: 'Rabia Bovina',
    dates: ['2026-05-01'],
    categories: ['vaca', 'toro', 'novilla', 'novillo', 'ternero', 'ternera'],
    dose_number: 1,
    enabled: false,
  },
];

export const SanitaryPlanConfig = () => {
  const [calendar, setCalendar] = useState<VaccineEntry[]>(INITIAL_CALENDAR);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const { user } = useAuth();
  const { animals } = useAnimals();
  const { toast } = useToast();

  const toggle = (index: number) => {
    setCalendar(prev => prev.map((v, i) => i === index ? { ...v, enabled: !v.enabled } : v));
  };

  const updateDate = (index: number, dateIndex: number, value: string) => {
    setCalendar(prev => prev.map((v, i) => {
      if (i !== index) return v;
      const newDates = [...v.dates];
      newDates[dateIndex] = value;
      return { ...v, dates: newDates };
    }));
  };

  const previewCount = () => {
    let count = 0;
    for (const vaccine of calendar.filter(v => v.enabled)) {
      const targetAnimals = animals.filter(a => vaccine.categories.includes(a.category) && a.status === 'activo');
      count += targetAnimals.length * vaccine.dates.length;
    }
    return count;
  };

  const generatePlan = async () => {
    if (!user) return;
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();
    const orgId = profile?.organization_id;
    if (!orgId) return;

    setGenerating(true);
    try {
      const records: Record<string, unknown>[] = [];
      for (const vaccine of calendar.filter(v => v.enabled)) {
        const targetAnimals = animals.filter(a => vaccine.categories.includes(a.category) && a.status === 'activo');
        for (const animal of targetAnimals) {
          for (const date of vaccine.dates) {
            records.push({
              organization_id: orgId,
              animal_id: animal.id,
              vaccine_name: vaccine.name,
              scheduled_date: date,
              dose_number: vaccine.dose_number,
              is_applied: false,
            });
          }
        }
      }

      // Insert in batches of 100
      for (let i = 0; i < records.length; i += 100) {
        const batch = records.slice(i, i + 100);
        const { error } = await supabase.from('vaccination_schedule').insert(batch);
        if (error) throw error;
      }

      setGenerated(true);
      toast({
        title: 'Plan Sanitario Generado',
        description: `Se crearon ${records.length} registros de vacunación programada`,
      });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const preview = previewCount();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Syringe className="h-5 w-5 text-green-600" />
          Plan Sanitario Anual — Calendario Colombiano
        </CardTitle>
        <CardDescription>
          Genera automáticamente el calendario de vacunación basado en el protocolo sanitario colombiano (ICA/SENASA).
          Ajusta las fechas y activa/desactiva vacunas según las necesidades de tu finca.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {calendar.map((vaccine, index) => (
            <div key={vaccine.name} className={`border rounded-lg p-4 space-y-3 transition-opacity ${vaccine.enabled ? '' : 'opacity-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={vaccine.enabled}
                    onCheckedChange={() => toggle(index)}
                    id={`vaccine-${index}`}
                  />
                  <Label htmlFor={`vaccine-${index}`} className="font-medium cursor-pointer">
                    {vaccine.name}
                  </Label>
                </div>
                <div className="flex gap-1 flex-wrap justify-end">
                  {vaccine.categories.slice(0, 3).map(c => (
                    <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                  ))}
                  {vaccine.categories.length > 3 && (
                    <Badge variant="outline" className="text-xs">+{vaccine.categories.length - 3}</Badge>
                  )}
                </div>
              </div>

              {vaccine.enabled && (
                <div className="flex gap-2 flex-wrap">
                  {vaccine.dates.map((date, di) => (
                    <div key={di} className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Fecha {di + 1}:</span>
                      <Input
                        type="date"
                        value={date}
                        onChange={e => updateDate(index, di, e.target.value)}
                        className="h-7 w-36 text-xs"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                Se crearán <span className="text-primary font-bold">{preview}</span> registros de vacunación
              </p>
              <p className="text-sm text-muted-foreground">
                Para {animals.filter(a => a.status === 'activo').length} animales activos
              </p>
            </div>

            {generated ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Plan generado</span>
              </div>
            ) : (
              <Button
                onClick={generatePlan}
                disabled={generating || preview === 0}
                className="gap-2"
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Syringe className="h-4 w-4" />
                )}
                {generating ? 'Generando...' : 'Generar Plan Completo'}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Los registros se añadirán al módulo de Salud {'>'} Vacunas. No se borrarán vacunas existentes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
