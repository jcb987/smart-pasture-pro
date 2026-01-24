import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type AnimalCategory, type AnimalSex, type Animal } from '@/hooks/useAnimals';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CreateAnimalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (animal: Omit<Animal, 'id' | 'created_at' | 'updated_at' | 'organization_id'>) => Promise<unknown>;
  animals?: Animal[]; // Lista de animales para seleccionar madre/padre
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

export function CreateAnimalDialog({ open, onOpenChange, onSubmit, animals = [] }: CreateAnimalDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tag_id: '',
    name: '',
    category: 'vaca' as AnimalCategory,
    sex: 'hembra' as AnimalSex,
    breed: '',
    color: '',
    birth_date: '',
    entry_date: new Date().toISOString().split('T')[0],
    origin: '',
    lot_name: '',
    current_weight: '',
    notes: '',
    mother_id: '',
    father_id: '',
  });
  const [motherOpen, setMotherOpen] = useState(false);
  const [fatherOpen, setFatherOpen] = useState(false);

  // Filtrar hembras para madres y machos para padres
  const females = useMemo(() => 
    animals.filter(a => a.sex === 'hembra' && a.status === 'activo'), 
    [animals]
  );
  const males = useMemo(() => 
    animals.filter(a => a.sex === 'macho' && a.status === 'activo'), 
    [animals]
  );

  const resetForm = () => {
    setFormData({
      tag_id: '',
      name: '',
      category: 'vaca',
      sex: 'hembra',
      breed: '',
      color: '',
      birth_date: '',
      entry_date: new Date().toISOString().split('T')[0],
      origin: '',
      lot_name: '',
      current_weight: '',
      notes: '',
      mother_id: '',
      father_id: '',
    });
  };

  // Validar que madre y padre estén seleccionados
  const isGeneticsValid = formData.mother_id && formData.father_id;
  const canSubmit = formData.tag_id && isGeneticsValid;

  const getAnimalLabel = (animal: Animal) => {
    return `${animal.tag_id}${animal.name ? ` - ${animal.name}` : ''}`; 
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setLoading(true);
    const animal = {
      tag_id: formData.tag_id,
      name: formData.name || null,
      rfid_tag: null,
      category: formData.category,
      sex: formData.sex,
      breed: formData.breed || null,
      color: formData.color || null,
      birth_date: formData.birth_date || null,
      entry_date: formData.entry_date || null,
      status: 'activo' as const,
      status_date: null,
      status_reason: null,
      current_weight: formData.current_weight ? parseFloat(formData.current_weight) : null,
      last_weight_date: formData.current_weight ? new Date().toISOString().split('T')[0] : null,
      origin: formData.origin || null,
      purchase_price: null,
      purchase_date: null,
      lot_name: formData.lot_name || null,
      mother_id: formData.mother_id || null,
      father_id: formData.father_id || null,
      notes: formData.notes || null,
    };

    const result = await onSubmit(animal);
    setLoading(false);

    if (result) {
      resetForm();
      onOpenChange(false);
    }
  };

  const handleCategoryChange = (value: AnimalCategory) => {
    setFormData(prev => ({
      ...prev,
      category: value,
      sex: ['vaca', 'novilla', 'ternera', 'becerra', 'bufala'].includes(value) ? 'hembra' : 'macho',
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Animal</DialogTitle>
          <DialogDescription>
            Ingresa los datos del animal. El arete, madre y padre son obligatorios para trazabilidad genética.
          </DialogDescription>
        </DialogHeader>

        {/* Alerta de genética obligatoria */}
        {!isGeneticsValid && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Trazabilidad genética obligatoria:</strong> Debes seleccionar la madre y el padre del animal para poder registrarlo.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tag_id">Arete / ID *</Label>
            <Input
              id="tag_id"
              value={formData.tag_id}
              onChange={(e) => setFormData(prev => ({ ...prev, tag_id: e.target.value }))}
              placeholder="Ej: 001, A-123"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nombre (opcional)</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ej: Lucero"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoría *</Label>
            <Select value={formData.category} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sex">Sexo *</Label>
            <Select 
              value={formData.sex} 
              onValueChange={(value: AnimalSex) => setFormData(prev => ({ ...prev, sex: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hembra">Hembra</SelectItem>
                <SelectItem value="macho">Macho</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="breed">Raza</Label>
            <Input
              id="breed"
              value={formData.breed}
              onChange={(e) => setFormData(prev => ({ ...prev, breed: e.target.value }))}
              placeholder="Ej: Holstein, Brahman"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <Input
              id="color"
              value={formData.color}
              onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
              placeholder="Ej: Negro, Pinto"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birth_date">Fecha de Nacimiento</Label>
            <Input
              id="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="entry_date">Fecha de Ingreso</Label>
            <Input
              id="entry_date"
              type="date"
              value={formData.entry_date}
              onChange={(e) => setFormData(prev => ({ ...prev, entry_date: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="current_weight">Peso Actual (kg)</Label>
            <Input
              id="current_weight"
              type="number"
              value={formData.current_weight}
              onChange={(e) => setFormData(prev => ({ ...prev, current_weight: e.target.value }))}
              placeholder="Ej: 450"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lot_name">Lote / Potrero</Label>
            <Input
              id="lot_name"
              value={formData.lot_name}
              onChange={(e) => setFormData(prev => ({ ...prev, lot_name: e.target.value }))}
              placeholder="Ej: Potrero 1"
            />
          </div>

          {/* SECCIÓN DE GENÉTICA OBLIGATORIA */}
          <div className="col-span-2 border-t pt-4 mt-2">
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              🧬 Genética (Obligatorio)
            </h4>
          </div>

          {/* Madre */}
          <div className="space-y-2">
            <Label>Madre *</Label>
            <Popover open={motherOpen} onOpenChange={setMotherOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={motherOpen}
                  className={cn(
                    "w-full justify-between",
                    !formData.mother_id && "text-muted-foreground"
                  )}
                >
                  {formData.mother_id
                    ? getAnimalLabel(females.find(f => f.id === formData.mother_id)!)
                    : "Seleccionar madre..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Buscar madre..." />
                  <CommandList>
                    <CommandEmpty>No se encontraron hembras.</CommandEmpty>
                    <CommandGroup>
                      {females.map((animal) => (
                        <CommandItem
                          key={animal.id}
                          value={animal.tag_id}
                          onSelect={() => {
                            setFormData(prev => ({ ...prev, mother_id: animal.id }));
                            setMotherOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.mother_id === animal.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {getAnimalLabel(animal)}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Padre */}
          <div className="space-y-2">
            <Label>Padre / Semental *</Label>
            <Popover open={fatherOpen} onOpenChange={setFatherOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={fatherOpen}
                  className={cn(
                    "w-full justify-between",
                    !formData.father_id && "text-muted-foreground"
                  )}
                >
                  {formData.father_id
                    ? getAnimalLabel(males.find(m => m.id === formData.father_id)!)
                    : "Seleccionar padre..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Buscar padre..." />
                  <CommandList>
                    <CommandEmpty>No se encontraron machos.</CommandEmpty>
                    <CommandGroup>
                      {males.map((animal) => (
                        <CommandItem
                          key={animal.id}
                          value={animal.tag_id}
                          onSelect={() => {
                            setFormData(prev => ({ ...prev, father_id: animal.id }));
                            setFatherOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.father_id === animal.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {getAnimalLabel(animal)}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="col-span-2 border-t pt-4 mt-2" />

          <div className="space-y-2 col-span-2">
            <Label htmlFor="origin">Origen</Label>
            <Input
              id="origin"
              value={formData.origin}
              onChange={(e) => setFormData(prev => ({ ...prev, origin: e.target.value }))}
              placeholder="Ej: Nacido en finca, Comprado en feria"
            />
          </div>

          <div className="space-y-2 col-span-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Observaciones adicionales..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !canSubmit}>
            {loading ? 'Guardando...' : 'Registrar Animal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
