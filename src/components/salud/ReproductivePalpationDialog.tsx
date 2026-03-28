import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronsUpDown, Check as CheckIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { 
  OVARY_FINDINGS, 
  UTERUS_FINDINGS, 
  REPRODUCTIVE_CONDITIONS,
  PalpationRecord 
} from '@/hooks/usePalpationRecords';
import { 
  Stethoscope, 
  AlertTriangle, 
  CheckCircle2, 
  CircleDot,
  Baby,
  Heart,
  Scale,
  Activity,
  Info,
  Sparkles
} from 'lucide-react';

interface Animal {
  id: string;
  tag_id: string;
  name: string | null;
  reproductive_status?: string;
  last_service_date?: string;
  expected_calving_date?: string;
  breed?: string;
}

interface ReproductivePalpationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<PalpationRecord, 'id' | 'created_at' | 'organization_id'>) => void;
}

export const ReproductivePalpationDialog = ({
  open,
  onOpenChange,
  onSubmit,
}: ReproductivePalpationDialogProps) => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [animalOpen, setAnimalOpen] = useState(false);

  // Form state
  const [selectedAnimal, setSelectedAnimal] = useState<string>('');
  const [palpationDate, setPalpationDate] = useState(new Date().toISOString().split('T')[0]);
  const [veterinarian, setVeterinarian] = useState('');
  const [species, setSpecies] = useState<'bovino' | 'bufalino'>('bovino');
  const [isPregnant, setIsPregnant] = useState<boolean | null>(null);
  const [gestationDays, setGestationDays] = useState('');
  const [bodyConditionScore, setBodyConditionScore] = useState('');
  const [ovaryFindings, setOvaryFindings] = useState<string[]>([]);
  const [uterusFindings, setUterusFindings] = useState<string[]>([]);
  const [reproductiveCondition, setReproductiveCondition] = useState<string>('');
  const [notes, setNotes] = useState('');
  
  // Fetch female animals
  useEffect(() => {
    const fetchAnimals = async () => {
      const { data } = await supabase
        .from('animals')
        .select('id, tag_id, name, reproductive_status, last_service_date, expected_calving_date, breed')
        .eq('sex', 'hembra')
        .eq('status', 'activo')
        .in('category', ['vaca', 'novilla', 'bufala'])
        .order('tag_id');
      setAnimals(data || []);
    };
    if (open) fetchAnimals();
  }, [open]);
  
  // Auto-detect species from breed
  useEffect(() => {
    if (selectedAnimal) {
      const animal = animals.find(a => a.id === selectedAnimal);
      if (animal?.breed?.toLowerCase().includes('bufal')) {
        setSpecies('bufalino');
      }
    }
  }, [selectedAnimal, animals]);
  
  const selectedAnimalData = useMemo(() => {
    return animals.find(a => a.id === selectedAnimal);
  }, [selectedAnimal, animals]);
  
  const resetForm = () => {
    setSelectedAnimal('');
    setPalpationDate(new Date().toISOString().split('T')[0]);
    setVeterinarian('');
    setSpecies('bovino');
    setIsPregnant(null);
    setGestationDays('');
    setBodyConditionScore('');
    setOvaryFindings([]);
    setUterusFindings([]);
    setReproductiveCondition('');
    setNotes('');
    setActiveTab('basic');
  };
  
  const handleOvaryFindingToggle = (id: string) => {
    setOvaryFindings(prev => 
      prev.includes(id) 
        ? prev.filter(f => f !== id)
        : [...prev, id]
    );
  };
  
  const handleUterusFindingToggle = (id: string) => {
    setUterusFindings(prev => 
      prev.includes(id) 
        ? prev.filter(f => f !== id)
        : [...prev, id]
    );
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimal || isPregnant === null) return;
    
    setLoading(true);
    
    // Parse BCS with comma support
    const parsedBCS = bodyConditionScore 
      ? parseFloat(bodyConditionScore.replace(',', '.'))
      : undefined;
    
    onSubmit({
      animal_id: selectedAnimal,
      palpation_date: palpationDate,
      veterinarian: veterinarian || undefined,
      species,
      is_pregnant: isPregnant,
      gestation_days: gestationDays ? parseInt(gestationDays) : undefined,
      body_condition_score: parsedBCS,
      ovary_findings: ovaryFindings,
      uterus_findings: uterusFindings,
      reproductive_condition: reproductiveCondition || undefined,
      notes: notes || undefined,
    });
    
    setLoading(false);
    resetForm();
    onOpenChange(false);
  };
  
  // BCS interpretation
  const getBCSInterpretation = () => {
    if (!bodyConditionScore) return null;
    const bcs = parseFloat(bodyConditionScore.replace(',', '.'));
    if (isNaN(bcs)) return null;
    
    if (bcs < 2.75) return { 
      level: 'warning', 
      text: 'Riesgo reproductivo alto', 
      color: 'text-destructive' 
    };
    if (bcs >= 3.0 && bcs <= 3.75) return { 
      level: 'success', 
      text: 'Óptimo', 
      color: 'text-green-600' 
    };
    if (bcs > 4.0) return { 
      level: 'warning', 
      text: 'Riesgo metabólico', 
      color: 'text-amber-600' 
    };
    return { level: 'info', text: 'Aceptable', color: 'text-blue-600' };
  };
  
  const bcsInterpretation = getBCSInterpretation();
  
  const canSubmit = selectedAnimal && isPregnant !== null && palpationDate;
  
  return (
    <Dialog open={open} onOpenChange={(open) => { onOpenChange(open); if (!open) resetForm(); }}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            Palpación Reproductiva Profesional
          </DialogTitle>
          <DialogDescription>
            Registro estandarizado para bovinos y bufalinos con diagnóstico IA
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-4 shrink-0">
              <TabsTrigger value="basic" className="flex items-center gap-1">
                <Info className="h-3 w-3" />
                Básico
              </TabsTrigger>
              <TabsTrigger value="ovaries" className="flex items-center gap-1">
                <CircleDot className="h-3 w-3" />
                Ovarios
              </TabsTrigger>
              <TabsTrigger value="uterus" className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                Útero
              </TabsTrigger>
              <TabsTrigger value="condition" className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                Condición
              </TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-y-auto pr-1 mt-1">
              {/* Tab: Básico */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Animal *</Label>
                    <Popover open={animalOpen} onOpenChange={setAnimalOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={animalOpen}
                          className="w-full justify-between font-normal"
                        >
                          {selectedAnimal
                            ? (() => { const a = animals.find(x => x.id === selectedAnimal); return a ? `${a.tag_id}${a.name ? ` - ${a.name}` : ''}` : 'Seleccionar hembra'; })()
                            : 'Seleccionar hembra'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[320px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Buscar por arete o nombre..." />
                          <CommandList className="max-h-[200px] overflow-y-auto">
                            <CommandEmpty>No se encontró ningún animal.</CommandEmpty>
                            <CommandGroup>
                              {animals.map((animal) => (
                                <CommandItem
                                  key={animal.id}
                                  value={`${animal.tag_id} ${animal.name || ''}`}
                                  onSelect={() => { setSelectedAnimal(animal.id); setAnimalOpen(false); }}
                                >
                                  <CheckIcon className={cn('mr-2 h-4 w-4', selectedAnimal === animal.id ? 'opacity-100' : 'opacity-0')} />
                                  <span>{animal.tag_id}</span>
                                  {animal.name && <span className="text-muted-foreground ml-1">({animal.name})</span>}
                                  {animal.reproductive_status && (
                                    <Badge variant="outline" className="text-xs ml-auto">{animal.reproductive_status}</Badge>
                                  )}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Fecha de Palpación *</Label>
                    <Input
                      type="date"
                      value={palpationDate}
                      onChange={(e) => setPalpationDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                {selectedAnimalData && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Información del Animal</AlertTitle>
                    <AlertDescription className="text-sm">
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <span>Estado: <strong>{selectedAnimalData.reproductive_status || 'N/D'}</strong></span>
                        {selectedAnimalData.last_service_date && (
                          <span>Último servicio: <strong>{selectedAnimalData.last_service_date}</strong></span>
                        )}
                        {selectedAnimalData.expected_calving_date && (
                          <span>Parto esperado: <strong>{selectedAnimalData.expected_calving_date}</strong></span>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Especie *</Label>
                    <Select value={species} onValueChange={(v) => setSpecies(v as 'bovino' | 'bufalino')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bovino">🐄 Bovino</SelectItem>
                        <SelectItem value="bufalino">🐃 Bufalino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Veterinario</Label>
                    <Input
                      placeholder="Nombre del veterinario"
                      value={veterinarian}
                      onChange={(e) => setVeterinarian(e.target.value)}
                    />
                  </div>
                </div>
                
                <Separator />
                
                {/* Resultado de preñez */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Resultado de Preñez *</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Card 
                      className={`cursor-pointer transition-all ${
                        isPregnant === true 
                          ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-950' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setIsPregnant(true)}
                    >
                      <CardContent className="p-4 flex items-center gap-3">
                        <Baby className={`h-8 w-8 ${isPregnant === true ? 'text-green-600' : 'text-muted-foreground'}`} />
                        <div>
                          <p className="font-medium">Preñada</p>
                          <p className="text-sm text-muted-foreground">Gestación confirmada</p>
                        </div>
                        {isPregnant === true && <CheckCircle2 className="h-5 w-5 text-green-600 ml-auto" />}
                      </CardContent>
                    </Card>
                    
                    <Card 
                      className={`cursor-pointer transition-all ${
                        isPregnant === false 
                          ? 'ring-2 ring-amber-500 bg-amber-50 dark:bg-amber-950' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setIsPregnant(false)}
                    >
                      <CardContent className="p-4 flex items-center gap-3">
                        <CircleDot className={`h-8 w-8 ${isPregnant === false ? 'text-amber-600' : 'text-muted-foreground'}`} />
                        <div>
                          <p className="font-medium">Vacía</p>
                          <p className="text-sm text-muted-foreground">No preñada</p>
                        </div>
                        {isPregnant === false && <CheckCircle2 className="h-5 w-5 text-amber-600 ml-auto" />}
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                {isPregnant === true && (
                  <div className="space-y-2">
                    <Label>Días de Gestación Estimados</Label>
                    <Input
                      type="number"
                      placeholder="Ej: 90"
                      value={gestationDays}
                      onChange={(e) => setGestationDays(e.target.value)}
                      min={1}
                      max={320}
                    />
                  </div>
                )}
                
                {/* Condición Corporal */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Scale className="h-4 w-4" />
                    Estado Corporal (BCS 1.0 - 5.0) *
                  </Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="Ej: 3,0"
                      value={bodyConditionScore}
                      onChange={(e) => setBodyConditionScore(e.target.value)}
                      className="w-32"
                    />
                    {bcsInterpretation && (
                      <Badge 
                        variant={bcsInterpretation.level === 'success' ? 'default' : 'secondary'}
                        className={bcsInterpretation.color}
                      >
                        {bcsInterpretation.text}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Acepta coma (,) o punto (.) como separador decimal
                  </p>
                </div>
              </TabsContent>
              
              {/* Tab: Ovarios */}
              <TabsContent value="ovaries" className="space-y-4 mt-4">
                {/* Animal context header */}
                {selectedAnimal ? (
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-sm">
                    <span className="font-medium">{animals.find(a => a.id === selectedAnimal)?.tag_id || '...'}</span>
                    {isPregnant === null ? (
                      <Badge variant="outline" className="text-amber-600 border-amber-400">→ Ir a Básico para registrar resultado</Badge>
                    ) : (
                      <Badge variant={isPregnant ? 'default' : 'secondary'}>{isPregnant ? '🤰 Preñada' : '⭕ Vacía'}</Badge>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground p-2 bg-muted/30 rounded">Selecciona un animal en la pestaña Básico</p>
                )}
                {isPregnant === false ? (
                  <>
                    <Alert>
                      <Sparkles className="h-4 w-4" />
                      <AlertTitle>Hallazgos de Ovarios</AlertTitle>
                      <AlertDescription>
                        Seleccione todos los hallazgos observados (selección múltiple)
                      </AlertDescription>
                    </Alert>
                    
                    {/* Actividad normal */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          Actividad Ovárica Normal
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-2">
                        {OVARY_FINDINGS.normal.map((finding) => (
                          <div key={finding.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={finding.id}
                              checked={ovaryFindings.includes(finding.id)}
                              onCheckedChange={() => handleOvaryFindingToggle(finding.id)}
                            />
                            <label 
                              htmlFor={finding.id} 
                              className="text-sm cursor-pointer"
                            >
                              {finding.label}
                            </label>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                    
                    {/* Baja actividad */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          Baja o Nula Actividad
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {OVARY_FINDINGS.inactive.map((finding) => (
                          <div key={finding.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={finding.id}
                              checked={ovaryFindings.includes(finding.id)}
                              onCheckedChange={() => handleOvaryFindingToggle(finding.id)}
                            />
                            <label 
                              htmlFor={finding.id} 
                              className="text-sm cursor-pointer"
                            >
                              {finding.label}
                            </label>
                          </div>
                        ))}
                        <p className="text-xs text-muted-foreground mt-2">
                          Frecuente en postparto, mala condición corporal o estrés
                        </p>
                      </CardContent>
                    </Card>
                    
                    {/* Alteraciones */}
                    <Card className="border-destructive/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          Alteraciones Ováricas
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-2">
                        {OVARY_FINDINGS.alterations.map((finding) => (
                          <div key={finding.id} className={`flex items-center space-x-2 ${finding.subOf ? 'ml-4' : ''}`}>
                            <Checkbox
                              id={finding.id}
                              checked={ovaryFindings.includes(finding.id)}
                              onCheckedChange={() => handleOvaryFindingToggle(finding.id)}
                            />
                            <label 
                              htmlFor={finding.id} 
                              className="text-sm cursor-pointer"
                            >
                              {finding.subOf ? '• ' : ''}{finding.label}
                            </label>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                    
                    {species === 'bufalino' && (
                      <Alert variant="default" className="bg-blue-50 dark:bg-blue-950 border-blue-200">
                        <Info className="h-4 w-4 text-blue-600" />
                        <AlertTitle>Consideración Bufalinos</AlertTitle>
                        <AlertDescription className="text-sm">
                          En bufalinos los ovarios son menos evidentes y el anestro postparto es más prolongado.
                          No marcar ovarios inactivos como patología grave automáticamente.
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                ) : isPregnant === true ? (
                  <Alert className="bg-green-50 dark:bg-green-950 border-green-200">
                    <Baby className="h-4 w-4 text-green-600" />
                    <AlertTitle>Animal Preñada</AlertTitle>
                    <AlertDescription className="text-sm">
                      Los ovarios no se evalúan en gestación.
                      {gestationDays && ` Gestación estimada: ${gestationDays} días (≈${Math.round(Number(gestationDays)/30)} meses).`}
                      {' '}Los cuerpos lúteos de gestación están presentes y son normales.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Seleccione resultado primero</AlertTitle>
                    <AlertDescription>
                      Vaya a la pestaña Básico y seleccione si el animal está Preñada o Vacía.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              {/* Tab: Útero */}
              <TabsContent value="uterus" className="space-y-4 mt-4">
                {/* Animal context header */}
                {selectedAnimal ? (
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-sm">
                    <span className="font-medium">{animals.find(a => a.id === selectedAnimal)?.tag_id || '...'}</span>
                    {isPregnant === null ? (
                      <Badge variant="outline" className="text-amber-600 border-amber-400">→ Ir a Básico para registrar resultado</Badge>
                    ) : (
                      <Badge variant={isPregnant ? 'default' : 'secondary'}>{isPregnant ? '🤰 Preñada' : '⭕ Vacía'}</Badge>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground p-2 bg-muted/30 rounded">Selecciona un animal en la pestaña Básico</p>
                )}
                {isPregnant === false ? (
                  <>
                    <Alert>
                      <Sparkles className="h-4 w-4" />
                      <AlertTitle>Hallazgos de Útero</AlertTitle>
                      <AlertDescription>
                        Seleccione la condición del útero observada
                      </AlertDescription>
                    </Alert>
                    
                    {/* Condición normal */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          Condición Normal
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {UTERUS_FINDINGS.normal.map((finding) => (
                          <div key={finding.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={finding.id}
                              checked={uterusFindings.includes(finding.id)}
                              onCheckedChange={() => handleUterusFindingToggle(finding.id)}
                            />
                            <label 
                              htmlFor={finding.id} 
                              className="text-sm cursor-pointer"
                            >
                              {finding.label}
                            </label>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                    
                    {/* Alteraciones */}
                    <Card className="border-destructive/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          Alteraciones
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {UTERUS_FINDINGS.alterations.map((finding) => (
                          <div key={finding.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={finding.id}
                              checked={uterusFindings.includes(finding.id)}
                              onCheckedChange={() => handleUterusFindingToggle(finding.id)}
                            />
                            <label 
                              htmlFor={finding.id} 
                              className="text-sm cursor-pointer"
                            >
                              {finding.label}
                            </label>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </>
                ) : isPregnant === true ? (
                  <Alert className="bg-green-50 dark:bg-green-950 border-green-200">
                    <Baby className="h-4 w-4 text-green-600" />
                    <AlertTitle>Animal Preñada</AlertTitle>
                    <AlertDescription className="text-sm">
                      El útero está ocupado con la gestación. No se evalúan hallazgos uterinos.
                      {gestationDays && Number(gestationDays) > 60 && ' A partir de los 60 días es posible palpar los placentomas.'}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Seleccione resultado primero</AlertTitle>
                    <AlertDescription>
                      Vaya a la pestaña Básico y seleccione si el animal está Preñada o Vacía.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
              
              {/* Tab: Condición */}
              <TabsContent value="condition" className="space-y-4 mt-4">
                {/* Animal context header */}
                {selectedAnimal ? (
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-sm">
                    <span className="font-medium">{animals.find(a => a.id === selectedAnimal)?.tag_id || '...'}</span>
                    {isPregnant === null ? (
                      <Badge variant="outline" className="text-amber-600 border-amber-400">→ Ir a Básico para registrar resultado</Badge>
                    ) : (
                      <Badge variant={isPregnant ? 'default' : 'secondary'}>{isPregnant ? '🤰 Preñada' : '⭕ Vacía'}</Badge>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground p-2 bg-muted/30 rounded">Selecciona un animal en la pestaña Básico</p>
                )}
                {isPregnant === false ? (
                  <>
                    <Alert>
                      <Sparkles className="h-4 w-4" />
                      <AlertTitle>Condición Reproductiva General</AlertTitle>
                      <AlertDescription>
                        Clasifique el estado reproductivo general del animal
                      </AlertDescription>
                    </Alert>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {REPRODUCTIVE_CONDITIONS.map((condition) => (
                        <Card 
                          key={condition.id}
                          className={`cursor-pointer transition-all ${
                            reproductiveCondition === condition.id 
                              ? 'ring-2 ring-primary bg-primary/5' 
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => setReproductiveCondition(condition.id)}
                        >
                          <CardContent className="p-4 flex items-center gap-3">
                            <div className="flex-1">
                              <p className="font-medium">{condition.label}</p>
                              <p className="text-sm text-muted-foreground">{condition.description}</p>
                            </div>
                            {reproductiveCondition === condition.id && (
                              <CheckCircle2 className="h-5 w-5 text-primary" />
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                ) : isPregnant === true ? (
                  <div className="space-y-3">
                    <Alert className="bg-green-50 dark:bg-green-950 border-green-200">
                      <Baby className="h-4 w-4 text-green-600" />
                      <AlertTitle>Gestante</AlertTitle>
                      <AlertDescription className="text-sm">
                        Condición reproductiva: <strong>Gestante</strong>.
                        {gestationDays && (
                          <> Días: <strong>{gestationDays}</strong> (trimestre {Math.ceil(Number(gestationDays)/90)}/3).</>
                        )}
                      </AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Scale className="h-4 w-4" />
                        BCS durante gestación — recomendado 3.0–3.5
                      </Label>
                      {bcsInterpretation && (
                        <Badge variant={bcsInterpretation.level === 'success' ? 'default' : 'secondary'} className={bcsInterpretation.color}>
                          BCS {bodyConditionScore}: {bcsInterpretation.text}
                        </Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Seleccione resultado primero</AlertTitle>
                    <AlertDescription>
                      Vaya a la pestaña Básico y seleccione si el animal está Preñada o Vacía.
                    </AlertDescription>
                  </Alert>
                )}

                <Separator />

                {/* Notas */}
                <div className="space-y-2">
                  <Label>Observaciones Adicionales</Label>
                  <Textarea
                    placeholder="Notas del examen..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </TabsContent>
            </div>
          </Tabs>
          
          {/* Summary and Submit */}
          <div className="border-t pt-4 mt-4 space-y-3">
            {/* Quick Summary */}
            {selectedAnimal && isPregnant !== null && (
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{species === 'bovino' ? '🐄 Bovino' : '🐃 Bufalino'}</Badge>
                <Badge variant={isPregnant ? 'default' : 'secondary'}>
                  {isPregnant ? `🤰 Preñada ${gestationDays ? `(${gestationDays}d)` : ''}` : '⭕ Vacía'}
                </Badge>
                {bodyConditionScore && (
                  <Badge variant="outline">BCS: {bodyConditionScore}</Badge>
                )}
                {ovaryFindings.length > 0 && (
                  <Badge variant="outline">{ovaryFindings.length} hallazgo(s) ovarios</Badge>
                )}
                {uterusFindings.length > 0 && (
                  <Badge variant="outline">{uterusFindings.length} hallazgo(s) útero</Badge>
                )}
              </div>
            )}
            
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || !canSubmit}>
                {loading ? 'Guardando...' : 'Registrar Palpación'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
