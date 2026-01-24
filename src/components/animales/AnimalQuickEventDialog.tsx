import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Scale, 
  Syringe, 
  Heart, 
  Stethoscope,
  Save,
  Loader2,
  Check,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Bull {
  id: string;
  tag_id: string;
  name: string | null;
}

interface AnimalQuickEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animalId: string;
  animalTagId: string;
  animalName?: string | null;
  onWeightRecord: (data: { weight: number; date: string; notes?: string }) => Promise<void>;
  onVaccination: (data: { vaccine: string; date: string; nextDate?: string; notes?: string }) => Promise<void>;
  onHealthEvent: (data: { type: string; diagnosis?: string; treatment?: string; date: string; notes?: string }) => Promise<void>;
  onReproductiveEvent: (data: { type: string; result?: string; date: string; notes?: string; bullId?: string; semenBatch?: string }) => Promise<void>;
}

const COMMON_VACCINES = [
  'Aftosa',
  'Brucelosis',
  'Carbón',
  'Clostridial',
  'IBR',
  'Leptospirosis',
  'Rabia',
  'Triple Bovina',
];

const HEALTH_EVENT_TYPES = [
  { value: 'tratamiento', label: 'Tratamiento' },
  { value: 'diagnostico', label: 'Diagnóstico' },
  { value: 'cirugia', label: 'Cirugía' },
  { value: 'revision', label: 'Revisión' },
];

const REPRODUCTIVE_EVENT_TYPES = [
  { value: 'celo', label: 'Celo detectado' },
  { value: 'palpacion', label: 'Palpación' },
  { value: 'servicio', label: 'Servicio/Monta' },
  { value: 'inseminacion', label: 'Inseminación' },
  { value: 'confirmacion', label: 'Confirmación preñez' },
  { value: 'secado', label: 'Secado' },
];

const PALPATION_RESULTS = [
  { value: 'vacia', label: 'Vacía' },
  { value: 'preñada', label: 'Preñada' },
  { value: 'dudosa', label: 'Dudosa' },
];

export function AnimalQuickEventDialog({
  open,
  onOpenChange,
  animalTagId,
  animalName,
  onWeightRecord,
  onVaccination,
  onHealthEvent,
  onReproductiveEvent,
}: AnimalQuickEventDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('peso');
  const [saving, setSaving] = useState(false);
  const [savedTab, setSavedTab] = useState<string | null>(null);
  const [bulls, setBulls] = useState<Bull[]>([]);
  const [loadingBulls, setLoadingBulls] = useState(false);
  
  // Fetch bulls when dialog opens
  useEffect(() => {
    const fetchBulls = async () => {
      if (!open || !user) return;
      
      setLoadingBulls(true);
      try {
        // First get user's organization
        const { data: profileData } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();
        
        if (!profileData?.organization_id) return;
        
        const { data, error } = await supabase
          .from('animals')
          .select('id, tag_id, name')
          .eq('organization_id', profileData.organization_id)
          .eq('sex', 'macho')
          .eq('status', 'activo')
          .in('category', ['toro', 'bufalo'])
          .order('tag_id');
        
        if (error) throw error;
        setBulls(data || []);
      } catch (error) {
        console.error('Error fetching bulls:', error);
      } finally {
        setLoadingBulls(false);
      }
    };
    
    fetchBulls();
  }, [open, user]);
  
  // Form states
  const [weightForm, setWeightForm] = useState({
    weight: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  
  const [vaccineForm, setVaccineForm] = useState({
    vaccine: '',
    date: new Date().toISOString().split('T')[0],
    nextDate: '',
    notes: '',
  });
  
  const [healthForm, setHealthForm] = useState({
    type: 'tratamiento',
    diagnosis: '',
    treatment: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  
  const [reproForm, setReproForm] = useState({
    type: 'palpacion',
    result: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    bullId: '',
    semenBatch: '',
  });

  const handleSaveWeight = async () => {
    if (!weightForm.weight) {
      toast({ title: 'Error', description: 'Ingresa el peso', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await onWeightRecord({
        weight: parseFloat(weightForm.weight),
        date: weightForm.date,
        notes: weightForm.notes || undefined,
      });
      setSavedTab('peso');
      setWeightForm({ weight: '', date: new Date().toISOString().split('T')[0], notes: '' });
      setTimeout(() => setSavedTab(null), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveVaccine = async () => {
    if (!vaccineForm.vaccine) {
      toast({ title: 'Error', description: 'Selecciona una vacuna', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await onVaccination({
        vaccine: vaccineForm.vaccine,
        date: vaccineForm.date,
        nextDate: vaccineForm.nextDate || undefined,
        notes: vaccineForm.notes || undefined,
      });
      setSavedTab('vacuna');
      setVaccineForm({ vaccine: '', date: new Date().toISOString().split('T')[0], nextDate: '', notes: '' });
      setTimeout(() => setSavedTab(null), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHealth = async () => {
    if (!healthForm.type) {
      toast({ title: 'Error', description: 'Selecciona el tipo de evento', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await onHealthEvent({
        type: healthForm.type,
        diagnosis: healthForm.diagnosis || undefined,
        treatment: healthForm.treatment || undefined,
        date: healthForm.date,
        notes: healthForm.notes || undefined,
      });
      setSavedTab('salud');
      setHealthForm({ type: 'tratamiento', diagnosis: '', treatment: '', date: new Date().toISOString().split('T')[0], notes: '' });
      setTimeout(() => setSavedTab(null), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRepro = async () => {
    if (!reproForm.type) {
      toast({ title: 'Error', description: 'Selecciona el tipo de evento', variant: 'destructive' });
      return;
    }
    
    // Validate bull for service
    if (reproForm.type === 'servicio' && !reproForm.bullId) {
      toast({ title: 'Error', description: 'Debes seleccionar el toro/semental', variant: 'destructive' });
      return;
    }
    
    // Validate semen batch for insemination
    if (reproForm.type === 'inseminacion' && !reproForm.semenBatch) {
      toast({ title: 'Error', description: 'Debes ingresar el lote de semen/pajilla', variant: 'destructive' });
      return;
    }
    
    setSaving(true);
    try {
      await onReproductiveEvent({
        type: reproForm.type,
        result: reproForm.result || undefined,
        date: reproForm.date,
        notes: reproForm.notes || undefined,
        bullId: reproForm.bullId || undefined,
        semenBatch: reproForm.semenBatch || undefined,
      });
      setSavedTab('reproduccion');
      setReproForm({ 
        type: 'palpacion', 
        result: '', 
        date: new Date().toISOString().split('T')[0], 
        notes: '',
        bullId: '',
        semenBatch: '',
      });
      setTimeout(() => setSavedTab(null), 2000);
    } finally {
      setSaving(false);
    }
  };

  const SaveButton = ({ onClick, tab }: { onClick: () => void; tab: string }) => (
    <Button 
      onClick={onClick} 
      disabled={saving}
      className="w-full"
      variant={savedTab === tab ? 'outline' : 'default'}
    >
      {saving ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Guardando...
        </>
      ) : savedTab === tab ? (
        <>
          <Check className="mr-2 h-4 w-4 text-green-600" />
          ¡Guardado!
        </>
      ) : (
        <>
          <Save className="mr-2 h-4 w-4" />
          Guardar
        </>
      )}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Registrar Evento - {animalTagId}
            {animalName && <span className="text-muted-foreground font-normal">({animalName})</span>}
          </DialogTitle>
          <DialogDescription>
            Registra múltiples eventos en el mismo día sin salir de esta ventana
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="peso" className="gap-2">
              <Scale className="h-4 w-4" />
              <span className="hidden sm:inline">Peso</span>
            </TabsTrigger>
            <TabsTrigger value="vacuna" className="gap-2">
              <Syringe className="h-4 w-4" />
              <span className="hidden sm:inline">Vacuna</span>
            </TabsTrigger>
            <TabsTrigger value="salud" className="gap-2">
              <Stethoscope className="h-4 w-4" />
              <span className="hidden sm:inline">Salud</span>
            </TabsTrigger>
            <TabsTrigger value="reproduccion" className="gap-2">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Repro</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Peso */}
          <TabsContent value="peso" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Peso (kg) *</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder="Ej: 450"
                  value={weightForm.weight}
                  onChange={(e) => setWeightForm(prev => ({ ...prev, weight: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weightDate">Fecha</Label>
                <Input
                  id="weightDate"
                  type="date"
                  value={weightForm.date}
                  onChange={(e) => setWeightForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weightNotes">Notas</Label>
              <Textarea
                id="weightNotes"
                placeholder="Observaciones del pesaje..."
                value={weightForm.notes}
                onChange={(e) => setWeightForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            <SaveButton onClick={handleSaveWeight} tab="peso" />
          </TabsContent>

          {/* Tab Vacuna */}
          <TabsContent value="vacuna" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vacuna *</Label>
                <Select
                  value={vaccineForm.vaccine}
                  onValueChange={(value) => setVaccineForm(prev => ({ ...prev, vaccine: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar vacuna" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_VACCINES.map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha aplicación</Label>
                <Input
                  type="date"
                  value={vaccineForm.date}
                  onChange={(e) => setVaccineForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Próxima dosis (opcional)</Label>
              <Input
                type="date"
                value={vaccineForm.nextDate}
                onChange={(e) => setVaccineForm(prev => ({ ...prev, nextDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                placeholder="Lote de vacuna, observaciones..."
                value={vaccineForm.notes}
                onChange={(e) => setVaccineForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            <SaveButton onClick={handleSaveVaccine} tab="vacuna" />
          </TabsContent>

          {/* Tab Salud */}
          <TabsContent value="salud" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de evento *</Label>
                <Select
                  value={healthForm.type}
                  onValueChange={(value) => setHealthForm(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HEALTH_EVENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={healthForm.date}
                  onChange={(e) => setHealthForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Diagnóstico</Label>
              <Input
                placeholder="Ej: Mastitis, Cojera..."
                value={healthForm.diagnosis}
                onChange={(e) => setHealthForm(prev => ({ ...prev, diagnosis: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Tratamiento aplicado</Label>
              <Input
                placeholder="Ej: Antibiótico, Antiinflamatorio..."
                value={healthForm.treatment}
                onChange={(e) => setHealthForm(prev => ({ ...prev, treatment: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                placeholder="Observaciones adicionales..."
                value={healthForm.notes}
                onChange={(e) => setHealthForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            <SaveButton onClick={handleSaveHealth} tab="salud" />
          </TabsContent>

          {/* Tab Reproducción */}
          <TabsContent value="reproduccion" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de evento *</Label>
                <Select
                  value={reproForm.type}
                  onValueChange={(value) => setReproForm(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REPRODUCTIVE_EVENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={reproForm.date}
                  onChange={(e) => setReproForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
            </div>
            {/* Campos para palpación */}
            {reproForm.type === 'palpacion' && (
              <div className="space-y-2">
                <Label>Resultado</Label>
                <Select
                  value={reproForm.result}
                  onValueChange={(value) => setReproForm(prev => ({ ...prev, result: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar resultado" />
                  </SelectTrigger>
                  <SelectContent>
                    {PALPATION_RESULTS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Campos para servicio/monta - Toro obligatorio */}
            {reproForm.type === 'servicio' && (
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg border">
                <Label className="flex items-center gap-2">
                  Toro / Semental *
                  {!reproForm.bullId && (
                    <span className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Obligatorio
                    </span>
                  )}
                </Label>
                <Select
                  value={reproForm.bullId}
                  onValueChange={(value) => setReproForm(prev => ({ ...prev, bullId: value }))}
                >
                  <SelectTrigger className={!reproForm.bullId ? 'border-destructive' : ''}>
                    <SelectValue placeholder={loadingBulls ? "Cargando toros..." : "Seleccionar toro"} />
                  </SelectTrigger>
                  <SelectContent>
                    {bulls.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No hay toros registrados
                      </div>
                    ) : (
                      bulls.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.tag_id} {b.name && `- ${b.name}`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Campos para inseminación - Lote de semen obligatorio */}
            {reproForm.type === 'inseminacion' && (
              <div className="space-y-3 p-3 bg-muted/50 rounded-lg border">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Lote de Semen / Pajilla *
                    {!reproForm.semenBatch && (
                      <span className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Obligatorio
                      </span>
                    )}
                  </Label>
                  <Input
                    value={reproForm.semenBatch}
                    onChange={(e) => setReproForm(prev => ({ ...prev, semenBatch: e.target.value }))}
                    placeholder="Ej: LOT-2024-001"
                    className={!reproForm.semenBatch ? 'border-destructive' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Toro donador (opcional)</Label>
                  <Select
                    value={reproForm.bullId}
                    onValueChange={(value) => setReproForm(prev => ({ ...prev, bullId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingBulls ? "Cargando..." : "Seleccionar toro (si aplica)"} />
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
            
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                placeholder="Observaciones del evento reproductivo..."
                value={reproForm.notes}
                onChange={(e) => setReproForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            <SaveButton onClick={handleSaveRepro} tab="reproduccion" />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
