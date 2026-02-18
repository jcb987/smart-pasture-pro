import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Animal {
  id: string;
  tag_id: string;
  name: string | null;
  sex: string;
}

interface AddHealthEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitEvent: (event: {
    animal_id: string;
    event_type: 'tratamiento' | 'vacuna' | 'diagnostico' | 'palpacion';
    event_date: string;
    diagnosis?: string;
    treatment?: string;
    medication?: string;
    dosage?: string;
    duration_days?: number;
    next_dose_date?: string;
    withdrawal_days?: number;
    veterinarian?: string;
    cost?: number;
    notes?: string;
  }) => Promise<any>;
  onPalpationSubmit?: (data: {
    animal_id: string;
    event_date: string;
    result: 'positivo' | 'negativo';
    gestation_days?: number;
    veterinarian?: string;
    notes?: string;
  }) => Promise<any>;
  commonDiagnoses: string[];
}

export const AddHealthEventDialog = ({ 
  open, 
  onOpenChange, 
  onSubmitEvent,
  onPalpationSubmit,
  commonDiagnoses 
}: AddHealthEventDialogProps) => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(false);
  const [animalOpen, setAnimalOpen] = useState(false);
  const [eventType, setEventType] = useState<'tratamiento' | 'vacuna' | 'diagnostico' | 'palpacion'>('tratamiento');
  const [form, setForm] = useState({
    animal_id: '',
    event_date: new Date().toISOString().split('T')[0],
    diagnosis: '',
    treatment: '',
    medication: '',
    dosage: '',
    duration_days: '',
    next_dose_date: '',
    withdrawal_days: '',
    veterinarian: '',
    cost: '',
    notes: '',
  });
  
  // Palpation specific state
  const [palpationResult, setPalpationResult] = useState<'positivo' | 'negativo' | ''>('');
  const [gestationDays, setGestationDays] = useState('');

  useEffect(() => {
    const fetchAnimals = async () => {
      const { data } = await supabase
        .from('animals')
        .select('id, tag_id, name, sex')
        .eq('status', 'activo')
        .order('tag_id');
      setAnimals(data || []);
    };
    if (open) fetchAnimals();
  }, [open]);

  // Filter females for palpation
  const femaleAnimals = animals.filter(a => a.sex === 'hembra');

  const resetForm = () => {
    setForm({
      animal_id: '',
      event_date: new Date().toISOString().split('T')[0],
      diagnosis: '',
      treatment: '',
      medication: '',
      dosage: '',
      duration_days: '',
      next_dose_date: '',
      withdrawal_days: '',
      veterinarian: '',
      cost: '',
      notes: '',
    });
    setEventType('tratamiento');
    setPalpationResult('');
    setGestationDays('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.animal_id) return;

    setLoading(true);

    // Handle palpation separately
    if (eventType === 'palpacion' && onPalpationSubmit) {
      if (!palpationResult) {
        setLoading(false);
        return;
      }
      const result = await onPalpationSubmit({
        animal_id: form.animal_id,
        event_date: form.event_date,
        result: palpationResult,
        gestation_days: gestationDays ? parseInt(gestationDays) : undefined,
        veterinarian: form.veterinarian || undefined,
        notes: form.notes || undefined,
      });
      setLoading(false);
      if (result) {
        resetForm();
        onOpenChange(false);
      }
      return;
    }

    const result = await onSubmitEvent({
      animal_id: form.animal_id,
      event_type: eventType,
      event_date: form.event_date,
      diagnosis: form.diagnosis || undefined,
      treatment: form.treatment || undefined,
      medication: form.medication || undefined,
      dosage: form.dosage || undefined,
      duration_days: form.duration_days ? parseInt(form.duration_days) : undefined,
      next_dose_date: form.next_dose_date || undefined,
      withdrawal_days: form.withdrawal_days ? parseInt(form.withdrawal_days) : undefined,
      veterinarian: form.veterinarian || undefined,
      cost: form.cost ? parseFloat(form.cost) : undefined,
      notes: form.notes || undefined,
    });

    setLoading(false);
    if (result) {
      resetForm();
      onOpenChange(false);
    }
  };

  const isPalpation = eventType === 'palpacion';
  const animalsToShow = isPalpation ? femaleAnimals : animals;

  return (
    <Dialog open={open} onOpenChange={(open) => { onOpenChange(open); if (!open) resetForm(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Evento de Salud</DialogTitle>
        </DialogHeader>

        <Tabs value={eventType} onValueChange={(v) => setEventType(v as typeof eventType)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tratamiento">Tratamiento</TabsTrigger>
            <TabsTrigger value="diagnostico">Diagnóstico</TabsTrigger>
            <TabsTrigger value="vacuna">Vacuna</TabsTrigger>
            <TabsTrigger value="palpacion">Palpación</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Animal * {isPalpation && <span className="text-xs text-muted-foreground">(solo hembras)</span>}</Label>
                <Popover open={animalOpen} onOpenChange={setAnimalOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={animalOpen}
                      className="w-full justify-between font-normal"
                    >
                      {form.animal_id
                        ? (() => {
                            const a = animalsToShow.find(a => a.id === form.animal_id);
                            return a ? `${a.tag_id}${a.name ? ` - ${a.name}` : ''}` : 'Seleccionar';
                          })()
                        : 'Seleccionar'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[250px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar por arete o nombre..." />
                      <CommandList>
                        <CommandEmpty>No se encontró ningún animal.</CommandEmpty>
                        <CommandGroup>
                          {animalsToShow.map((animal) => (
                            <CommandItem
                              key={animal.id}
                              value={`${animal.tag_id} ${animal.name ?? ''}`}
                              onSelect={() => {
                                setForm({ ...form, animal_id: animal.id });
                                setAnimalOpen(false);
                              }}
                            >
                              <Check className={cn('mr-2 h-4 w-4', form.animal_id === animal.id ? 'opacity-100' : 'opacity-0')} />
                              {animal.tag_id}{animal.name && ` - ${animal.name}`}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Fecha *</Label>
                <Input
                  type="date"
                  value={form.event_date}
                  onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <TabsContent value="tratamiento" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label>Diagnóstico</Label>
                <Select value={form.diagnosis} onValueChange={(v) => setForm({ ...form, diagnosis: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar diagnóstico" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonDiagnoses.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Medicamento</Label>
                  <Input
                    placeholder="Nombre del medicamento"
                    value={form.medication}
                    onChange={(e) => setForm({ ...form, medication: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dosis</Label>
                  <Input
                    placeholder="Ej: 10ml"
                    value={form.dosage}
                    onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Duración (días)</Label>
                  <Input
                    type="number"
                    placeholder="5"
                    value={form.duration_days}
                    onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Días Retiro</Label>
                  <Input
                    type="number"
                    placeholder="7"
                    value={form.withdrawal_days}
                    onChange={(e) => setForm({ ...form, withdrawal_days: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Costo ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="50.00"
                    value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="diagnostico" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label>Diagnóstico *</Label>
                <Select value={form.diagnosis} onValueChange={(v) => setForm({ ...form, diagnosis: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar diagnóstico" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonDiagnoses.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Descripción del Diagnóstico</Label>
                <Textarea
                  placeholder="Detalles del diagnóstico..."
                  value={form.treatment}
                  onChange={(e) => setForm({ ...form, treatment: e.target.value })}
                />
              </div>
            </TabsContent>

            <TabsContent value="vacuna" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label>Vacuna Aplicada</Label>
                <Input
                  placeholder="Nombre de la vacuna"
                  value={form.medication}
                  onChange={(e) => setForm({ ...form, medication: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dosis</Label>
                  <Input
                    placeholder="Ej: 5ml"
                    value={form.dosage}
                    onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Próxima Dosis</Label>
                  <Input
                    type="date"
                    value={form.next_dose_date}
                    onChange={(e) => setForm({ ...form, next_dose_date: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Palpación */}
            <TabsContent value="palpacion" className="space-y-4 mt-0">
              <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                <h4 className="font-medium">Resultado de Palpación</h4>
                <div className="space-y-2">
                  <Label>Resultado *</Label>
                  <Select value={palpationResult} onValueChange={(v) => setPalpationResult(v as 'positivo' | 'negativo')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar resultado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="negativo">Vacía (Negativo)</SelectItem>
                      <SelectItem value="positivo">Preñada (Positivo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {palpationResult === 'positivo' && (
                  <div className="space-y-2">
                    <Label>Días de Gestación Estimados</Label>
                    <Input
                      type="number"
                      placeholder="Ej: 90"
                      value={gestationDays}
                      onChange={(e) => setGestationDays(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </TabsContent>

            <div className="space-y-2">
              <Label>Veterinario</Label>
              <Input
                placeholder="Nombre del veterinario"
                value={form.veterinarian}
                onChange={(e) => setForm({ ...form, veterinarian: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                placeholder="Observaciones adicionales..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !form.animal_id || (isPalpation && !palpationResult)}
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
