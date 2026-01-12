import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Syringe, 
  Stethoscope,
  Baby,
  Droplet,
  CalendarClock
} from 'lucide-react';
import { AutomatedEvent } from '@/hooks/useAutomatedEvents';

interface AutomatedEventsCardProps {
  events: AutomatedEvent[];
  urgentEvents: AutomatedEvent[];
  summary: {
    total: number;
    urgent: number;
    high: number;
    medium: number;
    byType: Record<string, number>;
  };
  onComplete?: (event: AutomatedEvent) => void;
}

export const AutomatedEventsCard = ({ events, urgentEvents, summary, onComplete }: AutomatedEventsCardProps) => {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'secado': return <Droplet className="h-4 w-4" />;
      case 'palpacion': return <Stethoscope className="h-4 w-4" />;
      case 'vacuna': return <Syringe className="h-4 w-4" />;
      case 'destete': return <Baby className="h-4 w-4" />;
      case 'revision': return <Stethoscope className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getEventLabel = (type: string) => {
    const labels: Record<string, string> = {
      secado: 'Secado',
      palpacion: 'Palpación',
      vacuna: 'Vacunación',
      destete: 'Destete',
      revision: 'Revisión',
      desparasitacion: 'Desparasitación'
    };
    return labels[type] || type;
  };

  const getPriorityBadge = (priority: string, daysUntil: number) => {
    if (priority === 'urgent') {
      return <Badge variant="destructive">Vencido ({Math.abs(daysUntil)}d)</Badge>;
    }
    if (priority === 'high') {
      return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
        {daysUntil <= 0 ? 'Hoy' : `${daysUntil}d`}
      </Badge>;
    }
    if (priority === 'medium') {
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
        {daysUntil}d
      </Badge>;
    }
    return <Badge variant="secondary">{daysUntil}d</Badge>;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" />
          Eventos Programados Automáticos
          {summary.urgent > 0 && (
            <Badge variant="destructive" className="ml-2">{summary.urgent} urgentes</Badge>
          )}
        </CardTitle>
        <CardDescription>Basados en fechas de parto, servicio y nacimiento</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumen por tipo */}
        <div className="grid grid-cols-5 gap-2">
          <div className="text-center p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <Droplet className="h-4 w-4 mx-auto text-blue-600" />
            <div className="text-lg font-bold">{summary.byType.secado || 0}</div>
            <div className="text-xs text-muted-foreground">Secado</div>
          </div>
          <div className="text-center p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
            <Stethoscope className="h-4 w-4 mx-auto text-purple-600" />
            <div className="text-lg font-bold">{summary.byType.palpacion || 0}</div>
            <div className="text-xs text-muted-foreground">Palpación</div>
          </div>
          <div className="text-center p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
            <Syringe className="h-4 w-4 mx-auto text-green-600" />
            <div className="text-lg font-bold">{summary.byType.vacuna || 0}</div>
            <div className="text-xs text-muted-foreground">Vacunas</div>
          </div>
          <div className="text-center p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
            <Baby className="h-4 w-4 mx-auto text-amber-600" />
            <div className="text-lg font-bold">{summary.byType.destete || 0}</div>
            <div className="text-xs text-muted-foreground">Destete</div>
          </div>
          <div className="text-center p-2 bg-pink-50 dark:bg-pink-950/30 rounded-lg">
            <Stethoscope className="h-4 w-4 mx-auto text-pink-600" />
            <div className="text-lg font-bold">{summary.byType.revision || 0}</div>
            <div className="text-xs text-muted-foreground">Revisión</div>
          </div>
        </div>

        {/* Lista de eventos */}
        <ScrollArea className="h-[300px]">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
              <p className="text-sm text-muted-foreground">
                No hay eventos programados próximos
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {events.slice(0, 15).map((event) => (
                <div 
                  key={event.id} 
                  className={`p-3 border rounded-lg flex items-center justify-between gap-3 ${
                    event.priority === 'urgent' ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20' :
                    event.priority === 'high' ? 'border-orange-200 bg-orange-50/30 dark:bg-orange-950/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      event.priority === 'urgent' ? 'bg-red-100 text-red-600 dark:bg-red-900/30' :
                      event.priority === 'high' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {getEventIcon(event.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{event.tagId}</span>
                        {event.name && <span className="text-sm text-muted-foreground">({event.name})</span>}
                        <Badge variant="outline" className="text-xs">
                          {getEventLabel(event.type)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{event.description}</p>
                      <p className="text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {event.basedOn}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(event.priority, event.daysUntil)}
                    {onComplete && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onComplete(event)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
