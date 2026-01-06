import { useState } from 'react';
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
import { type Animal } from '@/hooks/useAnimals';

interface AddWeightDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animal: Animal | null;
  onSubmit: (animalId: string, weight: number, date: string, notes: string) => Promise<void>;
}

export function AddWeightDialog({ open, onOpenChange, animal, onSubmit }: AddWeightDialogProps) {
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!animal || !weight) return;

    setLoading(true);
    await onSubmit(animal.id, parseFloat(weight), date, notes);
    setLoading(false);
    setWeight('');
    setNotes('');
    onOpenChange(false);
  };

  if (!animal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Peso</DialogTitle>
          <DialogDescription>
            Registrar nuevo peso para {animal.name || animal.tag_id}
            {animal.current_weight && (
              <span className="block mt-1">
                Peso anterior: <strong>{animal.current_weight} kg</strong>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="weight">Peso (kg) *</Label>
            <Input
              id="weight"
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Ej: 450"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Fecha</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones del pesaje..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !weight}>
            {loading ? 'Guardando...' : 'Registrar Peso'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
