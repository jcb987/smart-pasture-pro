import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bug, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Syringe,
  Shield
} from 'lucide-react';
import { ParasiteSchedule, ParasiteStats } from '@/hooks/useParasiteControl';

interface ParasiteControlCardProps {
  schedules: ParasiteSchedule[];
  stats: ParasiteStats;
  urgentAnimals: ParasiteSchedule[];
  upcomingAnimals: ParasiteSchedule[];
  onRegisterDeworming?: (animalId: string) => void;
}

export const ParasiteControlCard = ({ 
  schedules, 
  stats, 
  urgentAnimals, 
  upcomingAnimals,
  onRegisterDeworming 
}: ParasiteControlCardProps) => {
  const getStatusBadge = (schedule: ParasiteSchedule) => {
    switch (schedule.status) {
      case 'overdue':
        return <Badge variant="destructive">Vencido ({Math.abs(schedule.daysUntilNext)}d)</Badge>;
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
          Pendiente
        </Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          {schedule.daysUntilNext}d
        </Badge>;
      default:
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          Al día
        </Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Estadísticas generales */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Control Parasitario del Hato
          </CardTitle>
          <CardDescription>Programación automática según categoría animal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{stats.totalAnimals}</div>
              <div className="text-xs text-muted-foreground">Total Animales</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.upToDate}</div>
              <div className="text-xs text-muted-foreground">Al Día</div>
            </div>
            <div className="text-center p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
              <div className="text-xs text-muted-foreground">Pendientes</div>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              <div className="text-xs text-muted-foreground">Vencidos</div>
            </div>
          </div>

          {/* Barra de protección */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Protección del hato</span>
              <span className="font-medium">{stats.percentageProtected}%</span>
            </div>
            <Progress value={stats.percentageProtected} className="h-3" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Urgentes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Requieren Desparasitación
              {urgentAnimals.length > 0 && (
                <Badge variant="destructive" className="ml-auto">{urgentAnimals.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px]">
              {urgentAnimals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    ¡Todos los animales están al día!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {urgentAnimals.map((animal) => (
                    <div key={animal.id} className="p-3 border border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-800 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-medium">{animal.tagId}</span>
                          {animal.name && (
                            <span className="text-sm text-muted-foreground ml-1">({animal.name})</span>
                          )}
                        </div>
                        {getStatusBadge(animal)}
                      </div>
                      
                      <div className="text-xs text-muted-foreground mb-2">
                        <Clock className="h-3 w-3 inline mr-1" />
                        Último: {animal.lastTreatmentDate 
                          ? new Date(animal.lastTreatmentDate).toLocaleDateString('es-ES')
                          : 'Sin registros'
                        }
                        {animal.productUsed && ` - ${animal.productUsed}`}
                      </div>
                      
                      {onRegisterDeworming && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full"
                          onClick={() => onRegisterDeworming(animal.animalId)}
                        >
                          <Syringe className="h-3 w-3 mr-1" />
                          Registrar Desparasitación
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Próximos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              Próximos 7 Días
              {upcomingAnimals.length > 0 && (
                <Badge className="ml-auto bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  {upcomingAnimals.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px]">
              {upcomingAnimals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Sin desparasitaciones programadas
                </p>
              ) : (
                <div className="space-y-2">
                  {upcomingAnimals.map((animal) => (
                    <div key={animal.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-medium">{animal.tagId}</span>
                          {animal.name && (
                            <span className="text-sm text-muted-foreground ml-1">({animal.name})</span>
                          )}
                        </div>
                        {getStatusBadge(animal)}
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        Programada: {new Date(animal.nextTreatmentDate).toLocaleDateString('es-ES')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
