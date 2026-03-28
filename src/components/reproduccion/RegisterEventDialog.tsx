import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { FemaleAnimal } from '@/hooks/useReproduction';
import { Badge } from '@/components/ui/badge';
import { useTerminology } from '@/hooks/useTerminology';

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
    // New fields for calf creation
    create_calf?: boolean;
    calf_tag_id?: string;
    calf_name?: string;
    father_id?: string;
  }) => void;
  defaultAnimalId?: string;
  defaultEventType?: string;
}

export const RegisterEventDialog = ({ 
  open, 
  onOpenChange, 
  females, 
  bulls, 
  onSubmit,
  defaultAnimalId,
  defaultEventType,
}: Props) => {
  const { t } = useTerminology();

  const eventTypeLabels: Record<string, string> = {
    celo: t('celo'),
    servicio: t('servicio'),
    inseminacion: 'Inseminación Artificial',
    palpacion: t('palpacion'),
    parto: 'Parto',
    aborto: 'Aborto',
    secado: t('secado'),
  };

  const [animalId, setAnimalId] = useState(defaultAnimalId || '');
  const [eventType, setEventType] = useState(defaultEventType || '');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [bullId, setBullId] = useState('');
  const [fatherId, setFatherId] = useState('');
  const [semenBatch, setSemenBatch] = useState('');
  const [technician, setTechnician] = useState('');
  const [pregnancyResult, setPregnancyResult] = useState('');
  const [gestationDays, setGestationDays] = useState('');
  const [birthType, setBirthType] = useState('');
  const [calfSex, setCalfSex] = useState('');
  const [calfWeight, setCalfWeight] = useState('');
  const [notes, setNotes] = useState('');
  
  // New fields for calf creation
  const [createCalf, setCreateCalf] = useState(true);
  const [calfTagId, setCalfTagId] = useState('');
  const [calfName, setCalfName] = useState('');

  // Reset fields when dialog opens/closes
  useEffect(() => {
    if (open) {
      setAnimalId(defaultAnimalId || '');
      setEventType(defaultEventType || '');
    }
  }, [open, defaultAnimalId, defaultEventType]);

  const handleSubmit = () => {
    if (!animalId || !eventType || !eventDate) return;

    // Validate service fields - require bull
    if (eventType === 'servicio' && !bullId) return;

    // Validate insemination fields - require semen batch
    if (eventType === 'inseminacion' && !semenBatch) return;

    // Validate birth fields - require father
    if (eventType === 'parto') {
      if (!birthType || !calfSex || !fatherId) return;
      if (createCalf && !calfTagId) return;
    }

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
      // New fields
      create_calf: createCalf,
      calf_tag_id: calfTagId || undefined,
      calf_name: calfName || undefined,
      father_id: fatherId || bullId || undefined,
    });

    // Reset form
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setAnimalId('');
    setEventType('');
    setBullId('');
    setFatherId('');
    setSemenBatch('');
    setTechnician('');
    setPregnancyResult('');
    setGestationDays('');
    setBirthType('');
    setCalfSex('');
    setCalfWeight('');
    setNotes('');
    setCreateCalf(true);
    setCalfTagId('');
    setCalfName('');
  };

  const showServiceFields = eventType === 'servicio';
  const showInseminationFields = eventType === 'inseminacion';
  const showPalpationFields = eventType === 'palpacion';
  const showBirthFields = eventType === 'parto';

  // Get selected mother info
  const selectedMother = females.find(f => f.id === animalId);

  return (
    <Dialog open={open} onOpenChange={(open) => { onOpenChange(open); if (!open) resetForm(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Evento Reproductivo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{showBirthFields ? 'Madre *' : 'Animal *'}</Label>
              <Select value={animalId} onValueChange={setAnimalId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {females.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.tag_id}{f.name && isNaN(Number(f.name)) ? ` - ${f.name}` : ''}
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
              <h4 className="font-medium">{t('servicio')}</h4>
              <div className="space-y-2">
                <Label>Toro / Semental *</Label>
                <Select value={bullId} onValueChange={setBullId}>
                  <SelectTrigger className={!bullId ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Seleccionar toro (obligatorio)" />
                  </SelectTrigger>
                  <SelectContent>
                    {bulls.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.tag_id} {b.name && `- ${b.name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!bullId && <p className="text-xs text-destructive">Debes seleccionar el toro para trazabilidad genética</p>}
              </div>
            </div>
          )}

          {/* Campos para Inseminación */}
          {showInseminationFields && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium">Datos de Inseminación</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Lote de Semen / Pajilla *</Label>
                  <Input
                    value={semenBatch}
                    onChange={(e) => setSemenBatch(e.target.value)}
                    placeholder="Ej: LOT-2024-001"
                    className={!semenBatch ? 'border-destructive' : ''}
                  />
                  {!semenBatch && <p className="text-xs text-destructive">Obligatorio para trazabilidad</p>}
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
              <h4 className="font-medium">{t('palpacion')}</h4>
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
              <div className="space-y-2">
                <Label>Veterinario</Label>
                <Input
                  value={technician}
                  onChange={(e) => setTechnician(e.target.value)}
                  placeholder="Nombre del veterinario"
                />
              </div>
            </div>
          )}

          {/* Campos para Parto - MEJORADO */}
          {showBirthFields && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Datos del Parto</h4>
                {selectedMother && (
                  <Badge variant="outline">
                    Madre: {selectedMother.tag_id}
                  </Badge>
                )}
              </div>
              
              {/* Padre */}
              <div className="space-y-2">
                <Label>Padre / Semental *</Label>
                <Select value={fatherId} onValueChange={setFatherId}>
                  <SelectTrigger className={!fatherId ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Seleccionar padre (obligatorio)" />
                  </SelectTrigger>
                  <SelectContent>
                    {bulls.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.tag_id} {b.name && `- ${b.name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!fatherId && <p className="text-xs text-destructive">El padre es obligatorio para trazabilidad genética</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Parto *</Label>
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
                  <Label>Sexo de la Cría *</Label>
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

              {/* Crear cría automáticamente */}
              <div className="pt-2 border-t space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="create-calf" 
                    checked={createCalf} 
                    onCheckedChange={(checked) => setCreateCalf(checked as boolean)} 
                  />
                  <label 
                    htmlFor="create-calf" 
                    className="text-sm font-medium cursor-pointer"
                  >
                    Crear registro de la cría automáticamente
                  </label>
                </div>

                {createCalf && (
                  <div className="grid grid-cols-2 gap-4 pl-6">
                    <div className="space-y-2">
                      <Label>Arete de la Cría *</Label>
                      <Input
                        value={calfTagId}
                        onChange={(e) => setCalfTagId(e.target.value)}
                        placeholder="Ej: 2024-001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nombre (opcional)</Label>
                      <Input
                        value={calfName}
                        onChange={(e) => setCalfName(e.target.value)}
                        placeholder="Nombre de la cría"
                      />
                    </div>
                  </div>
                )}
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
          <Button 
            onClick={handleSubmit} 
            disabled={
              !animalId || 
              !eventType || 
              (showServiceFields && !bullId) ||
              (showInseminationFields && !semenBatch) ||
              (showBirthFields && (!birthType || !calfSex || !fatherId)) ||
              (showBirthFields && createCalf && !calfTagId)
            }
          >
            Registrar Evento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
