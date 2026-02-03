import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
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
  AlertCircle,
  Lightbulb,
  Sparkles,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { EventAISuggestionsPanel } from './EventAISuggestionsPanel';
import { AIEventContext } from '@/hooks/useEventAISuggestions';

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
  animalSex?: string;
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

// Clasificación productiva / destino del animal
const PRODUCTIVE_CLASSIFICATIONS = [
  { value: '', label: 'Sin clasificación' },
  { value: 'candidato_venta', label: 'Candidato para venta' },
  { value: 'candidato_descarte', label: 'Candidato para descarte' },
  { value: 'animal_reemplazo', label: 'Animal de reemplazo' },
  { value: 'animal_elite', label: 'Animal élite / conservar' },
  { value: 'enviar_ceba', label: 'Enviar a ceba / engorde' },
  { value: 'enviar_sacrificio', label: 'Enviar a sacrificio' },
  { value: 'en_observacion', label: 'En observación (definir más adelante)' },
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

// Hallazgos de ovarios para palpación "Vacía"
const OVARY_FINDINGS = [
  { id: 'foliculo_izq', label: 'Folículo – ovario izquierdo' },
  { id: 'foliculo_der', label: 'Folículo – ovario derecho' },
  { id: 'cl_izq', label: 'Cuerpo lúteo (CL) – ovario izquierdo' },
  { id: 'cl_der', label: 'Cuerpo lúteo (CL) – ovario derecho' },
  { id: 'cl_foliculo', label: 'CL + folículo (actividad ovárica mixta)' },
  { id: 'multiples_foliculos', label: 'Múltiples folículos (ovarios activos)' },
  { id: 'ovarios_inactivos', label: 'Ovarios inactivos (seca / anestro / sin tejido)' },
  { id: 'quiste_ovarico', label: 'Quiste ovárico' },
  { id: 'quiste_folicular', label: 'Quiste folicular' },
  { id: 'quiste_luteal', label: 'Quiste luteal' },
  { id: 'ovario_unico', label: 'Ovario único palpable' },
];

// Hallazgos de útero para palpación "Vacía"
const UTERUS_FINDINGS = [
  { id: 'utero_normal', label: 'Útero normal' },
  { id: 'utero_flacido', label: 'Útero flácido' },
  { id: 'utero_tonico', label: 'Útero tónico (asociado a celo)' },
  { id: 'contenido_uterino', label: 'Contenido uterino (líquido, sin preñez)' },
  { id: 'piometra', label: 'Piómetra (útero con pus + CL persistente)' },
];

// Condición reproductiva general
const REPRODUCTIVE_CONDITIONS = [
  { id: 'vacia_ciclica', label: 'Vaca / búfala vacía cíclica' },
  { id: 'vacia_anestro', label: 'Vaca / búfala vacía en anestro' },
  { id: 'repetidora', label: 'Vaca / búfala repetidora (≥3 servicios sin preñez)' },
];

// Sugerencias basadas en hallazgos
const getSuggestion = (ovaryFindings: string[], uterusFindings: string[]): { text: string; type: 'success' | 'warning' | 'info' } | null => {
  if (ovaryFindings.includes('foliculo_izq') || ovaryFindings.includes('foliculo_der') || ovaryFindings.includes('multiples_foliculos')) {
    return { text: 'Candidata a servicio / celo próximo', type: 'success' };
  }
  if (ovaryFindings.includes('cl_izq') || ovaryFindings.includes('cl_der')) {
    return { text: 'No inseminar – esperar próximo celo', type: 'info' };
  }
  if (ovaryFindings.includes('ovarios_inactivos')) {
    return { text: 'Evaluar nutrición / tratamiento hormonal', type: 'warning' };
  }
  if (ovaryFindings.includes('quiste_ovarico') || ovaryFindings.includes('quiste_folicular') || ovaryFindings.includes('quiste_luteal') || uterusFindings.includes('piometra')) {
    return { text: 'Caso veterinario – requiere tratamiento', type: 'warning' };
  }
  return null;
};

export function AnimalQuickEventDialog({
  open,
  onOpenChange,
  animalId,
  animalTagId,
  animalName,
  animalSex,
  onWeightRecord,
  onVaccination,
  onHealthEvent,
  onReproductiveEvent,
}: AnimalQuickEventDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'peso' | 'vacuna' | 'salud' | 'reproduccion'>('peso');
  const [saving, setSaving] = useState(false);
  const [savedTab, setSavedTab] = useState<string | null>(null);
  const [bulls, setBulls] = useState<Bull[]>([]);
  const [loadingBulls, setLoadingBulls] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(true);
  
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
    productiveClassification: '',
  });
  
  const [reproForm, setReproForm] = useState({
    type: 'palpacion',
    result: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    bullId: '',
    semenBatch: '',
  });
  
  // Palpation detailed findings
  const [palpationFindings, setPalpationFindings] = useState({
    ovaryFindings: [] as string[],
    uterusFindings: [] as string[],
    reproductiveCondition: [] as string[],
  });
  
  const toggleOvaryFinding = (id: string) => {
    setPalpationFindings(prev => ({
      ...prev,
      ovaryFindings: prev.ovaryFindings.includes(id)
        ? prev.ovaryFindings.filter(f => f !== id)
        : [...prev.ovaryFindings, id]
    }));
  };
  
  const toggleUterusFinding = (id: string) => {
    setPalpationFindings(prev => ({
      ...prev,
      uterusFindings: prev.uterusFindings.includes(id)
        ? prev.uterusFindings.filter(f => f !== id)
        : [...prev.uterusFindings, id]
    }));
  };
  
  const toggleReproductiveCondition = (id: string) => {
    setPalpationFindings(prev => ({
      ...prev,
      reproductiveCondition: prev.reproductiveCondition.includes(id)
        ? prev.reproductiveCondition.filter(f => f !== id)
        : [...prev.reproductiveCondition, id]
    }));
  };
  
  // Get AI suggestion based on findings
  const palpationSuggestion = getSuggestion(palpationFindings.ovaryFindings, palpationFindings.uterusFindings);

  // Build AI event context based on active tab and form data
  const aiEventContext = useMemo((): AIEventContext => {
    const baseContext: AIEventContext = {
      eventType: activeTab,
      eventDate: activeTab === 'peso' ? weightForm.date 
        : activeTab === 'vacuna' ? vaccineForm.date
        : activeTab === 'salud' ? healthForm.date
        : reproForm.date,
    };

    switch (activeTab) {
      case 'peso':
        if (weightForm.weight) {
          baseContext.weight = parseFloat(weightForm.weight);
        }
        baseContext.notes = weightForm.notes;
        break;
      case 'vacuna':
        baseContext.vaccine = vaccineForm.vaccine;
        baseContext.notes = vaccineForm.notes;
        break;
      case 'salud':
        baseContext.diagnosis = healthForm.diagnosis;
        baseContext.treatment = healthForm.treatment;
        baseContext.productiveClassification = healthForm.productiveClassification;
        baseContext.notes = healthForm.notes;
        break;
      case 'reproduccion':
        baseContext.reproType = reproForm.type;
        baseContext.reproResult = reproForm.result;
        baseContext.notes = reproForm.notes;
        break;
    }

    return baseContext;
  }, [activeTab, weightForm, vaccineForm, healthForm, reproForm]);

  // Handler to add AI suggestion to notes
  const handleAddToNotes = useCallback((text: string) => {
    switch (activeTab) {
      case 'peso':
        setWeightForm(prev => ({
          ...prev,
          notes: prev.notes ? `${prev.notes}\n${text}` : text
        }));
        break;
      case 'vacuna':
        setVaccineForm(prev => ({
          ...prev,
          notes: prev.notes ? `${prev.notes}\n${text}` : text
        }));
        break;
      case 'salud':
        setHealthForm(prev => ({
          ...prev,
          notes: prev.notes ? `${prev.notes}\n${text}` : text
        }));
        break;
      case 'reproduccion':
        setReproForm(prev => ({
          ...prev,
          notes: prev.notes ? `${prev.notes}\n${text}` : text
        }));
        break;
    }
    toast({ title: 'Nota agregada', description: 'Sugerencia añadida al campo de notas' });
  }, [activeTab, toast]);

  const handleSaveWeight = async () => {
    console.log('[QuickEvent] handleSaveWeight', { animalId, weightForm });
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
    } catch (error) {
      console.error('Error saving weight:', error);
      toast({ 
        title: 'Error', 
        description: 'No se pudo guardar el peso. Intenta de nuevo.', 
        variant: 'destructive' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveVaccine = async () => {
    console.log('[QuickEvent] handleSaveVaccine', { animalId, vaccineForm });
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
    } catch (error) {
      console.error('Error saving vaccine:', error);
      toast({ 
        title: 'Error', 
        description: 'No se pudo guardar la vacuna. Intenta de nuevo.', 
        variant: 'destructive' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHealth = async () => {
    console.log('[QuickEvent] handleSaveHealth', { animalId, healthForm });
    if (!healthForm.type) {
      toast({ title: 'Error', description: 'Selecciona el tipo de evento', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      // Build notes with classification if selected
      let fullNotes = healthForm.notes || '';
      if (healthForm.productiveClassification) {
        const classificationLabel = PRODUCTIVE_CLASSIFICATIONS.find(c => c.value === healthForm.productiveClassification)?.label || '';
        fullNotes = `[Clasificación: ${classificationLabel}]${fullNotes ? ` ${fullNotes}` : ''}`;
      }
      
      await onHealthEvent({
        type: healthForm.type,
        diagnosis: healthForm.diagnosis || undefined,
        treatment: healthForm.treatment || undefined,
        date: healthForm.date,
        notes: fullNotes || undefined,
      });
      setSavedTab('salud');
      setHealthForm({ type: 'tratamiento', diagnosis: '', treatment: '', date: new Date().toISOString().split('T')[0], notes: '', productiveClassification: '' });
      setTimeout(() => setSavedTab(null), 2000);
    } catch (error) {
      console.error('Error saving health event:', error);
      toast({ 
        title: 'Error', 
        description: 'No se pudo guardar el evento de salud. Intenta de nuevo.', 
        variant: 'destructive' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRepro = async () => {
    console.log('[QuickEvent] handleSaveRepro', { animalId, reproForm });
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
      // Build detailed notes for palpation "Vacía"
      let detailedNotes = reproForm.notes || '';
      
      if (reproForm.type === 'palpacion' && reproForm.result === 'vacia') {
        const findingsNotes: string[] = [];
        
        if (palpationFindings.ovaryFindings.length > 0) {
          const ovaryLabels = palpationFindings.ovaryFindings.map(id => 
            OVARY_FINDINGS.find(f => f.id === id)?.label || id
          );
          findingsNotes.push(`Ovarios: ${ovaryLabels.join(', ')}`);
        }
        
        if (palpationFindings.uterusFindings.length > 0) {
          const uterusLabels = palpationFindings.uterusFindings.map(id => 
            UTERUS_FINDINGS.find(f => f.id === id)?.label || id
          );
          findingsNotes.push(`Útero: ${uterusLabels.join(', ')}`);
        }
        
        if (palpationFindings.reproductiveCondition.length > 0) {
          const conditionLabels = palpationFindings.reproductiveCondition.map(id => 
            REPRODUCTIVE_CONDITIONS.find(f => f.id === id)?.label || id
          );
          findingsNotes.push(`Condición: ${conditionLabels.join(', ')}`);
        }
        
        if (palpationSuggestion) {
          findingsNotes.push(`Sugerencia: ${palpationSuggestion.text}`);
        }
        
        if (findingsNotes.length > 0) {
          detailedNotes = findingsNotes.join(' | ') + (detailedNotes ? ` | Notas: ${detailedNotes}` : '');
        }
      }
      
      await onReproductiveEvent({
        type: reproForm.type,
        result: reproForm.result || undefined,
        date: reproForm.date,
        notes: detailedNotes || undefined,
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
      setPalpationFindings({
        ovaryFindings: [],
        uterusFindings: [],
        reproductiveCondition: [],
      });
      setTimeout(() => setSavedTab(null), 2000);
    } catch (error) {
      console.error('Error saving reproductive event:', error);
      toast({ 
        title: 'Error', 
        description: 'No se pudo guardar el evento reproductivo. Intenta de nuevo.', 
        variant: 'destructive' 
      });
    } finally {
      setSaving(false);
    }
  };

  const renderSaveButton = (onClick: () => void, tab: string) => (
    <Button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('[QuickEvent] Save clicked', { tab, activeTab, saving });
        if (!saving) {
          onClick();
        }
      }}
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
      <DialogContent className={showAIPanel ? "max-w-5xl" : "max-w-2xl"}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                Registrar Evento - {animalTagId}
                {animalName && <span className="text-muted-foreground font-normal">({animalName})</span>}
              </DialogTitle>
              <DialogDescription>
                Registra múltiples eventos en el mismo día sin salir de esta ventana
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAIPanel(!showAIPanel)}
              className="gap-1.5"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">IA</span>
              {showAIPanel ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </DialogHeader>

        <div className={`flex gap-4 ${showAIPanel ? 'flex-row' : ''}`}>
          {/* Main form area */}
          <div className={showAIPanel ? 'flex-1 min-w-0' : 'w-full'}>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'peso' | 'vacuna' | 'salud' | 'reproduccion')} className="mt-4">
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
            {renderSaveButton(handleSaveWeight, 'peso')}
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
            {renderSaveButton(handleSaveVaccine, 'vacuna')}
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
            
            {/* Clasificación productiva / destino del animal */}
            <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-dashed">
              <Label className="text-sm font-semibold flex items-center gap-2">
                📊 Clasificación productiva / destino del animal
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Decisión comercial o productiva (no afecta diagnóstico médico)
              </p>
              <Select
                value={healthForm.productiveClassification}
                onValueChange={(value) => setHealthForm(prev => ({ ...prev, productiveClassification: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar clasificación (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCTIVE_CLASSIFICATIONS.map((c) => (
                    <SelectItem key={c.value || 'none'} value={c.value || 'none'}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {healthForm.productiveClassification && healthForm.productiveClassification !== 'none' && (
                <div className="mt-2 text-xs">
                  {(healthForm.productiveClassification === 'candidato_descarte' || 
                    healthForm.productiveClassification === 'enviar_sacrificio') && (
                    <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <AlertCircle className="h-3 w-3" />
                      Esta clasificación afectará el estado del animal
                    </div>
                  )}
                  {healthForm.productiveClassification === 'candidato_venta' && (
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <Check className="h-3 w-3" />
                      El animal aparecerá en reportes de venta
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                placeholder="Justificación de la decisión (ej: Baja producción, Edad avanzada)..."
                value={healthForm.notes}
                onChange={(e) => setHealthForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            {renderSaveButton(handleSaveHealth, 'salud')}
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
              <div className="space-y-4">
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
                
                {/* Formulario detallado para palpación "Vacía" */}
                {reproForm.result === 'vacia' && (
                  <ScrollArea className="h-[320px] pr-4">
                    <div className="space-y-4">
                      {/* Sugerencia AI */}
                      {palpationSuggestion && (
                        <div className={`flex items-start gap-2 p-3 rounded-lg border ${
                          palpationSuggestion.type === 'success' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' :
                          palpationSuggestion.type === 'warning' ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' :
                          'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                        }`}>
                          <Lightbulb className={`h-4 w-4 mt-0.5 ${
                            palpationSuggestion.type === 'success' ? 'text-green-600' :
                            palpationSuggestion.type === 'warning' ? 'text-amber-600' :
                            'text-blue-600'
                          }`} />
                          <span className="text-sm font-medium">{palpationSuggestion.text}</span>
                        </div>
                      )}
                      
                      {/* A. Hallazgos de Ovarios */}
                      <div className="space-y-2 p-3 bg-muted/30 rounded-lg border">
                        <Label className="text-sm font-semibold">A. Ovarios – Hallazgos</Label>
                        <div className="grid grid-cols-1 gap-2 mt-2">
                          {OVARY_FINDINGS.map((finding) => (
                            <div key={finding.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={finding.id}
                                checked={palpationFindings.ovaryFindings.includes(finding.id)}
                                onCheckedChange={() => toggleOvaryFinding(finding.id)}
                              />
                              <label
                                htmlFor={finding.id}
                                className="text-sm cursor-pointer leading-tight"
                              >
                                {finding.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* B. Hallazgos de Útero */}
                      <div className="space-y-2 p-3 bg-muted/30 rounded-lg border">
                        <Label className="text-sm font-semibold">B. Útero – Hallazgos</Label>
                        <div className="grid grid-cols-1 gap-2 mt-2">
                          {UTERUS_FINDINGS.map((finding) => (
                            <div key={finding.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={finding.id}
                                checked={palpationFindings.uterusFindings.includes(finding.id)}
                                onCheckedChange={() => toggleUterusFinding(finding.id)}
                              />
                              <label
                                htmlFor={finding.id}
                                className="text-sm cursor-pointer leading-tight"
                              >
                                {finding.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* C. Condición Reproductiva */}
                      <div className="space-y-2 p-3 bg-muted/30 rounded-lg border">
                        <Label className="text-sm font-semibold">C. Condición Reproductiva (Resumen)</Label>
                        <div className="grid grid-cols-1 gap-2 mt-2">
                          {REPRODUCTIVE_CONDITIONS.map((condition) => (
                            <div key={condition.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={condition.id}
                                checked={palpationFindings.reproductiveCondition.includes(condition.id)}
                                onCheckedChange={() => toggleReproductiveCondition(condition.id)}
                              />
                              <label
                                htmlFor={condition.id}
                                className="text-sm cursor-pointer leading-tight"
                              >
                                {condition.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Resumen de selecciones */}
                      {(palpationFindings.ovaryFindings.length > 0 || palpationFindings.uterusFindings.length > 0 || palpationFindings.reproductiveCondition.length > 0) && (
                        <div className="flex flex-wrap gap-1">
                          {palpationFindings.ovaryFindings.map(id => (
                            <Badge key={id} variant="secondary" className="text-xs">
                              {OVARY_FINDINGS.find(f => f.id === id)?.label.split(' – ')[0] || id}
                            </Badge>
                          ))}
                          {palpationFindings.uterusFindings.map(id => (
                            <Badge key={id} variant="outline" className="text-xs">
                              {UTERUS_FINDINGS.find(f => f.id === id)?.label || id}
                            </Badge>
                          ))}
                          {palpationFindings.reproductiveCondition.map(id => (
                            <Badge key={id} className="text-xs bg-primary/10 text-primary">
                              {REPRODUCTIVE_CONDITIONS.find(f => f.id === id)?.label.split(' / ')[0] || id}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                )}
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
            {renderSaveButton(handleSaveRepro, 'reproduccion')}
          </TabsContent>
            </Tabs>
          </div>

          {/* AI Suggestions Panel */}
          {showAIPanel && (
            <div className="w-80 shrink-0 border-l pl-4 hidden md:block">
              <div className="h-[500px] rounded-lg border bg-muted/20">
                <EventAISuggestionsPanel
                  animalId={animalId}
                  open={open}
                  eventContext={aiEventContext}
                  onAddToNotes={handleAddToNotes}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
