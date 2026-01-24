import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Tag,
  Heart,
  Stethoscope,
  MapPin,
  AlertTriangle,
  Activity,
  WifiOff,
  Edit
} from 'lucide-react';
import { AnimalEditDetailDialog } from '@/components/animales/AnimalEditDetailDialog';
import { type Animal, type AnimalEvent } from '@/hooks/useAnimals';
import { useHealth } from '@/hooks/useHealth';
import { useReproduction } from '@/hooks/useReproduction';
import { useMilkProduction } from '@/hooks/useMilkProduction';
import { useWeightRecords } from '@/hooks/useWeightRecords';
import { useAnimals } from '@/hooks/useAnimals';
import { useOffline } from '@/contexts/OfflineContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AnimalComplete {
  id: string;
  tag_id: string;
  name: string | null;
  category: string;
  sex: string;
  breed: string | null;
  color: string | null;
  birth_date: string | null;
  entry_date: string | null;
  status: string;
  current_weight: number | null;
  origin: string | null;
  lot_name: string | null;
  notes: string | null;
  reproductive_status: string | null;
  total_calvings: number | null;
  last_calving_date: string | null;
  expected_calving_date: string | null;
}

const ConsultarAnimal = () => {
  const { animals, loading: animalsLoading, updateAnimal, getAnimalEvents } = useAnimals();
  const { isOnline } = useOffline();
  const { healthEvents, vaccinations } = useHealth();
  const { events: reproductiveEvents } = useReproduction();
  const { records: milkRecords } = useMilkProduction();
  const { records: weightRecords } = useWeightRecords();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalComplete | null>(null);
  const [filteredAnimals, setFilteredAnimals] = useState<AnimalComplete[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Use animals from the hook (which has offline support)
  const activeAnimals = animals.filter(a => a.status === 'activo') as unknown as AnimalComplete[];

  // Secciones colapsables
  const [openSections, setOpenSections] = useState({
    identificacion: true,
    produccion: true,
    reproduccion: true,
    salud: true,
    ubicacion: true,
  });

  // Búsqueda con autocompletado - now uses cached animals
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const filtered = activeAnimals.filter(a => 
        a.tag_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.name && a.name.toLowerCase().includes(searchTerm.toLowerCase()))
      ).slice(0, 8);
      setFilteredAnimals(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredAnimals([]);
      setShowSuggestions(false);
    }
  }, [searchTerm, activeAnimals]);

  // Seleccionar animal
  const selectAnimal = useCallback((animal: AnimalComplete) => {
    setSelectedAnimal(animal);
    setSearchTerm(animal.tag_id);
    setShowSuggestions(false);
  }, []);

  // Navegación entre animales
  const navigateAnimal = useCallback((direction: 'prev' | 'next') => {
    if (!selectedAnimal) return;
    const currentIndex = activeAnimals.findIndex(a => a.id === selectedAnimal.id);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'next' 
      ? (currentIndex + 1) % activeAnimals.length
      : (currentIndex - 1 + activeAnimals.length) % activeAnimals.length;
    
    selectAnimal(activeAnimals[newIndex]);
  }, [selectedAnimal, activeAnimals, selectAnimal]);

  // Toggle sección
  const toggleSection = useCallback((section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  }, []);

  // Obtener datos específicos del animal seleccionado
  const getAnimalData = useCallback(() => {
    if (!selectedAnimal) return null;

    // Eventos de salud del animal
    const animalHealthEvents = healthEvents.filter(e => e.animal_id === selectedAnimal.id);
    const animalVaccinations = vaccinations.filter(v => v.animal_id === selectedAnimal.id);
    
    // Último tratamiento y vacuna
    const lastTreatment = animalHealthEvents
      .filter(e => e.event_type === 'tratamiento')
      .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())[0];
    const lastVaccine = animalVaccinations
      .filter(v => v.is_applied)
      .sort((a, b) => new Date(b.applied_date || '').getTime() - new Date(a.applied_date || '').getTime())[0];

    // Eventos reproductivos
    const animalReproEvents = reproductiveEvents.filter(e => e.animal_id === selectedAnimal.id);
    const lastPalpation = animalReproEvents
      .filter(e => e.event_type === 'palpacion')
      .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())[0];
    const lastHeat = animalReproEvents
      .filter(e => e.event_type === 'celo')
      .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())[0];
    const lastBirth = animalReproEvents
      .filter(e => e.event_type === 'parto')
      .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())[0];

    // Producción de leche
    const animalMilkRecords = milkRecords.filter(r => r.animal_id === selectedAnimal.id);
    const avgMilk = animalMilkRecords.length > 0
      ? animalMilkRecords.reduce((sum, r) => sum + (r.total_liters || 0), 0) / animalMilkRecords.length
      : null;

    // Registros de peso
    const animalWeightRecords = weightRecords.filter(r => r.animal_id === selectedAnimal.id);
    const lastWeight = animalWeightRecords
      .sort((a, b) => new Date(b.weight_date).getTime() - new Date(a.weight_date).getTime())[0];
    
    // Ganancia diaria promedio
    const avgDailyGain = animalWeightRecords.length > 1
      ? animalWeightRecords
          .filter(r => r.daily_gain)
          .reduce((sum, r) => sum + (r.daily_gain || 0), 0) / animalWeightRecords.filter(r => r.daily_gain).length
      : null;

    return {
      lastTreatment,
      lastVaccine,
      lastPalpation,
      lastHeat,
      lastBirth,
      avgMilk,
      lastWeight,
      avgDailyGain,
      healthEventsCount: animalHealthEvents.length,
    };
  }, [selectedAnimal, healthEvents, vaccinations, reproductiveEvents, milkRecords, weightRecords]);

  const animalData = getAnimalData();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      activo: { variant: 'default', label: 'Activo' },
      vendido: { variant: 'secondary', label: 'Vendido' },
      muerto: { variant: 'destructive', label: 'Muerto' },
      descartado: { variant: 'outline', label: 'Descartado' },
    };
    const config = variants[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getReproStatusBadge = (status: string | null) => {
    if (!status) return null;
    const variants: Record<string, { className: string, label: string }> = {
      vacia: { className: 'bg-muted text-muted-foreground', label: 'Vacía' },
      servida: { className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', label: 'Servida' },
      preñada: { className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Preñada' },
      lactando: { className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', label: 'Lactando' },
    };
    const config = variants[status] || { className: 'bg-muted', label: status };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), 'dd MMM yyyy', { locale: es });
  };

  const SectionHeader = ({ 
    icon: Icon, 
    title, 
    section, 
    isOpen 
  }: { 
    icon: typeof Tag, 
    title: string, 
    section: keyof typeof openSections,
    isOpen: boolean 
  }) => (
    <CollapsibleTrigger asChild>
      <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-lg p-3 transition-colors">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">{title}</h3>
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </div>
    </CollapsibleTrigger>
  );

  const InfoRow = ({ label, value, highlight = false }: { label: string, value: React.ReactNode, highlight?: boolean }) => (
    <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className={cn("font-medium text-sm", highlight && "text-primary")}>{value || '-'}</span>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Consultar Animal</h1>
            {!isOnline && (
              <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Vista 360° - Hoja de vida del animal
            {!isOnline && ` (${activeAnimals.length} animales en caché)`}
          </p>
        </div>

        {/* Búsqueda */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por arete o nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
                  className="pl-10"
                />
                
                {/* Autocompletado */}
                {showSuggestions && filteredAnimals.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredAnimals.map((animal) => (
                      <button
                        key={animal.id}
                        onClick={() => selectAnimal(animal)}
                        className="w-full px-4 py-2 text-left hover:bg-accent flex items-center justify-between"
                      >
                        <span className="font-medium">{animal.tag_id}</span>
                        {animal.name && <span className="text-muted-foreground text-sm">{animal.name}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Navegación y Edición */}
              {selectedAnimal && (
                <div className="flex gap-1">
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => setEditDialogOpen(true)}
                    className="gap-1"
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => navigateAnimal('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => navigateAnimal('next')}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Loading state */}
        {animalsLoading && (
          <Card className="py-12">
            <CardContent className="text-center">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Cargando animales...</p>
            </CardContent>
          </Card>
        )}

        {/* Estado vacío */}
        {!animalsLoading && !selectedAnimal && (
          <Card className="py-12">
            <CardContent className="text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Selecciona un animal</h3>
              <p className="text-muted-foreground">
                {activeAnimals.length > 0 
                  ? `Busca entre ${activeAnimals.length} animales por arete o nombre`
                  : 'No hay animales disponibles'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Información del animal */}
        {selectedAnimal && animalData && (
          <div className="space-y-4">
            {/* Identificación */}
            <Collapsible open={openSections.identificacion} onOpenChange={() => toggleSection('identificacion')}>
              <Card>
                <SectionHeader icon={Tag} title="Identificación" section="identificacion" isOpen={openSections.identificacion} />
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                      <InfoRow label="Arete / ID" value={<span className="font-bold text-lg">{selectedAnimal.tag_id}</span>} highlight />
                      <InfoRow label="Nombre" value={selectedAnimal.name} />
                      <InfoRow label="Sexo" value={selectedAnimal.sex === 'hembra' ? 'Hembra' : 'Macho'} />
                      <InfoRow label="Raza" value={selectedAnimal.breed} />
                      <InfoRow label="Categoría" value={<span className="capitalize">{selectedAnimal.category}</span>} />
                      <InfoRow label="Estado" value={getStatusBadge(selectedAnimal.status)} />
                      <InfoRow label="Fecha de nacimiento" value={formatDate(selectedAnimal.birth_date)} />
                      <InfoRow label="Color" value={selectedAnimal.color} />
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Producción */}
            <Collapsible open={openSections.produccion} onOpenChange={() => toggleSection('produccion')}>
              <Card>
                <SectionHeader icon={Activity} title="Producción" section="produccion" isOpen={openSections.produccion} />
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                      <InfoRow 
                        label="Peso actual" 
                        value={selectedAnimal.current_weight ? `${selectedAnimal.current_weight} kg` : null} 
                      />
                      <InfoRow 
                        label="Último pesaje" 
                        value={animalData.lastWeight ? formatDate(animalData.lastWeight.weight_date) : null} 
                      />
                      <InfoRow 
                        label="Ganancia diaria" 
                        value={animalData.avgDailyGain ? `${animalData.avgDailyGain.toFixed(2)} kg/día` : null}
                        highlight={!!animalData.avgDailyGain}
                      />
                      {selectedAnimal.sex === 'hembra' && (
                        <InfoRow 
                          label="Promedio leche" 
                          value={animalData.avgMilk ? `${animalData.avgMilk.toFixed(1)} L/día` : null}
                          highlight={!!animalData.avgMilk}
                        />
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Reproducción (solo hembras) */}
            {selectedAnimal.sex === 'hembra' && (
              <Collapsible open={openSections.reproduccion} onOpenChange={() => toggleSection('reproduccion')}>
                <Card>
                  <SectionHeader icon={Heart} title="Reproducción" section="reproduccion" isOpen={openSections.reproduccion} />
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                        <InfoRow 
                          label="Estado reproductivo" 
                          value={getReproStatusBadge(selectedAnimal.reproductive_status)} 
                        />
                        <InfoRow 
                          label="Total partos" 
                          value={selectedAnimal.total_calvings} 
                        />
                        <InfoRow 
                          label="Última palpación" 
                          value={animalData.lastPalpation ? formatDate(animalData.lastPalpation.event_date) : null} 
                        />
                        <InfoRow 
                          label="Último celo" 
                          value={animalData.lastHeat ? formatDate(animalData.lastHeat.event_date) : null} 
                        />
                        <InfoRow 
                          label="Último parto" 
                          value={formatDate(selectedAnimal.last_calving_date)} 
                        />
                        <InfoRow 
                          label="Fecha probable de parto" 
                          value={formatDate(selectedAnimal.expected_calving_date)}
                          highlight={!!selectedAnimal.expected_calving_date}
                        />
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )}

            {/* Salud */}
            <Collapsible open={openSections.salud} onOpenChange={() => toggleSection('salud')}>
              <Card>
                <SectionHeader icon={Stethoscope} title="Salud" section="salud" isOpen={openSections.salud} />
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                      <InfoRow 
                        label="Total eventos de salud" 
                        value={animalData.healthEventsCount} 
                      />
                      <InfoRow 
                        label="Último tratamiento" 
                        value={animalData.lastTreatment ? formatDate(animalData.lastTreatment.event_date) : null} 
                      />
                      <InfoRow 
                        label="Última vacuna" 
                        value={animalData.lastVaccine?.applied_date ? formatDate(animalData.lastVaccine.applied_date) : null} 
                      />
                      {animalData.lastTreatment && (
                        <InfoRow 
                          label="Diagnóstico" 
                          value={animalData.lastTreatment.diagnosis} 
                        />
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Ubicación */}
            <Collapsible open={openSections.ubicacion} onOpenChange={() => toggleSection('ubicacion')}>
              <Card>
                <SectionHeader icon={MapPin} title="Ubicación" section="ubicacion" isOpen={openSections.ubicacion} />
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                      <InfoRow label="Lote actual" value={selectedAnimal.lot_name} />
                      <InfoRow label="Origen" value={selectedAnimal.origin} />
                      <InfoRow label="Fecha de ingreso" value={formatDate(selectedAnimal.entry_date)} />
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Notas */}
            {selectedAnimal.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Notas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{selectedAnimal.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Dialog de Edición Completa */}
      <AnimalEditDetailDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        animal={selectedAnimal as unknown as Animal | null}
        animals={animals as unknown as Animal[]}
        getEvents={getAnimalEvents}
        onSave={async (id, updates) => {
          await updateAnimal(id, updates);
          // Actualizar el animal seleccionado con los nuevos datos
          const updatedAnimal = animals.find(a => a.id === id);
          if (updatedAnimal) {
            setSelectedAnimal(updatedAnimal as unknown as AnimalComplete);
          }
        }}
      />
    </DashboardLayout>
  );
};

export default ConsultarAnimal;
