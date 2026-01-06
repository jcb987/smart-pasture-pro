import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Weight, 
  MapPin, 
  Dna, 
  FileText, 
  Clock,
  Syringe,
  Heart,
  Baby,
  Scale
} from 'lucide-react';
import { type Animal, type AnimalEvent, type AnimalCategory } from '@/hooks/useAnimals';

interface AnimalDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animal: Animal | null;
  getEvents: (animalId: string) => Promise<AnimalEvent[]>;
}

const categoryLabels: Record<AnimalCategory, string> = {
  vaca: 'Vaca',
  toro: 'Toro',
  novilla: 'Novilla',
  novillo: 'Novillo',
  ternera: 'Ternera',
  ternero: 'Ternero',
  becerra: 'Becerra',
  becerro: 'Becerro',
};

const eventIcons: Record<string, React.ReactNode> = {
  pesaje: <Scale className="h-4 w-4" />,
  vacunacion: <Syringe className="h-4 w-4" />,
  tratamiento: <Heart className="h-4 w-4" />,
  parto: <Baby className="h-4 w-4" />,
  servicio: <Heart className="h-4 w-4" />,
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const calculateAge = (birthDate: string | null) => {
  if (!birthDate) return '-';
  const birth = new Date(birthDate);
  const today = new Date();
  const months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
  
  if (months < 12) {
    return `${months} meses`;
  }
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return remainingMonths > 0 ? `${years} años, ${remainingMonths} meses` : `${years} años`;
};

export function AnimalDetailDialog({ open, onOpenChange, animal, getEvents }: AnimalDetailDialogProps) {
  const [events, setEvents] = useState<AnimalEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  useEffect(() => {
    if (open && animal) {
      loadEvents();
    }
  }, [open, animal]);

  const loadEvents = async () => {
    if (!animal) return;
    setLoadingEvents(true);
    const data = await getEvents(animal.id);
    setEvents(data);
    setLoadingEvents(false);
  };

  if (!animal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Dna className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {animal.name || animal.tag_id}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{animal.tag_id}</Badge>
                <Badge>{categoryLabels[animal.category]}</Badge>
                <Badge variant={animal.status === 'activo' ? 'default' : 'secondary'}>
                  {animal.status}
                </Badge>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="info" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Datos Básicos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sexo:</span>
                    <span className="font-medium capitalize">{animal.sex}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Raza:</span>
                    <span className="font-medium">{animal.breed || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Color:</span>
                    <span className="font-medium">{animal.color || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nacimiento:</span>
                    <span className="font-medium">{formatDate(animal.birth_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Edad:</span>
                    <span className="font-medium">{calculateAge(animal.birth_date)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Weight className="h-4 w-4" />
                    Peso y Producción
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Peso Actual:</span>
                    <span className="font-medium">
                      {animal.current_weight ? `${animal.current_weight} kg` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Último Pesaje:</span>
                    <span className="font-medium">{formatDate(animal.last_weight_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ingreso al Hato:</span>
                    <span className="font-medium">{formatDate(animal.entry_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Origen:</span>
                    <span className="font-medium">{animal.origin || '-'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Ubicación
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lote/Potrero:</span>
                    <span className="font-medium">{animal.lot_name || 'Sin asignar'}</span>
                  </div>
                </CardContent>
              </Card>

              {animal.notes && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Notas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{animal.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="historial" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {loadingEvents ? (
                <div className="text-center py-8 text-muted-foreground">
                  Cargando historial...
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay eventos registrados</p>
                  <p className="text-sm">Los pesajes, vacunas y otros eventos aparecerán aquí</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((event, index) => (
                    <div key={event.id}>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          {eventIcons[event.event_type] || <Clock className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium capitalize">{event.event_type}</p>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(event.event_date)}
                            </span>
                          </div>
                          {event.weight && (
                            <p className="text-sm text-muted-foreground">
                              Peso: {event.weight} kg
                            </p>
                          )}
                          {event.notes && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {event.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      {index < events.length - 1 && <Separator className="my-4" />}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
