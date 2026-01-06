import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';

interface Animal {
  id: string;
  tag_id: string;
  name: string | null;
}

interface AddHealthEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitEvent: (event: {
    animal_id: string;
    event_type: 'tratamiento' | 'vacuna' | 'diagnostico';
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
  commonDiagnoses: string[];
}

export const AddHealthEventDialog = ({ 
  open, 
  onOpenChange, 
  onSubmitEvent,
  commonDiagnoses 
}: AddHealthEventDialogProps) => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(false);
  const [eventType, setEventType] = useState<'tratamiento' | 'vacuna' | 'diagnostico'>('tratamiento');
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

  useEffect(() => {
    const fetchAnimals = async () => {
      const { data } = await supabase
        .from('animals')
        .select('id, tag_id, name')
        .eq('status', 'activo')
        .order('tag_id');
      setAnimals(data || []);
    };
    if (open) fetchAnimals();
  }, [open]);

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.animal_id) return;

    setLoading(true);
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

  return (
    <Dialog open={open} onOpenChange={(open) => { onOpenChange(open); if (!open) resetForm(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Evento de Salud</DialogTitle>
        </DialogHeader>

        <Tabs value={eventType} onValueChange={(v) => setEventType(v as typeof eventType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tratamiento">Tratamiento</TabsTrigger>
            <TabsTrigger value="diagnostico">Diagnóstico</TabsTrigger>
            <TabsTrigger value="vacuna">Vacuna</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Animal *</Label>
                <Select value={form.animal_id} onValueChange={(v) => setForm({ ...form, animal_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
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
              <Button type="submit" disabled={loading || !form.animal_id}>
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
