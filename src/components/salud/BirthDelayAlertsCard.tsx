import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  Baby, 
  Clock, 
  Stethoscope,
  ChevronRight,
  Brain
} from 'lucide-react';
import { BirthDelayAlert, UpcomingBirth } from '@/hooks/usePalpationRecords';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface BirthDelayAlertsCardProps {
  alerts: BirthDelayAlert[];
  upcomingBirths?: UpcomingBirth[];
  onViewAnimal?: (animalId: string) => void;
}

export const BirthDelayAlertsCard = ({
  alerts,
  upcomingBirths = [],
  onViewAnimal,
}: BirthDelayAlertsCardProps) => {
  if (alerts.length === 0 && upcomingBirths.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Baby className="h-5 w-5 text-primary" />
            Partos y Alertas
          </CardTitle>
          <CardDescription>
            Monitoreo de partos próximos y retrasados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Baby className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay partos próximos ni retrasados</p>
            <p className="text-sm">Todos los partos están dentro del rango esperado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0 && upcomingBirths.length > 0) {
    return (
      <Card className="border-blue-400">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Baby className="h-5 w-5 text-blue-600" />
            Partos Próximos
            <Badge className="ml-auto bg-blue-500 text-white">{upcomingBirths.length} próximo(s)</Badge>
          </CardTitle>
          <CardDescription>
            Animales con parto esperado en los próximos 14 días
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingBirths.map(b => (
              <div key={b.animalId} className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <div>
                  <p className="font-medium text-sm">{b.tagId}{b.name ? ` - ${b.name}` : ''}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(b.expectedDate), 'dd MMM yyyy', { locale: es })}
                  </p>
                </div>
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  En {b.daysUntilBirth} día{b.daysUntilBirth !== 1 ? 's' : ''}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const urgentCount = alerts.filter(a => a.alertLevel === 'urgent').length;
  const warningCount = alerts.filter(a => a.alertLevel === 'warning').length;

  return (
    <Card className={urgentCount > 0 ? 'border-destructive' : 'border-amber-500'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className={`h-5 w-5 ${urgentCount > 0 ? 'text-destructive' : 'text-amber-600'}`} />
          Partos y Alertas
          <Badge variant={urgentCount > 0 ? 'destructive' : 'secondary'} className="ml-auto">
            {alerts.length} alerta(s)
          </Badge>
        </CardTitle>
        <CardDescription>
          Animales con fecha de parto vencida que requieren atención
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upcoming births summary */}
        {upcomingBirths.length > 0 && (
          <div className="space-y-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200 flex items-center gap-2">
              <Baby className="h-4 w-4" />
              {upcomingBirths.length} parto(s) próximo(s) en los siguientes 14 días
            </p>
            <div className="space-y-1">
              {upcomingBirths.map(b => (
                <div key={b.animalId} className="flex items-center justify-between text-xs">
                  <span className="text-blue-700 dark:text-blue-300">{b.tagId}{b.name ? ` - ${b.name}` : ''}</span>
                  <span className="font-medium text-blue-800 dark:text-blue-200">En {b.daysUntilBirth} día{b.daysUntilBirth !== 1 ? 's' : ''} · {format(parseISO(b.expectedDate), 'dd MMM', { locale: es })}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="flex gap-4">
          {urgentCount > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <span>{urgentCount} urgente(s)</span>
            </div>
          )}
          {warningCount > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span>{warningCount} advertencia(s)</span>
            </div>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          <div className="space-y-4 pr-4">
            {alerts.map((alert) => (
              <Alert 
                key={alert.animalId}
                variant={alert.alertLevel === 'urgent' ? 'destructive' : 'default'}
                className={alert.alertLevel === 'warning' ? 'border-amber-500 bg-amber-50 dark:bg-amber-950' : ''}
              >
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="flex items-center justify-between">
                  <span>
                    {alert.tagId} {alert.name && `- ${alert.name}`}
                  </span>
                  <Badge variant={alert.alertLevel === 'urgent' ? 'destructive' : 'secondary'}>
                    {alert.alertLevel === 'urgent' ? '🔴 Urgente' : '🟡 Advertencia'}
                  </Badge>
                </AlertTitle>
                <AlertDescription className="space-y-3 mt-2">
                  {/* Main Alert */}
                  <div className="p-3 rounded-lg bg-background/80">
                    <p className="font-medium">
                      ⚠️ Este animal presenta retraso en el parto.
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Fecha esperada: {format(parseISO(alert.expectedDate), 'dd MMM yyyy', { locale: es })}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        <span className="font-semibold text-destructive">
                          +{alert.daysOverdue} días de retraso
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="mt-2">
                      {alert.species === 'bovino' ? '🐄 Bovino' : '🐃 Bufalino'}
                    </Badge>
                  </div>

                  {/* AI Analysis */}
                  <div className="p-3 rounded-lg bg-primary/5 border">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">Análisis IA - Posibles Causas</span>
                    </div>
                    <ul className="text-sm space-y-1">
                      {alert.suggestedCauses.slice(0, 5).map((cause, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-muted-foreground">•</span>
                          <span>{cause}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Last Palpation Info */}
                  {alert.lastPalpation && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Stethoscope className="h-3 w-3" />
                        <span className="text-sm font-medium">Última palpación</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(alert.lastPalpation.palpation_date), 'dd MMM yyyy', { locale: es })}
                        {alert.lastPalpation.body_condition_score && (
                          <> | BCS: {alert.lastPalpation.body_condition_score}</>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Action */}
                  {onViewAnimal && (
                    <>
                      <Separator />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => onViewAnimal(alert.animalId)}
                      >
                        Ver ficha del animal
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </>
                  )}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
