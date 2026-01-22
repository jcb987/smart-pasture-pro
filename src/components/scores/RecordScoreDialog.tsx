import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Loader2 } from 'lucide-react';
import { ScoreDefinition, CreateAnimalScoreData } from '@/hooks/useCustomScores';
import { supabase } from '@/integrations/supabase/client';

interface RecordScoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateAnimalScoreData) => Promise<{ success: boolean }>;
  definitions: ScoreDefinition[];
  preselectedAnimalId?: string;
}

interface Animal {
  id: string;
  tag_id: string;
  name: string | null;
}

export const RecordScoreDialog = ({
  open,
  onOpenChange,
  onSubmit,
  definitions,
  preselectedAnimalId,
}: RecordScoreDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [selectedAnimal, setSelectedAnimal] = useState(preselectedAnimalId || '');
  const [selectedDefinition, setSelectedDefinition] = useState('');
  const [numericValue, setNumericValue] = useState<number>(5);
  const [textValue, setTextValue] = useState('');
  const [booleanValue, setBooleanValue] = useState(false);
  const [scaleValue, setScaleValue] = useState('');
  const [notes, setNotes] = useState('');

  const selectedDef = definitions.find(d => d.id === selectedDefinition);

  useEffect(() => {
    const fetchAnimals = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .single();

      if (profile?.organization_id) {
        const { data } = await supabase
          .from('animals')
          .select('id, tag_id, name')
          .eq('organization_id', profile.organization_id)
          .eq('status', 'activo')
          .order('tag_id');

        setAnimals(data || []);
      }
    };

    if (open) {
      fetchAnimals();
      if (preselectedAnimalId) {
        setSelectedAnimal(preselectedAnimalId);
      }
    }
  }, [open, preselectedAnimalId]);

  useEffect(() => {
    // Reset values when definition changes
    if (selectedDef) {
      if (selectedDef.score_type === 'numeric' && selectedDef.min_value !== null) {
        setNumericValue(Math.round((selectedDef.min_value + (selectedDef.max_value || 10)) / 2));
      }
    }
  }, [selectedDefinition, selectedDef]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimal || !selectedDefinition) return;

    setLoading(true);

    const scoreData: CreateAnimalScoreData = {
      animal_id: selectedAnimal,
      score_definition_id: selectedDefinition,
      notes: notes || undefined,
    };

    if (selectedDef) {
      switch (selectedDef.score_type) {
        case 'numeric':
          scoreData.numeric_value = numericValue;
          break;
        case 'boolean':
          scoreData.boolean_value = booleanValue;
          break;
        case 'text':
          scoreData.text_value = textValue;
          break;
        case 'scale':
          scoreData.numeric_value = Number(scaleValue);
          break;
      }
    }

    const result = await onSubmit(scoreData);
    setLoading(false);

    if (result.success) {
      onOpenChange(false);
      // Reset form
      setSelectedAnimal(preselectedAnimalId || '');
      setSelectedDefinition('');
      setNumericValue(5);
      setTextValue('');
      setBooleanValue(false);
      setScaleValue('');
      setNotes('');
    }
  };

  const renderValueInput = () => {
    if (!selectedDef) return null;

    switch (selectedDef.score_type) {
      case 'numeric':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Valor</Label>
              <span className="text-2xl font-bold text-primary">{numericValue}</span>
            </div>
            <Slider
              value={[numericValue]}
              onValueChange={([val]) => setNumericValue(val)}
              min={selectedDef.min_value || 1}
              max={selectedDef.max_value || 10}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{selectedDef.min_value || 1}</span>
              <span>{selectedDef.max_value || 10}</span>
            </div>
          </div>
        );

      case 'boolean':
        return (
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <Label htmlFor="boolean-value" className="text-base">
              ¿{selectedDef.name}?
            </Label>
            <Switch
              id="boolean-value"
              checked={booleanValue}
              onCheckedChange={setBooleanValue}
            />
          </div>
        );

      case 'text':
        return (
          <div className="space-y-2">
            <Label htmlFor="text-value">Valor</Label>
            <Textarea
              id="text-value"
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder="Ingresa el valor..."
              rows={3}
            />
          </div>
        );

      case 'scale':
        const scaleLabels = selectedDef.scale_labels as Record<string, string> | null;
        return (
          <div className="space-y-2">
            <Label>Selecciona el nivel</Label>
            <div className="grid grid-cols-2 gap-2">
              {scaleLabels && Object.entries(scaleLabels).map(([value, label]) => (
                <Button
                  key={value}
                  type="button"
                  variant={scaleValue === value ? 'default' : 'outline'}
                  onClick={() => setScaleValue(value)}
                  className="justify-start"
                >
                  <span className="font-bold mr-2">{value}</span>
                  {label}
                </Button>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Score</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!preselectedAnimalId && (
            <div className="space-y-2">
              <Label>Animal *</Label>
              <Select value={selectedAnimal} onValueChange={setSelectedAnimal}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un animal" />
                </SelectTrigger>
                <SelectContent>
                  {animals.map(animal => (
                    <SelectItem key={animal.id} value={animal.id}>
                      {animal.tag_id} {animal.name ? `- ${animal.name}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Tipo de Score *</Label>
            <Select value={selectedDefinition} onValueChange={setSelectedDefinition}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                {definitions.map(def => (
                  <SelectItem key={def.id} value={def.id}>
                    {def.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedDef && (
            <div className="p-4 bg-muted/50 rounded-lg">
              {renderValueInput()}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones adicionales..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !selectedAnimal || !selectedDefinition}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Score
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
