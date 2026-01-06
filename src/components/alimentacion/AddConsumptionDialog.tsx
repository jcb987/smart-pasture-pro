import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FeedItem } from '@/hooks/useFeeding';
import { supabase } from '@/integrations/supabase/client';

interface Animal {
  id: string;
  tag_id: string;
  name: string | null;
  lot_name: string | null;
}

interface AddConsumptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (record: {
    feed_id: string;
    consumption_date: string;
    quantity_kg: number;
    animal_id?: string;
    lot_name?: string;
    notes?: string;
  }) => Promise<any>;
  feedItems: FeedItem[];
}

export const AddConsumptionDialog = ({ open, onOpenChange, onSubmit, feedItems }: AddConsumptionDialogProps) => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [lots, setLots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [targetType, setTargetType] = useState<'animal' | 'lot'>('lot');
  const [form, setForm] = useState({
    feed_id: '',
    consumption_date: new Date().toISOString().split('T')[0],
    quantity_kg: '',
    animal_id: '',
    lot_name: '',
    notes: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('animals')
        .select('id, tag_id, name, lot_name')
        .eq('status', 'activo')
        .order('tag_id');

      setAnimals(data || []);
      const uniqueLots = [...new Set((data || []).map(a => a.lot_name).filter(Boolean))] as string[];
      setLots(uniqueLots);
    };
    if (open) fetchData();
  }, [open]);

  const resetForm = () => {
    setForm({
      feed_id: '',
      consumption_date: new Date().toISOString().split('T')[0],
      quantity_kg: '',
      animal_id: '',
      lot_name: '',
      notes: '',
    });
    setTargetType('lot');
  };

  const selectedFeed = feedItems.find(f => f.id === form.feed_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.feed_id || !form.quantity_kg) return;

    setLoading(true);
    const result = await onSubmit({
      feed_id: form.feed_id,
      consumption_date: form.consumption_date,
      quantity_kg: parseFloat(form.quantity_kg),
      animal_id: targetType === 'animal' ? form.animal_id : undefined,
      lot_name: targetType === 'lot' ? form.lot_name : undefined,
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
          <DialogTitle>Registrar Consumo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Alimento *</Label>
            <Select value={form.feed_id} onValueChange={(v) => setForm({ ...form, feed_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar alimento" />
              </SelectTrigger>
              <SelectContent>
                {feedItems.map((feed) => (
                  <SelectItem key={feed.id} value={feed.id}>
                    {feed.name} ({feed.current_stock} {feed.unit} disponibles)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedFeed && selectedFeed.unit_cost && (
              <p className="text-xs text-muted-foreground">
                Costo: ${selectedFeed.unit_cost}/{selectedFeed.unit}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha *</Label>
              <Input
                type="date"
                value={form.consumption_date}
                onChange={(e) => setForm({ ...form, consumption_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Cantidad ({selectedFeed?.unit || 'kg'}) *</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="0"
                value={form.quantity_kg}
                onChange={(e) => setForm({ ...form, quantity_kg: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Aplicar a</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={targetType === 'lot' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTargetType('lot')}
              >
                Por Lote
              </Button>
              <Button
                type="button"
                variant={targetType === 'animal' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTargetType('animal')}
              >
                Animal Individual
              </Button>
            </div>
          </div>

          {targetType === 'lot' ? (
            <div className="space-y-2">
              <Label>Lote</Label>
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
          ) : (
            <div className="space-y-2">
              <Label>Animal</Label>
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
          )}

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              placeholder="Observaciones..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          {selectedFeed && form.quantity_kg && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Costo estimado:</strong> $
                {((selectedFeed.unit_cost || 0) * parseFloat(form.quantity_kg)).toFixed(2)}
              </p>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !form.feed_id || !form.quantity_kg}>
              {loading ? 'Guardando...' : 'Registrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
