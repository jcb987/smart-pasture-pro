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
}

interface AddVaccinationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (vaccination: {
    animal_id?: string;
    lot_name?: string;
    vaccine_name: string;
    scheduled_date: string;
    notes?: string;
  }) => Promise<any>;
  commonVaccines: string[];
}

export const AddVaccinationDialog = ({ 
  open, 
  onOpenChange, 
  onSubmit,
  commonVaccines 
}: AddVaccinationDialogProps) => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [lots, setLots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [targetType, setTargetType] = useState<'animal' | 'lot'>('animal');
  const [form, setForm] = useState({
    animal_id: '',
    lot_name: '',
    vaccine_name: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: animalsData } = await supabase
        .from('animals')
        .select('id, tag_id, name, lot_name')
        .eq('status', 'activo')
        .order('tag_id');
      
      setAnimals(animalsData || []);
      
      // Extract unique lots
      const uniqueLots = [...new Set(
        (animalsData || [])
          .map(a => a.lot_name)
          .filter(Boolean)
      )] as string[];
      setLots(uniqueLots);
    };
    if (open) fetchData();
  }, [open]);

  const resetForm = () => {
    setForm({
      animal_id: '',
      lot_name: '',
      vaccine_name: '',
      scheduled_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setTargetType('animal');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vaccine_name || (!form.animal_id && !form.lot_name)) return;

    setLoading(true);
    const result = await onSubmit({
      animal_id: targetType === 'animal' ? form.animal_id : undefined,
      lot_name: targetType === 'lot' ? form.lot_name : undefined,
      vaccine_name: form.vaccine_name,
      scheduled_date: form.scheduled_date,
      notes: form.notes || undefined,
    });

    setLoading(false);
    if (result) {
      resetForm();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { onOpenChange(open); if (!open) resetForm(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Programar Vacunación</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Aplicar a</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={targetType === 'animal' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTargetType('animal')}
              >
                Animal Individual
              </Button>
              <Button
                type="button"
                variant={targetType === 'lot' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTargetType('lot')}
              >
                Por Lote
              </Button>
            </div>
          </div>

          {targetType === 'animal' ? (
            <div className="space-y-2">
              <Label>Animal *</Label>
              <Select value={form.animal_id} onValueChange={(v) => setForm({ ...form, animal_id: v })}>
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
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Lote *</Label>
              <Select value={form.lot_name} onValueChange={(v) => setForm({ ...form, lot_name: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar lote" />
                </SelectTrigger>
                <SelectContent>
                  {lots.map((lot) => (
                    <SelectItem key={lot} value={lot}>{lot}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Vacuna *</Label>
            <Select value={form.vaccine_name} onValueChange={(v) => setForm({ ...form, vaccine_name: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar vacuna" />
              </SelectTrigger>
              <SelectContent>
                {commonVaccines.map((v) => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fecha Programada *</Label>
            <Input
              type="date"
              value={form.scheduled_date}
              onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
              required
            />
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
            <Button 
              type="submit" 
              disabled={loading || !form.vaccine_name || (targetType === 'animal' ? !form.animal_id : !form.lot_name)}
            >
              {loading ? 'Guardando...' : 'Programar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
