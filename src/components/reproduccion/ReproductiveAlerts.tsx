import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Calendar, Heart, Clock } from 'lucide-react';
import { FemaleAnimal, ReproductiveEvent } from '@/hooks/useReproduction';
import { differenceInDays, parseISO, format } from 'date-fns';

interface Props {
  females: FemaleAnimal[];
  events: ReproductiveEvent[];
  onSelectAnimal: (animalId: string) => void;
}

interface Alert {
  id: string;
  animalId: string;
  tagId: string;
  name?: string;
  type: 'overdue' | 'near_birth' | 'heat_expected' | 'high_open_days';
  message: string;
  priority: 'high' | 'medium' | 'low';
  date?: string;
}

const HEAT_CYCLE_DAYS = 21;
const MAX_OPEN_DAYS = 150;
const GESTATION_ALERT_DAYS = 30;

export const ReproductiveAlerts = ({ females, events, onSelectAnimal }: Props) => {
  const today = new Date();
  const alerts: Alert[] = [];

  females.forEach((female) => {
    // Alerta: Parto atrasado
    if (female.expected_calving_date && female.reproductive_status === 'preñada') {
      const expectedDate = parseISO(female.expected_calving_date);
      const daysOverdue = differenceInDays(today, expectedDate);
      
      if (daysOverdue > 0) {
        alerts.push({
          id: `overdue-${female.id}`,
          animalId: female.id,
          tagId: female.tag_id,
          name: female.name,
          type: 'overdue',
          message: `Parto atrasado por ${daysOverdue} días`,
          priority: 'high',
          date: female.expected_calving_date,
        });
      } else if (daysOverdue >= -GESTATION_ALERT_DAYS) {
        alerts.push({
          id: `near-birth-${female.id}`,
          animalId: female.id,
          tagId: female.tag_id,
          name: female.name,
          type: 'near_birth',
          message: `Parto esperado en ${Math.abs(daysOverdue)} días`,
          priority: 'medium',
          date: female.expected_calving_date,
        });
      }
    }

    // Alerta: Días abiertos altos
    if (female.last_calving_date && 
        (female.reproductive_status === 'vacia' || female.reproductive_status === 'lactando')) {
      const openDays = differenceInDays(today, parseISO(female.last_calving_date));
      
      if (openDays > MAX_OPEN_DAYS) {
        alerts.push({
          id: `open-days-${female.id}`,
          animalId: female.id,
          tagId: female.tag_id,
          name: female.name,
          type: 'high_open_days',
          message: `${openDays} días abiertos - Requiere atención`,
          priority: 'medium',
        });
      }
    }

    // Alerta: Celo esperado (basado en último celo registrado)
    if (female.reproductive_status === 'vacia') {
      const lastHeat = events
        .filter(e => e.animal_id === female.id && e.event_type === 'celo')
        .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())[0];
      
      if (lastHeat) {
        const daysSinceHeat = differenceInDays(today, parseISO(lastHeat.event_date));
        const daysUntilNextHeat = HEAT_CYCLE_DAYS - (daysSinceHeat % HEAT_CYCLE_DAYS);
        
        if (daysUntilNextHeat <= 3 || (daysSinceHeat % HEAT_CYCLE_DAYS) <= 3) {
          alerts.push({
            id: `heat-${female.id}`,
            animalId: female.id,
            tagId: female.tag_id,
            name: female.name,
            type: 'heat_expected',
            message: daysUntilNextHeat <= 3 
              ? `Celo esperado en ${daysUntilNextHeat} días`
              : `Posible celo hoy o próximos días`,
            priority: 'low',
          });
        }
      }
    }
  });

  // Ordenar por prioridad
  const sortedAlerts = alerts.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'near_birth':
        return <Calendar className="h-4 w-4 text-amber-500" />;
      case 'heat_expected':
        return <Heart className="h-4 w-4 text-pink-500" />;
      case 'high_open_days':
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">Urgente</Badge>;
      case 'medium':
        return <Badge variant="secondary">Atención</Badge>;
      default:
        return <Badge variant="outline">Info</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Alertas Reproductivas
          {sortedAlerts.length > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {sortedAlerts.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedAlerts.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No hay alertas activas
          </p>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {sortedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => onSelectAnimal(alert.animalId)}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{alert.tagId}</span>
                      {alert.name && (
                        <span className="text-muted-foreground text-sm">({alert.name})</span>
                      )}
                      {getPriorityBadge(alert.priority)}
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                    {alert.date && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Fecha: {format(parseISO(alert.date), 'dd/MM/yyyy')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
