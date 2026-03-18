import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Home, MapPin, Beef, Milk, Target,
  ArrowRight, ArrowLeft, Check, Loader2,
  Phone, User,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FarmSetupWizardProps {
  open: boolean;
  onComplete: () => void;
  userId: string;
  organizationId: string | null;
}

const productionOptions = [
  {
    value: 'leche',
    label: 'Producción de Leche',
    description: 'Vacas lecheras, registros de ordeño, calidad de leche',
    icon: Milk,
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-950 border-blue-200',
  },
  {
    value: 'carne',
    label: 'Producción de Carne',
    description: 'Engorde, peso, clasificación y venta de ganado',
    icon: Beef,
    color: 'text-red-600',
    bg: 'bg-red-50 dark:bg-red-950 border-red-200',
  },
  {
    value: 'doble_proposito',
    label: 'Doble Propósito',
    description: 'Combina producción de leche y carne',
    icon: Target,
    color: 'text-green-600',
    bg: 'bg-green-50 dark:bg-green-950 border-green-200',
  },
];

export function FarmSetupWizard({ open, onComplete, userId, organizationId }: FarmSetupWizardProps) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    farmName: '',
    ownerName: '',
    phone: '',
    municipio: '',
    departamento: '',
    productionType: '',
  });

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const canProceed = () => {
    if (step === 1) return formData.farmName.trim().length > 0;
    if (step === 2) return formData.municipio.trim().length > 0 && formData.departamento.trim().length > 0;
    if (step === 3) return formData.productionType.length > 0;
    return false;
  };

  const handleSave = async () => {
    if (!canProceed()) return;
    setSaving(true);

    try {
      // 1. Update profile: farm_name, full_name, phone
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          farm_name: formData.farmName.trim(),
          full_name: formData.ownerName.trim() || undefined,
          phone: formData.phone.trim() || undefined,
        })
        .eq('user_id', userId);

      if (profileError) throw profileError;

      // 2. Update organization name with farm name
      if (organizationId) {
        await supabase
          .from('organizations')
          .update({ name: formData.farmName.trim() })
          .eq('id', organizationId);

        // 3. Upsert organization_settings: municipality, region
        await supabase
          .from('organization_settings')
          .upsert(
            {
              organization_id: organizationId,
              municipality: formData.municipio.trim(),
              region: formData.departamento.trim(),
            },
            { onConflict: 'organization_id' }
          );

        // 4. Save production type to localStorage (no dedicated DB column)
        localStorage.setItem(
          `agrodata_prod_type_${organizationId}`,
          formData.productionType
        );
      }

      toast({
        title: '¡Finca configurada!',
        description: `${formData.farmName} está lista para usar AgroData`,
      });

      onComplete();
    } catch (err: any) {
      console.error('[FarmSetupWizard] Error saving:', err);
      toast({
        title: 'Error al guardar',
        description: err?.message || 'No se pudo guardar la configuración',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const set = (field: keyof typeof formData, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Home className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Datos de tu Finca</h3>
              <p className="text-sm text-muted-foreground">Empieza con el nombre de tu predio</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="farmName">
                Nombre del Predio / Finca <span className="text-destructive">*</span>
              </Label>
              <Input
                id="farmName"
                placeholder="Ej: Hacienda La Esperanza"
                value={formData.farmName}
                onChange={e => set('farmName', e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerName" className="flex items-center gap-2">
                <User className="h-4 w-4" /> Propietario / Responsable
              </Label>
              <Input
                id="ownerName"
                placeholder="Tu nombre completo"
                value={formData.ownerName}
                onChange={e => set('ownerName', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> Teléfono de contacto
              </Label>
              <Input
                id="phone"
                placeholder="Ej: +57 310 000 0000"
                value={formData.phone}
                onChange={e => set('phone', e.target.value)}
                type="tel"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <MapPin className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Ubicación del Predio</h3>
              <p className="text-sm text-muted-foreground">Se usará en documentos oficiales (guías de movilización, certificados)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="municipio">
                Municipio <span className="text-destructive">*</span>
              </Label>
              <Input
                id="municipio"
                placeholder="Ej: Montería"
                value={formData.municipio}
                onChange={e => set('municipio', e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="departamento">
                Departamento <span className="text-destructive">*</span>
              </Label>
              <Input
                id="departamento"
                placeholder="Ej: Córdoba"
                value={formData.departamento}
                onChange={e => set('departamento', e.target.value)}
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground border">
              <MapPin className="h-4 w-4 inline mr-1" />
              Estos datos aparecerán pre-llenados en tus guías de movilización y certificados de vacunación.
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Beef className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Tipo de Producción</h3>
              <p className="text-sm text-muted-foreground">¿Cuál es el enfoque principal de tu finca?</p>
            </div>

            <div className="space-y-3">
              {productionOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => set('productionType', option.value)}
                  className="w-full text-left"
                >
                  <Card
                    className={`transition-all border-2 hover:shadow-md ${
                      formData.productionType === option.value
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${option.bg}`}>
                        <option.icon className={`h-6 w-6 ${option.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{option.label}</p>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                      {formData.productionType === option.value && (
                        <Check className="h-5 w-5 text-primary shrink-0" />
                      )}
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>

            {/* Summary */}
            {formData.productionType && (
              <div className="bg-muted/50 rounded-lg p-4 border mt-4 space-y-2">
                <p className="text-sm font-medium text-foreground">Resumen de configuración</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="secondary">🏡 {formData.farmName}</Badge>
                  {formData.ownerName && <Badge variant="secondary">👤 {formData.ownerName}</Badge>}
                  <Badge variant="secondary">📍 {formData.municipio}, {formData.departamento}</Badge>
                  <Badge variant="secondary">
                    {productionOptions.find(o => o.value === formData.productionType)?.label}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-md"
        onPointerDownOutside={e => e.preventDefault()}
        onEscapeKeyDown={e => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            Configura tu Finca
          </DialogTitle>
          <DialogDescription className="text-center">
            Paso {step} de {totalSteps} — Solo toma 2 minutos
          </DialogDescription>
        </DialogHeader>

        <Progress value={progress} className="h-1.5 mb-2" />

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-2">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                s < step
                  ? 'w-6 bg-primary'
                  : s === step
                  ? 'w-8 bg-primary'
                  : 'w-4 bg-muted'
              }`}
            />
          ))}
        </div>

        <div className="min-h-[340px] py-2">
          {renderStep()}
        </div>

        <div className="flex justify-between pt-2 border-t">
          <Button
            variant="outline"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 1 || saving}
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
              onClick={handleSave}
              disabled={!canProceed() || saving}
              className="min-w-[120px]"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  ¡Comenzar!
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
