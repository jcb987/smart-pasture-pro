import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGenetics, GeneticEvaluation } from '@/hooks/useGenetics';
import { useAnimals } from '@/hooks/useAnimals';
import { Loader2, Milk, Beef, Heart, Award } from 'lucide-react';

interface AddEvaluationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedAnimalId?: string;
}

export const AddEvaluationDialog = ({ open, onOpenChange, preselectedAnimalId }: AddEvaluationDialogProps) => {
  const { createEvaluation } = useGenetics();
  const { animals } = useAnimals();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    animal_id: preselectedAnimalId || '',
    evaluation_date: new Date().toISOString().split('T')[0],
    evaluator: '',
    // Producción
    milk_production_index: '',
    meat_production_index: '',
    growth_rate_index: '',
    // Reproducción
    fertility_index: '',
    calving_ease_index: '',
    maternal_ability_index: '',
    // Conformación
    body_conformation_score: '',
    udder_score: '',
    legs_feet_score: '',
    // Salud
    disease_resistance_index: '',
    longevity_index: '',
    // General
    overall_genetic_value: '',
    reliability_percentage: '',
    notes: '',
  });

  const activeAnimals = animals.filter(a => a.status === 'activo');

  const handleSubmit = async () => {
    if (!formData.animal_id) return;

    setLoading(true);
    const evaluation: Omit<GeneticEvaluation, 'id' | 'organization_id' | 'created_at'> = {
      animal_id: formData.animal_id,
      evaluation_date: formData.evaluation_date,
      evaluator: formData.evaluator || undefined,
      milk_production_index: formData.milk_production_index ? parseFloat(formData.milk_production_index) : undefined,
      meat_production_index: formData.meat_production_index ? parseFloat(formData.meat_production_index) : undefined,
      growth_rate_index: formData.growth_rate_index ? parseFloat(formData.growth_rate_index) : undefined,
      fertility_index: formData.fertility_index ? parseFloat(formData.fertility_index) : undefined,
      calving_ease_index: formData.calving_ease_index ? parseFloat(formData.calving_ease_index) : undefined,
      maternal_ability_index: formData.maternal_ability_index ? parseFloat(formData.maternal_ability_index) : undefined,
      body_conformation_score: formData.body_conformation_score ? parseFloat(formData.body_conformation_score) : undefined,
      udder_score: formData.udder_score ? parseFloat(formData.udder_score) : undefined,
      legs_feet_score: formData.legs_feet_score ? parseFloat(formData.legs_feet_score) : undefined,
      disease_resistance_index: formData.disease_resistance_index ? parseFloat(formData.disease_resistance_index) : undefined,
      longevity_index: formData.longevity_index ? parseFloat(formData.longevity_index) : undefined,
      overall_genetic_value: formData.overall_genetic_value ? parseFloat(formData.overall_genetic_value) : undefined,
      reliability_percentage: formData.reliability_percentage ? parseFloat(formData.reliability_percentage) : undefined,
      notes: formData.notes || undefined,
    };

    const success = await createEvaluation(evaluation);
    setLoading(false);

    if (success) {
      onOpenChange(false);
      setFormData({
        animal_id: '',
        evaluation_date: new Date().toISOString().split('T')[0],
        evaluator: '',
        milk_production_index: '',
        meat_production_index: '',
        growth_rate_index: '',
        fertility_index: '',
        calving_ease_index: '',
        maternal_ability_index: '',
        body_conformation_score: '',
        udder_score: '',
        legs_feet_score: '',
        disease_resistance_index: '',
        longevity_index: '',
        overall_genetic_value: '',
        reliability_percentage: '',
        notes: '',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Evaluación Genética</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Animal *</Label>
              <Select
                value={formData.animal_id}
                onValueChange={(value) => setFormData({ ...formData, animal_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar animal" />
                </SelectTrigger>
                <SelectContent>
                  {activeAnimals.map((animal) => (
                    <SelectItem key={animal.id} value={animal.id}>
                      {animal.tag_id} - {animal.name || 'Sin nombre'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fecha de Evaluación</Label>
              <Input
                type="date"
                value={formData.evaluation_date}
                onChange={(e) => setFormData({ ...formData, evaluation_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Evaluador</Label>
            <Input
              value={formData.evaluator}
              onChange={(e) => setFormData({ ...formData, evaluator: e.target.value })}
              placeholder="Nombre del evaluador"
            />
          </div>

          <Tabs defaultValue="production" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="production" className="text-xs">
                <Milk className="h-3 w-3 mr-1" />
                Producción
              </TabsTrigger>
              <TabsTrigger value="reproduction" className="text-xs">
                <Heart className="h-3 w-3 mr-1" />
                Reproducción
              </TabsTrigger>
              <TabsTrigger value="conformation" className="text-xs">
                <Beef className="h-3 w-3 mr-1" />
                Conformación
              </TabsTrigger>
              <TabsTrigger value="health" className="text-xs">
                <Award className="h-3 w-3 mr-1" />
                Salud
              </TabsTrigger>
            </TabsList>

            <TabsContent value="production" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Índice de Leche</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.milk_production_index}
                    onChange={(e) => setFormData({ ...formData, milk_production_index: e.target.value })}
                    placeholder="0-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Índice de Carne</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.meat_production_index}
                    onChange={(e) => setFormData({ ...formData, meat_production_index: e.target.value })}
                    placeholder="0-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tasa de Crecimiento</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.growth_rate_index}
                    onChange={(e) => setFormData({ ...formData, growth_rate_index: e.target.value })}
                    placeholder="0-100"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reproduction" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Fertilidad</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.fertility_index}
                    onChange={(e) => setFormData({ ...formData, fertility_index: e.target.value })}
                    placeholder="0-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Facilidad de Parto</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.calving_ease_index}
                    onChange={(e) => setFormData({ ...formData, calving_ease_index: e.target.value })}
                    placeholder="0-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Habilidad Materna</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.maternal_ability_index}
                    onChange={(e) => setFormData({ ...formData, maternal_ability_index: e.target.value })}
                    placeholder="0-100"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="conformation" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Conformación Corporal</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.body_conformation_score}
                    onChange={(e) => setFormData({ ...formData, body_conformation_score: e.target.value })}
                    placeholder="1-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sistema Mamario</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.udder_score}
                    onChange={(e) => setFormData({ ...formData, udder_score: e.target.value })}
                    placeholder="1-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Patas y Pezuñas</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.legs_feet_score}
                    onChange={(e) => setFormData({ ...formData, legs_feet_score: e.target.value })}
                    placeholder="1-9"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="health" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Resistencia a Enfermedades</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.disease_resistance_index}
                    onChange={(e) => setFormData({ ...formData, disease_resistance_index: e.target.value })}
                    placeholder="0-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Longevidad</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.longevity_index}
                    onChange={(e) => setFormData({ ...formData, longevity_index: e.target.value })}
                    placeholder="0-100"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <Label>Valor Genético General</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.overall_genetic_value}
                onChange={(e) => setFormData({ ...formData, overall_genetic_value: e.target.value })}
                placeholder="0-100"
              />
            </div>
            <div className="space-y-2">
              <Label>Confiabilidad (%)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.reliability_percentage}
                onChange={(e) => setFormData({ ...formData, reliability_percentage: e.target.value })}
                placeholder="0-100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observaciones adicionales..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !formData.animal_id}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Evaluación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
