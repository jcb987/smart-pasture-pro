import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FemaleAnimal } from '@/hooks/useReproduction';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  females: FemaleAnimal[];
  bulls: { id: string; tag_id: string; name?: string }[];
  onSubmit: (event: {
    animal_id: string;
    event_type: 'celo' | 'servicio' | 'inseminacion' | 'palpacion' | 'parto' | 'aborto' | 'secado';
    event_date: string;
    bull_id?: string;
    semen_batch?: string;
    technician?: string;
    pregnancy_result?: 'positivo' | 'negativo' | 'dudoso';
    estimated_gestation_days?: number;
    birth_type?: 'normal' | 'distocico' | 'cesarea' | 'gemelar';
    calf_sex?: 'macho' | 'hembra';
    calf_weight?: number;
    notes?: string;
  }) => void;
  defaultAnimalId?: string;
  defaultEventType?: string;
}

const eventTypeLabels: Record<string, string> = {
  celo: 'Celo Detectado',
  servicio: 'Servicio (Monta Natural)',
  inseminacion: 'Inseminación Artificial',
  palpacion: 'Palpación / Diagnóstico',
  parto: 'Parto',
  aborto: 'Aborto',
  secado: 'Secado',
};

export const RegisterEventDialog = ({ 
  open, 
  onOpenChange, 
  females, 
  bulls, 
  onSubmit,
  defaultAnimalId,
  defaultEventType,
}: Props) => {
  const [animalId, setAnimalId] = useState(defaultAnimalId || '');
  const [eventType, setEventType] = useState(defaultEventType || '');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [bullId, setBullId] = useState('');
  const [semenBatch, setSemenBatch] = useState('');
  const [technician, setTechnician] = useState('');
  const [pregnancyResult, setPregnancyResult] = useState('');
  const [gestationDays, setGestationDays] = useState('');
  const [birthType, setBirthType] = useState('');
  const [calfSex, setCalfSex] = useState('');
  const [calfWeight, setCalfWeight] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (!animalId || !eventType || !eventDate) return;

    onSubmit({
      animal_id: animalId,
      event_type: eventType as 'celo' | 'servicio' | 'inseminacion' | 'palpacion' | 'parto' | 'aborto' | 'secado',
      event_date: eventDate,
      bull_id: bullId || undefined,
      semen_batch: semenBatch || undefined,
      technician: technician || undefined,
      pregnancy_result: pregnancyResult as 'positivo' | 'negativo' | 'dudoso' | undefined,
      estimated_gestation_days: gestationDays ? parseInt(gestationDays) : undefined,
      birth_type: birthType as 'normal' | 'distocico' | 'cesarea' | 'gemelar' | undefined,
      calf_sex: calfSex as 'macho' | 'hembra' | undefined,
      calf_weight: calfWeight ? parseFloat(calfWeight) : undefined,
      notes: notes || undefined,
    });

    // Reset form
    setAnimalId('');
    setEventType('');
    setBullId('');
    setSemenBatch('');
    setTechnician('');
    setPregnancyResult('');
    setGestationDays('');
    setBirthType('');
    setCalfSex('');
    setCalfWeight('');
    setNotes('');
    onOpenChange(false);
  };

  const showServiceFields = eventType === 'servicio';
  const showInseminationFields = eventType === 'inseminacion';
  const showPalpationFields = eventType === 'palpacion';
  const showBirthFields = eventType === 'parto';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Evento Reproductivo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Animal *</Label>
              <Select value={animalId} onValueChange={setAnimalId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {females.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.tag_id} {f.name && `- ${f.name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Evento *</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(eventTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Fecha del Evento *</Label>
            <Input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>

          {/* Campos para Servicio */}
          {showServiceFields && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium">Datos del Servicio</h4>
              <div className="space-y-2">
                <Label>Toro</Label>
                <Select value={bullId} onValueChange={setBullId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar toro" />
                  </SelectTrigger>
                  <SelectContent>
                    {bulls.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.tag_id} {b.name && `- ${b.name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Campos para Inseminación */}
          {showInseminationFields && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium">Datos de Inseminación</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Lote de Semen</Label>
                  <Input
                    value={semenBatch}
                    onChange={(e) => setSemenBatch(e.target.value)}
                    placeholder="Ej: LOT-2024-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Técnico Inseminador</Label>
                  <Input
                    value={technician}
                    onChange={(e) => setTechnician(e.target.value)}
                    placeholder="Nombre del técnico"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Campos para Palpación */}
          {showPalpationFields && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium">Resultado de Palpación</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Resultado *</Label>
                  <Select value={pregnancyResult} onValueChange={setPregnancyResult}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="positivo">Positivo (Preñada)</SelectItem>
                      <SelectItem value="negativo">Negativo (Vacía)</SelectItem>
                      <SelectItem value="dudoso">Dudoso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {pregnancyResult === 'positivo' && (
                  <div className="space-y-2">
                    <Label>Días de Gestación Estimados</Label>
                    <Input
                      type="number"
                      value={gestationDays}
                      onChange={(e) => setGestationDays(e.target.value)}
                      placeholder="Ej: 90"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Campos para Parto */}
          {showBirthFields && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium">Datos del Parto</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Parto</Label>
                  <Select value={birthType} onValueChange={setBirthType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="distocico">Distócico</SelectItem>
                      <SelectItem value="cesarea">Cesárea</SelectItem>
                      <SelectItem value="gemelar">Gemelar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sexo de la Cría</Label>
                  <Select value={calfSex} onValueChange={setCalfSex}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="macho">Macho</SelectItem>
                      <SelectItem value="hembra">Hembra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Peso al Nacer (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={calfWeight}
                    onChange={(e) => setCalfWeight(e.target.value)}
                    placeholder="Ej: 35"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones adicionales..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!animalId || !eventType}>
            Registrar Evento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
