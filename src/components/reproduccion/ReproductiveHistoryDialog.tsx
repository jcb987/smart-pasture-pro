import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2 } from 'lucide-react';
import { ReproductiveEvent, FemaleAnimal } from '@/hooks/useReproduction';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animal: FemaleAnimal | null;
  events: ReproductiveEvent[];
  onDeleteEvent: (eventId: string) => void;
  motherName?: string;
  fatherName?: string;
}

const eventTypeColors: Record<string, string> = {
  celo: 'bg-pink-100 text-pink-800',
  servicio: 'bg-blue-100 text-blue-800',
  inseminacion: 'bg-indigo-100 text-indigo-800',
  palpacion: 'bg-yellow-100 text-yellow-800',
  parto: 'bg-green-100 text-green-800',
  aborto: 'bg-red-100 text-red-800',
  secado: 'bg-gray-100 text-gray-800',
};

const eventTypeLabels: Record<string, string> = {
  celo: 'Celo',
  servicio: 'Servicio',
  inseminacion: 'Inseminación',
  palpacion: 'Palpación',
  parto: 'Parto',
  aborto: 'Aborto',
  secado: 'Secado',
};

export const ReproductiveHistoryDialog = ({ 
  open, 
  onOpenChange, 
  animal, 
  events,
  onDeleteEvent,
  motherName,
  fatherName,
}: Props) => {
  if (!animal) return null;

  const animalEvents = events
    .filter(e => e.animal_id === animal.id)
    .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            Historial Reproductivo - {animal.tag_id} {animal.name && `(${animal.name})`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info del animal */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Categoría</p>
              <p className="font-medium capitalize">{animal.category}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estado</p>
              <p className="font-medium capitalize">{animal.reproductive_status || 'Vacía'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Partos</p>
              <p className="font-medium">{animal.total_calvings || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Primer Parto</p>
              <p className="font-medium">
                {animal.first_calving_date 
                  ? format(parseISO(animal.first_calving_date), 'dd/MM/yyyy')
                  : '-'
                }
              </p>
            </div>
          </div>

          {/* Pedigrí */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-3">Pedigrí</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Madre</p>
                <p className="font-medium">{motherName || 'No registrada'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Padre</p>
                <p className="font-medium">{fatherName || 'No registrado'}</p>
              </div>
            </div>
          </div>

          {/* Timeline de eventos */}
          <div>
            <h4 className="font-medium mb-3">Historial de Eventos</h4>
            <ScrollArea className="h-[300px] pr-4">
              {animalEvents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay eventos reproductivos registrados
                </p>
              ) : (
                <div className="space-y-4">
                  {animalEvents.map((event) => (
                    <div 
                      key={event.id} 
                      className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-shrink-0 w-24 text-sm text-muted-foreground">
                        {format(parseISO(event.event_date), 'dd MMM yyyy', { locale: es })}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={eventTypeColors[event.event_type]}>
                            {eventTypeLabels[event.event_type]}
                          </Badge>
                          {event.pregnancy_result && (
                            <Badge variant={event.pregnancy_result === 'positivo' ? 'default' : 'secondary'}>
                              {event.pregnancy_result === 'positivo' ? 'Preñada' : 
                               event.pregnancy_result === 'negativo' ? 'Vacía' : 'Dudoso'}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm space-y-1">
                          {event.semen_batch && (
                            <p><span className="text-muted-foreground">Lote semen:</span> {event.semen_batch}</p>
                          )}
                          {event.technician && (
                            <p><span className="text-muted-foreground">Técnico:</span> {event.technician}</p>
                          )}
                          {event.estimated_gestation_days && (
                            <p><span className="text-muted-foreground">Días gestación:</span> {event.estimated_gestation_days}</p>
                          )}
                          {event.birth_type && (
                            <p><span className="text-muted-foreground">Tipo parto:</span> {event.birth_type}</p>
                          )}
                          {event.calf_sex && (
                            <p><span className="text-muted-foreground">Sexo cría:</span> {event.calf_sex}</p>
                          )}
                          {event.calf_weight && (
                            <p><span className="text-muted-foreground">Peso cría:</span> {event.calf_weight} kg</p>
                          )}
                          {event.expected_birth_date && (
                            <p>
                              <span className="text-muted-foreground">Parto esperado:</span>{' '}
                              {format(parseISO(event.expected_birth_date), 'dd/MM/yyyy')}
                            </p>
                          )}
                          {event.notes && (
                            <p className="text-muted-foreground italic">{event.notes}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onDeleteEvent(event.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
