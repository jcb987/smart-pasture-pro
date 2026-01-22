import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Settings, Loader2, Hash, ToggleLeft, Type, BarChart3 } from 'lucide-react';
import { ScoreDefinition, CreateScoreDefinitionData } from '@/hooks/useCustomScores';

interface ScoreDefinitionsManagerProps {
  definitions: ScoreDefinition[];
  loading: boolean;
  onCreate: (data: CreateScoreDefinitionData) => Promise<{ success: boolean }>;
  onDelete: (id: string) => Promise<{ success: boolean }>;
}

const typeIcons = {
  numeric: Hash,
  scale: BarChart3,
  boolean: ToggleLeft,
  text: Type,
};

const typeLabels = {
  numeric: 'Numérico',
  scale: 'Escala',
  boolean: 'Sí/No',
  text: 'Texto',
};

export const ScoreDefinitionsManager = ({
  definitions,
  loading,
  onCreate,
  onDelete,
}: ScoreDefinitionsManagerProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateScoreDefinitionData>({
    name: '',
    description: '',
    score_type: 'numeric',
    min_value: 1,
    max_value: 10,
  });
  const [scaleLabels, setScaleLabels] = useState<{ value: string; label: string }[]>([
    { value: '1', label: 'Malo' },
    { value: '2', label: 'Regular' },
    { value: '3', label: 'Bueno' },
    { value: '4', label: 'Excelente' },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const submitData: CreateScoreDefinitionData = {
      ...formData,
    };

    if (formData.score_type === 'scale') {
      submitData.scale_labels = scaleLabels.reduce((acc, item) => {
        acc[item.value] = item.label;
        return acc;
      }, {} as Record<string, string>);
    }

    const result = await onCreate(submitData);
    setSubmitting(false);

    if (result.success) {
      setDialogOpen(false);
      setFormData({
        name: '',
        description: '',
        score_type: 'numeric',
        min_value: 1,
        max_value: 10,
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Tipos de Scores
              </CardTitle>
              <CardDescription>
                Configura los tipos de evaluación personalizados
              </CardDescription>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Tipo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {definitions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay tipos de scores configurados
            </p>
          ) : (
            <div className="space-y-3">
              {definitions.map(def => {
                const Icon = typeIcons[def.score_type];
                return (
                  <div
                    key={def.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{def.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {def.description || typeLabels[def.score_type]}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {typeLabels[def.score_type]}
                      </Badge>
                      {def.score_type === 'numeric' && def.min_value !== null && def.max_value !== null && (
                        <Badge variant="secondary">
                          {def.min_value} - {def.max_value}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(def.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Tipo de Score</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Condición corporal"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe qué mide este score..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Valor</Label>
              <Select
                value={formData.score_type}
                onValueChange={(value: any) => setFormData({ ...formData, score_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="numeric">Numérico (1-10, 0-100, etc.)</SelectItem>
                  <SelectItem value="scale">Escala (Malo, Regular, Bueno...)</SelectItem>
                  <SelectItem value="boolean">Sí / No</SelectItem>
                  <SelectItem value="text">Texto libre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.score_type === 'numeric' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min">Valor mínimo</Label>
                  <Input
                    id="min"
                    type="number"
                    value={formData.min_value || 1}
                    onChange={(e) => setFormData({ ...formData, min_value: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max">Valor máximo</Label>
                  <Input
                    id="max"
                    type="number"
                    value={formData.max_value || 10}
                    onChange={(e) => setFormData({ ...formData, max_value: Number(e.target.value) })}
                  />
                </div>
              </div>
            )}

            {formData.score_type === 'scale' && (
              <div className="space-y-2">
                <Label>Opciones de escala</Label>
                <div className="space-y-2">
                  {scaleLabels.map((item, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        value={item.value}
                        onChange={(e) => {
                          const newLabels = [...scaleLabels];
                          newLabels[idx].value = e.target.value;
                          setScaleLabels(newLabels);
                        }}
                        placeholder="Valor"
                        className="w-20"
                      />
                      <Input
                        value={item.label}
                        onChange={(e) => {
                          const newLabels = [...scaleLabels];
                          newLabels[idx].label = e.target.value;
                          setScaleLabels(newLabels);
                        }}
                        placeholder="Etiqueta"
                        className="flex-1"
                      />
                      {scaleLabels.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setScaleLabels(scaleLabels.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setScaleLabels([...scaleLabels, { value: String(scaleLabels.length + 1), label: '' }])}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar opción
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting || !formData.name}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Tipo
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
