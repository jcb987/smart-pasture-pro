import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  Scale,
  Save,
  X,
  Edit2,
  Check,
  ChevronsUpDown,
  Users
} from 'lucide-react';
import { type Animal, type AnimalEvent, type AnimalCategory, type AnimalStatus, type AnimalSex } from '@/hooks/useAnimals';
import { cn } from '@/lib/utils';

interface AnimalEditDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animal: Animal | null;
  animals: Animal[];
  getEvents: (animalId: string) => Promise<AnimalEvent[]>;
  onSave: (id: string, updates: Partial<Animal>) => Promise<void>;
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
  bufala: 'Búfala',
  bufalo: 'Búfalo',
};

const statusLabels: Record<AnimalStatus, string> = {
  activo: 'Activo',
  vendido: 'Vendido',
  muerto: 'Muerto',
  descartado: 'Descartado',
  trasladado: 'Trasladado',
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

export function AnimalEditDetailDialog({ 
  open, 
  onOpenChange, 
  animal, 
  animals,
  getEvents, 
  onSave 
}: AnimalEditDetailDialogProps) {
  const [events, setEvents] = useState<AnimalEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<Animal>>({});
  
  // Parent selection states
  const [motherOpen, setMotherOpen] = useState(false);
  const [fatherOpen, setFatherOpen] = useState(false);

  // Filter potential parents
  const potentialMothers = useMemo(() => 
    animals.filter(a => a.sex === 'hembra' && a.id !== animal?.id && a.status === 'activo'),
    [animals, animal?.id]
  );
  
  const potentialFathers = useMemo(() => 
    animals.filter(a => a.sex === 'macho' && a.id !== animal?.id && a.status === 'activo'),
    [animals, animal?.id]
  );

  useEffect(() => {
    if (open && animal) {
      loadEvents();
      setEditData({
        name: animal.name,
        category: animal.category,
        sex: animal.sex,
        breed: animal.breed,
        color: animal.color,
        birth_date: animal.birth_date,
        entry_date: animal.entry_date,
        status: animal.status,
        origin: animal.origin,
        lot_name: animal.lot_name,
        mother_id: animal.mother_id,
        father_id: animal.father_id,
        notes: animal.notes,
      });
      setIsEditing(false);
    }
  }, [open, animal]);

  const loadEvents = async () => {
    if (!animal) return;
    setLoadingEvents(true);
    const data = await getEvents(animal.id);
    setEvents(data);
    setLoadingEvents(false);
  };

  const handleSave = async () => {
    if (!animal) return;
    setSaving(true);
    try {
      await onSave(animal.id, editData);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  // Keep editData in sync if animal prop changes (e.g., after save + refetch)
  useEffect(() => {
    if (animal && !isEditing) {
      setEditData({
        name: animal.name,
        category: animal.category,
        sex: animal.sex,
        breed: animal.breed,
        color: animal.color,
        birth_date: animal.birth_date,
        entry_date: animal.entry_date,
        status: animal.status,
        origin: animal.origin,
        lot_name: animal.lot_name,
        mother_id: animal.mother_id,
        father_id: animal.father_id,
        notes: animal.notes,
      });
    }
  }, [animal?.name, animal?.category, animal?.sex, animal?.breed, animal?.color, animal?.status, animal?.lot_name, animal?.notes, isEditing]);

  const handleCategoryChange = (value: AnimalCategory) => {
    const femaleCategories: AnimalCategory[] = ['vaca', 'novilla', 'ternera', 'becerra', 'bufala'];
    setEditData(prev => ({
      ...prev,
      category: value,
      sex: femaleCategories.includes(value) ? 'hembra' : 'macho',
    }));
  };

  const getAnimalDisplayName = (id: string | null) => {
    if (!id) return null;
    const found = animals.find(a => a.id === id);
    return found ? `${found.tag_id}${found.name ? ` - ${found.name}` : ''}` : null;
  };

  if (!animal) return null;

  const motherName = getAnimalDisplayName(editData.mother_id ?? animal.mother_id);
  const fatherName = getAnimalDisplayName(editData.father_id ?? animal.father_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Dna className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl flex items-center gap-2">
                  {isEditing ? (
                    <Input
                      value={editData.name || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nombre del animal"
                      className="h-8 w-48"
                    />
                  ) : (
                    editData.name || animal.name || animal.tag_id
                  )}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{animal.tag_id}</Badge>
                  <Badge>{categoryLabels[animal.category]}</Badge>
                  <Badge variant={animal.status === 'activo' ? 'default' : 'secondary'}>
                    {statusLabels[animal.status]}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} disabled={saving}>
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Guardando...' : 'Guardar'}
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Editar
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="info" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="genealogia">Genealogía</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="flex-1 overflow-auto mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Datos Básicos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {isEditing ? (
                    <>
                      <div className="space-y-1">
                        <Label className="text-xs">Categoría</Label>
                        <Select value={editData.category} onValueChange={handleCategoryChange}>
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(categoryLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Sexo</Label>
                        <Select 
                          value={editData.sex} 
                          onValueChange={(value: AnimalSex) => setEditData(prev => ({ ...prev, sex: value }))}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hembra">Hembra</SelectItem>
                            <SelectItem value="macho">Macho</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Raza</Label>
                        <Input
                          value={editData.breed || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, breed: e.target.value }))}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Color</Label>
                        <Input
                          value={editData.color || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, color: e.target.value }))}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Nacimiento</Label>
                        <Input
                          type="date"
                          value={editData.birth_date || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, birth_date: e.target.value }))}
                          className="h-8"
                        />
                      </div>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
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
                  {isEditing ? (
                    <div className="space-y-1">
                      <Label className="text-xs">Origen</Label>
                      <Input
                        value={editData.origin || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, origin: e.target.value }))}
                        className="h-8"
                      />
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Origen:</span>
                      <span className="font-medium">{animal.origin || '-'}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Ubicación y Estado
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {isEditing ? (
                    <>
                      <div className="space-y-1">
                        <Label className="text-xs">Lote/Potrero</Label>
                        <Input
                          value={editData.lot_name || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, lot_name: e.target.value }))}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Estado</Label>
                        <Select 
                          value={editData.status} 
                          onValueChange={(value: AnimalStatus) => setEditData(prev => ({ ...prev, status: value }))}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lote/Potrero:</span>
                        <span className="font-medium">{animal.lot_name || 'Sin asignar'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Estado:</span>
                        <span className="font-medium capitalize">{animal.status}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Notas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Textarea
                      value={editData.notes || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      placeholder="Observaciones adicionales..."
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {animal.notes || 'Sin notas'}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="genealogia" className="flex-1 overflow-auto mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Padres del Animal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Madre */}
                  <div className="space-y-2">
                    <Label>Madre</Label>
                    {isEditing ? (
                      <Popover open={motherOpen} onOpenChange={setMotherOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={motherOpen}
                            className="w-full justify-between"
                          >
                            {editData.mother_id 
                              ? getAnimalDisplayName(editData.mother_id) || 'Seleccionar madre'
                              : 'Seleccionar madre'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput placeholder="Buscar por arete o nombre..." />
                            <CommandList>
                              <CommandEmpty>No se encontró ninguna hembra.</CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                  onSelect={() => {
                                    setEditData(prev => ({ ...prev, mother_id: null }));
                                    setMotherOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      !editData.mother_id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  Sin madre registrada
                                </CommandItem>
                                {potentialMothers.map((mother) => (
                                  <CommandItem
                                    key={mother.id}
                                    onSelect={() => {
                                      setEditData(prev => ({ ...prev, mother_id: mother.id }));
                                      setMotherOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        editData.mother_id === mother.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {mother.tag_id} {mother.name ? `- ${mother.name}` : ''} 
                                    <span className="ml-auto text-xs text-muted-foreground">
                                      {categoryLabels[mother.category]}
                                    </span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <div className="p-3 bg-muted rounded-lg">
                        {motherName || <span className="text-muted-foreground">No registrada</span>}
                      </div>
                    )}
                  </div>

                  {/* Padre */}
                  <div className="space-y-2">
                    <Label>Padre</Label>
                    {isEditing ? (
                      <Popover open={fatherOpen} onOpenChange={setFatherOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={fatherOpen}
                            className="w-full justify-between"
                          >
                            {editData.father_id 
                              ? getAnimalDisplayName(editData.father_id) || 'Seleccionar padre'
                              : 'Seleccionar padre'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput placeholder="Buscar por arete o nombre..." />
                            <CommandList>
                              <CommandEmpty>No se encontró ningún macho.</CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                  onSelect={() => {
                                    setEditData(prev => ({ ...prev, father_id: null }));
                                    setFatherOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      !editData.father_id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  Sin padre registrado
                                </CommandItem>
                                {potentialFathers.map((father) => (
                                  <CommandItem
                                    key={father.id}
                                    onSelect={() => {
                                      setEditData(prev => ({ ...prev, father_id: father.id }));
                                      setFatherOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        editData.father_id === father.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {father.tag_id} {father.name ? `- ${father.name}` : ''}
                                    <span className="ml-auto text-xs text-muted-foreground">
                                      {categoryLabels[father.category]}
                                    </span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <div className="p-3 bg-muted rounded-lg">
                        {fatherName || <span className="text-muted-foreground">No registrado</span>}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historial" className="flex-1 min-h-0 mt-4">
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

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}