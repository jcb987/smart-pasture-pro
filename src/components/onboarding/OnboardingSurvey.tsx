import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  User, Tractor, Stethoscope, Shield,
  Beef, Milk, Target,
  Users, AlertTriangle, DollarSign, FolderOpen,
  ArrowRight, ArrowLeft, Check
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OnboardingSurveyProps {
  open: boolean;
  onComplete: () => void;
  userId: string;
  organizationId: string | null;
}

const roleOptions = [
  { value: 'ganadero', label: 'Ganadero', description: 'Propietario o administrador de finca', icon: User },
  { value: 'vaquero', label: 'Vaquero', description: 'Trabajo de campo con el ganado', icon: Tractor },
  { value: 'veterinario', label: 'Veterinario', description: 'Atención médica y sanitaria', icon: Stethoscope },
  { value: 'administrador', label: 'Administrador', description: 'Gestión administrativa', icon: Shield },
];

const productionOptions = [
  { value: 'carne', label: 'Carne', description: 'Producción de carne bovina', icon: Beef },
  { value: 'leche', label: 'Leche', description: 'Producción de leche', icon: Milk },
  { value: 'doble_proposito', label: 'Doble Propósito', description: 'Carne y leche', icon: Target },
];

const speciesOptions = [
  { value: 'vaca', label: 'Vacas/Toros' },
  { value: 'bufala', label: 'Búfalas/Búfalos' },
];

const herdSizeOptions = [
  { value: '1-50', label: '1-50 animales' },
  { value: '51-100', label: '51-100 animales' },
  { value: '101-250', label: '101-250 animales' },
  { value: '251-500', label: '251-500 animales' },
  { value: '500+', label: 'Más de 500 animales' },
];

const challengeOptions = [
  { value: 'sanidad', label: 'Sanidad', description: 'Enfermedades, tratamientos, vacunas', icon: Stethoscope },
  { value: 'reproduccion', label: 'Reproducción', description: 'Celos, inseminación, partos', icon: Users },
  { value: 'costos', label: 'Costos', description: 'Rentabilidad, gastos, ingresos', icon: DollarSign },
  { value: 'organizacion', label: 'Organización', description: 'Registros, inventario, datos', icon: FolderOpen },
];

export function OnboardingSurvey({ open, onComplete, userId, organizationId }: OnboardingSurveyProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    primary_role: '',
    production_type: '',
    species: [] as string[],
    herd_size: '',
    main_challenge: '',
  });

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const canProceed = () => {
    switch (step) {
      case 1: return !!formData.primary_role;
      case 2: return !!formData.production_type;
      case 3: return formData.species.length > 0;
      case 4: return !!formData.herd_size;
      case 5: return !!formData.main_challenge;
      default: return false;
    }
  };

  const handleSpeciesChange = (species: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      species: checked 
        ? [...prev.species, species]
        : prev.species.filter(s => s !== species)
    }));
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_onboarding')
        .insert({
          user_id: userId,
          organization_id: organizationId,
          primary_role: formData.primary_role,
          production_type: formData.production_type,
          species: formData.species,
          herd_size: formData.herd_size,
          main_challenge: formData.main_challenge,
        });

      if (error) throw error;

      // Sync veterinario role to user_roles (DB trigger only assigns 'ganadero' by default)
      if (formData.primary_role === 'veterinario') {
        await supabase
          .from('user_roles')
          .upsert({ user_id: userId, role: 'veterinario' }, { onConflict: 'user_id,role' });
      }

      toast({
        title: '¡Bienvenido a Agro Data!',
        description: 'Tu perfil ha sido configurado correctamente',
      });
      
      onComplete();
    } catch (error) {
      console.error('Error saving onboarding:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la configuración',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold">¿Cuál es tu rol principal?</h3>
              <p className="text-sm text-muted-foreground">Esto nos ayuda a personalizar tu experiencia</p>
            </div>
            <RadioGroup 
              value={formData.primary_role} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, primary_role: value }))}
              className="grid grid-cols-2 gap-3"
            >
              {roleOptions.map((option) => (
                <Label
                  key={option.value}
                  htmlFor={option.value}
                  className={`cursor-pointer ${formData.primary_role === option.value ? 'ring-2 ring-primary' : ''}`}
                >
                  <Card className="h-full hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                      <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                      <option.icon className="h-8 w-8 text-primary" />
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </CardContent>
                  </Card>
                </Label>
              ))}
            </RadioGroup>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold">¿Qué tipo de producción manejas?</h3>
              <p className="text-sm text-muted-foreground">Selecciona tu enfoque principal</p>
            </div>
            <RadioGroup 
              value={formData.production_type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, production_type: value }))}
              className="space-y-3"
            >
              {productionOptions.map((option) => (
                <Label
                  key={option.value}
                  htmlFor={`prod-${option.value}`}
                  className={`cursor-pointer block ${formData.production_type === option.value ? 'ring-2 ring-primary rounded-lg' : ''}`}
                >
                  <Card className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4 flex items-center gap-4">
                      <RadioGroupItem value={option.value} id={`prod-${option.value}`} className="sr-only" />
                      <option.icon className="h-10 w-10 text-primary" />
                      <div>
                        <span className="font-medium">{option.label}</span>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Label>
              ))}
            </RadioGroup>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold">¿Con qué especies trabajas?</h3>
              <p className="text-sm text-muted-foreground">Puedes seleccionar más de una</p>
            </div>
            <div className="space-y-3">
              {speciesOptions.map((option) => (
                <Label
                  key={option.value}
                  htmlFor={`species-${option.value}`}
                  className={`cursor-pointer block ${formData.species.includes(option.value) ? 'ring-2 ring-primary rounded-lg' : ''}`}
                >
                  <Card className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4 flex items-center gap-4">
                      <Checkbox
                        id={`species-${option.value}`}
                        checked={formData.species.includes(option.value)}
                        onCheckedChange={(checked) => handleSpeciesChange(option.value, checked as boolean)}
                      />
                      <Beef className="h-8 w-8 text-primary" />
                      <span className="font-medium">{option.label}</span>
                    </CardContent>
                  </Card>
                </Label>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold">¿Cuántos animales manejas?</h3>
              <p className="text-sm text-muted-foreground">Tamaño aproximado de tu hato</p>
            </div>
            <RadioGroup 
              value={formData.herd_size} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, herd_size: value }))}
              className="space-y-2"
            >
              {herdSizeOptions.map((option) => (
                <Label
                  key={option.value}
                  htmlFor={`size-${option.value}`}
                  className={`cursor-pointer block ${formData.herd_size === option.value ? 'ring-2 ring-primary rounded-lg' : ''}`}
                >
                  <Card className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-3 flex items-center gap-3">
                      <RadioGroupItem value={option.value} id={`size-${option.value}`} />
                      <span className="font-medium">{option.label}</span>
                    </CardContent>
                  </Card>
                </Label>
              ))}
            </RadioGroup>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold">¿Cuál es tu mayor reto actual?</h3>
              <p className="text-sm text-muted-foreground">Te ayudaremos a resolverlo</p>
            </div>
            <RadioGroup 
              value={formData.main_challenge} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, main_challenge: value }))}
              className="grid grid-cols-2 gap-3"
            >
              {challengeOptions.map((option) => (
                <Label
                  key={option.value}
                  htmlFor={`challenge-${option.value}`}
                  className={`cursor-pointer ${formData.main_challenge === option.value ? 'ring-2 ring-primary rounded-lg' : ''}`}
                >
                  <Card className="h-full hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                      <RadioGroupItem value={option.value} id={`challenge-${option.value}`} className="sr-only" />
                      <option.icon className="h-8 w-8 text-primary" />
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </CardContent>
                  </Card>
                </Label>
              ))}
            </RadioGroup>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">Configura tu perfil</DialogTitle>
          <DialogDescription className="text-center">
            Paso {step} de {totalSteps}
          </DialogDescription>
        </DialogHeader>

        <Progress value={progress} className="h-2 mb-4" />

        <div className="min-h-[320px]">
          {renderStep()}
        </div>

        {/* Data usage notice */}
        <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground text-center border border-border/50">
          <p>
            📊 Usamos estas respuestas para mejorar Agro Data. 
            <strong> No vendemos tus datos.</strong>
          </p>
        </div>

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 1}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>

          {step < totalSteps ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
            >
              Siguiente
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || loading}
            >
              {loading ? 'Guardando...' : 'Comenzar'}
              <Check className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}