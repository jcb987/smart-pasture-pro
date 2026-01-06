import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface Animal {
  id: string;
  tag_id: string;
  name: string | null;
  current_weight: number | null;
}

interface AddWeightRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (record: {
    animal_id: string;
    weight_date: string;
    weight_kg: number;
    weight_type?: string;
    condition_score?: number;
    notes?: string;
  }) => Promise<any>;
}

export const AddWeightRecordDialog = ({ open, onOpenChange, onSubmit }: AddWeightRecordDialogProps) => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [form, setForm] = useState({
    animal_id: '',
    weight_date: new Date().toISOString().split('T')[0],
    weight_kg: '',
    weight_type: 'manual',
    condition_score: '',
    notes: '',
  });

  useEffect(() => {
    const fetchAnimals = async () => {
      const { data } = await supabase
        .from('animals')
        .select('id, tag_id, name, current_weight')
        .eq('status', 'activo')
        .order('tag_id');
      setAnimals(data || []);
    };
    if (open) fetchAnimals();
  }, [open]);

  const handleAnimalChange = (animalId: string) => {
    const animal = animals.find(a => a.id === animalId);
    setSelectedAnimal(animal || null);
    setForm({ ...form, animal_id: animalId });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.animal_id || !form.weight_kg) return;

    setLoading(true);
    const result = await onSubmit({
      animal_id: form.animal_id,
      weight_date: form.weight_date,
      weight_kg: parseFloat(form.weight_kg),
      weight_type: form.weight_type,
      condition_score: form.condition_score ? parseFloat(form.condition_score) : undefined,
      notes: form.notes || undefined,
    });

    setLoading(false);
    if (result) {
      setForm({
        animal_id: '',
        weight_date: new Date().toISOString().split('T')[0],
        weight_kg: '',
        weight_type: 'manual',
        condition_score: '',
        notes: '',
      });
      setSelectedAnimal(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Peso</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Animal *</Label>
            <Select value={form.animal_id} onValueChange={handleAnimalChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar animal" />
              </SelectTrigger>
              <SelectContent>
                {animals.map((animal) => (
                  <SelectItem key={animal.id} value={animal.id}>
                    {animal.tag_id} {animal.name && `- ${animal.name}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedAnimal?.current_weight && (
              <p className="text-sm text-muted-foreground">
                Peso anterior: {selectedAnimal.current_weight} kg
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha *</Label>
              <Input
                type="date"
                value={form.weight_date}
                onChange={(e) => setForm({ ...form, weight_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Peso (kg) *</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="450"
                value={form.weight_kg}
                onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Pesaje</Label>
              <Select value={form.weight_type} onValueChange={(v) => setForm({ ...form, weight_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="bascula">Báscula</SelectItem>
                  <SelectItem value="estimado">Estimado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Condición Corporal (1-5)</Label>
              <Input
                type="number"
                step="0.5"
                min="1"
                max="5"
                placeholder="3.0"
                value={form.condition_score}
                onChange={(e) => setForm({ ...form, condition_score: e.target.value })}
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
            <Button type="submit" disabled={loading || !form.animal_id || !form.weight_kg}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
