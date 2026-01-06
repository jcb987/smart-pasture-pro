import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTraceability } from '@/hooks/useTraceability';
import { useAnimals } from '@/hooks/useAnimals';
import { Calendar, Scale, Heart, Baby, Syringe, FileText, Loader2 } from 'lucide-react';

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'peso':
      return Scale;
    case 'salud':
      return Heart;
    case 'reproduccion':
      return Baby;
    case 'vacunacion':
      return Syringe;
    default:
      return Calendar;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'peso':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'salud':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'reproduccion':
      return 'bg-pink-100 text-pink-800 border-pink-200';
    case 'vacunacion':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const AnimalTimeline = () => {
  const { animals } = useAnimals();
  const { getAnimalTimeline } = useTraceability();
  const [selectedAnimal, setSelectedAnimal] = useState('');
  const [timeline, setTimeline] = useState<Array<{
    date: string;
    type: string;
    category: string;
    description: string;
    icon: string;
  }>>([]);
  const [loading, setLoading] = useState(false);

  const activeAnimals = animals.filter(a => a.status === 'activo');

  useEffect(() => {
    const loadTimeline = async () => {
      if (!selectedAnimal) {
        setTimeline([]);
        return;
      }

      setLoading(true);
      const data = await getAnimalTimeline(selectedAnimal);
      setTimeline(data);
      setLoading(false);
    };

    loadTimeline();
  }, [selectedAnimal]);

  const selectedAnimalData = animals.find(a => a.id === selectedAnimal);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Línea de Tiempo del Animal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Seleccionar Animal</Label>
          <Select value={selectedAnimal} onValueChange={setSelectedAnimal}>
            <SelectTrigger>
              <SelectValue placeholder="Elegir animal para ver historial" />
            </SelectTrigger>
            <SelectContent>
              {activeAnimals.map((animal) => (
                <SelectItem key={animal.id} value={animal.id}>
                  {animal.tag_id} - {animal.name || animal.category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedAnimalData && (
          <div className="bg-muted p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{selectedAnimalData.tag_id}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedAnimalData.name || selectedAnimalData.category} • {selectedAnimalData.breed || 'Sin raza'}
                </p>
              </div>
              <Badge>{selectedAnimalData.status}</Badge>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !selectedAnimal ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Selecciona un animal para ver su historial completo</p>
          </div>
        ) : timeline.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No hay eventos registrados para este animal</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="relative">
              {/* Línea vertical */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

              <div className="space-y-4">
                {timeline.map((event, index) => {
                  const Icon = getCategoryIcon(event.category);
                  return (
                    <div key={index} className="relative pl-10">
                      {/* Punto en la línea */}
                      <div className={`absolute left-2 w-5 h-5 rounded-full border-2 ${getCategoryColor(event.category)} flex items-center justify-center bg-background`}>
                        <Icon className="h-3 w-3" />
                      </div>

                      <div className="bg-card border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline" className={getCategoryColor(event.category)}>
                            {event.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(event.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm">{event.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
