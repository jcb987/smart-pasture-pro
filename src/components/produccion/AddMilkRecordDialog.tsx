import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, ChevronsUpDown, Check, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Animal {
  id: string;
  tag_id: string;
  name: string | null;
}

interface AddMilkRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (record: {
    animal_id: string;
    production_date: string;
    morning_liters?: number;
    afternoon_liters?: number;
    evening_liters?: number;
    fat_percentage?: number;
    protein_percentage?: number;
    somatic_cell_count?: number;
    notes?: string;
    animal_tag_id?: string;
    animal_name?: string | null;
  }) => Promise<any>;
}

export const AddMilkRecordDialog = ({ open, onOpenChange, onSubmit }: AddMilkRecordDialogProps) => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAnimals, setLoadingAnimals] = useState(false);
  const [animalsError, setAnimalsError] = useState<string | null>(null);
  const [animalPopoverOpen, setAnimalPopoverOpen] = useState(false);
  const { toast } = useToast();
  const [form, setForm] = useState({
    animal_id: '',
    production_date: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })(),
    morning_liters: '',
    afternoon_liters: '',
    evening_liters: '',
    fat_percentage: '',
    protein_percentage: '',
    somatic_cell_count: '',
    notes: '',
  });

  useEffect(() => {
    const fetchAnimals = async () => {
      setLoadingAnimals(true);
      setAnimalsError(null);
      try {
        const { data, error } = await supabase
          .from('animals')
          .select('id, tag_id, name')
          .eq('sex', 'hembra')
          .eq('status', 'activo')
          .order('tag_id');
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
          setAnimalsError('No hay animales hembra activos registrados. Primero registra animales en el módulo de Animales.');
          setAnimals([]);
        } else {
          setAnimals(data);
        }
      } catch (error) {
        console.error('Error fetching animals:', error);
        setAnimalsError('No se pudieron cargar los animales. Verifica tu conexión.');
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los animales para el registro',
          variant: 'destructive',
        });
      } finally {
        setLoadingAnimals(false);
      }
    };
    if (open) fetchAnimals();
  }, [open, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.animal_id) return;

    setLoading(true);
    const selectedAnimal = animals.find(a => a.id === form.animal_id);
    const result = await onSubmit({
      animal_id: form.animal_id,
      production_date: form.production_date,
      morning_liters: form.morning_liters ? parseFloat(form.morning_liters) : undefined,
      afternoon_liters: form.afternoon_liters ? parseFloat(form.afternoon_liters) : undefined,
      evening_liters: form.evening_liters ? parseFloat(form.evening_liters) : undefined,
      fat_percentage: form.fat_percentage ? parseFloat(form.fat_percentage) : undefined,
      protein_percentage: form.protein_percentage ? parseFloat(form.protein_percentage) : undefined,
      somatic_cell_count: form.somatic_cell_count ? parseInt(form.somatic_cell_count) : undefined,
      notes: form.notes || undefined,
      animal_tag_id: selectedAnimal?.tag_id,
      animal_name: selectedAnimal?.name,
    });

    setLoading(false);
    if (result) {
      setForm({
        animal_id: '',
        production_date: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })(),
        morning_liters: '',
        afternoon_liters: '',
        evening_liters: '',
        fat_percentage: '',
        protein_percentage: '',
        somatic_cell_count: '',
        notes: '',
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Producción de Leche</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Animal *</Label>
            {loadingAnimals ? (
              <div className="flex items-center gap-2 p-3 border rounded-md text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando animales...
              </div>
            ) : animalsError ? (
              <div className="flex items-center gap-2 p-3 border border-destructive/50 rounded-md text-sm text-destructive bg-destructive/5">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {animalsError}
              </div>
            ) : (
              <Popover open={animalPopoverOpen} onOpenChange={setAnimalPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={animalPopoverOpen} className="w-full justify-between font-normal">
                    {form.animal_id
                      ? (() => { const a = animals.find(a => a.id === form.animal_id); return a ? `${a.tag_id}${a.name ? ` - ${a.name}` : ''}` : 'Seleccionar animal'; })()
                      : 'Seleccionar animal'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-50 bg-popover" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar animal..." />
                    <CommandList>
                      <CommandEmpty>No se encontró animal.</CommandEmpty>
                      <CommandGroup>
                        {animals.map((animal) => (
                          <CommandItem
                            key={animal.id}
                            value={`${animal.tag_id} ${animal.name || ''}`}
                            onSelect={() => {
                              setForm({ ...form, animal_id: animal.id });
                              setAnimalPopoverOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", form.animal_id === animal.id ? "opacity-100" : "opacity-0")} />
                            {animal.tag_id} {animal.name && `- ${animal.name}`}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          </div>

          <div className="space-y-2">
            <Label>Fecha *</Label>
            <Input
              type="date"
              value={form.production_date}
              onChange={(e) => setForm({ ...form, production_date: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-2">
              <Label>Mañana (L)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="0.0"
                value={form.morning_liters}
                onChange={(e) => setForm({ ...form, morning_liters: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tarde (L)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="0.0"
                value={form.afternoon_liters}
                onChange={(e) => setForm({ ...form, afternoon_liters: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Noche (L)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="0.0"
                value={form.evening_liters}
                onChange={(e) => setForm({ ...form, evening_liters: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-2">
              <Label>Grasa (%)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="3.5"
                value={form.fat_percentage}
                onChange={(e) => setForm({ ...form, fat_percentage: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Proteína (%)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="3.2"
                value={form.protein_percentage}
                onChange={(e) => setForm({ ...form, protein_percentage: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>CCS</Label>
              <Input
                type="number"
                placeholder="150000"
                value={form.somatic_cell_count}
                onChange={(e) => setForm({ ...form, somatic_cell_count: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              placeholder="Observaciones..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !form.animal_id || loadingAnimals || !!animalsError}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
