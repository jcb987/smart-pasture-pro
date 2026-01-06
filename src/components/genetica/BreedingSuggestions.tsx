import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useGenetics, BreedingSuggestion } from '@/hooks/useGenetics';
import { useAnimals } from '@/hooks/useAnimals';
import { Sparkles, AlertTriangle, Check, X, Plus, Loader2 } from 'lucide-react';

interface BreedingSuggestionsProps {
  suggestions: BreedingSuggestion[];
}

const getRiskColor = (coefficient: number | undefined) => {
  if (!coefficient) return 'bg-muted text-muted-foreground';
  if (coefficient > 25) return 'bg-destructive text-destructive-foreground';
  if (coefficient > 12.5) return 'bg-orange-500 text-white';
  if (coefficient > 6.25) return 'bg-yellow-500 text-black';
  return 'bg-green-500 text-white';
};

const getRiskLabel = (coefficient: number | undefined) => {
  if (!coefficient) return 'N/A';
  if (coefficient > 25) return 'Muy Alto';
  if (coefficient > 12.5) return 'Alto';
  if (coefficient > 6.25) return 'Moderado';
  return 'Bajo';
};

export const BreedingSuggestions = ({ suggestions }: BreedingSuggestionsProps) => {
  const { animals } = useAnimals();
  const { createSuggestion, updateSuggestionStatus, deleteSuggestion, generateBreedingSuggestions, calculateInbreeding } = useGenetics();
  const [selectedFemale, setSelectedFemale] = useState<string>('');
  const [generatedSuggestions, setGeneratedSuggestions] = useState<BreedingSuggestion[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newSuggestion, setNewSuggestion] = useState({
    female_id: '',
    male_id: '',
    semen_code: '',
    bull_name: '',
    suggested_date: new Date().toISOString().split('T')[0],
    priority: '1',
    notes: '',
  });

  const females = animals.filter(a => a.sex === 'hembra' && a.status === 'activo');
  const males = animals.filter(a => a.sex === 'macho' && a.status === 'activo');

  const getAnimalName = (id: string) => {
    const animal = animals.find(a => a.id === id);
    return animal ? `${animal.tag_id}${animal.name ? ` - ${animal.name}` : ''}` : 'Desconocido';
  };

  const handleGenerateSuggestions = () => {
    if (!selectedFemale) return;
    const generated = generateBreedingSuggestions(selectedFemale);
    setGeneratedSuggestions(generated);
  };

  const handleSaveSuggestion = async (suggestion: BreedingSuggestion) => {
    setLoading(true);
    await createSuggestion({
      female_id: suggestion.female_id,
      male_id: suggestion.male_id,
      bull_name: suggestion.bull_name,
      priority: suggestion.priority,
      inbreeding_coefficient: suggestion.inbreeding_coefficient,
      compatibility_score: suggestion.compatibility_score,
      expected_improvement: suggestion.expected_improvement,
      status: 'pendiente',
    });
    setLoading(false);
  };

  const handleAddManualSuggestion = async () => {
    if (!newSuggestion.female_id) return;

    setLoading(true);
    let inbreedingCoef = undefined;

    if (newSuggestion.male_id) {
      const result = calculateInbreeding(newSuggestion.female_id, newSuggestion.male_id);
      inbreedingCoef = result.coefficient;
    }

    await createSuggestion({
      female_id: newSuggestion.female_id,
      male_id: newSuggestion.male_id || undefined,
      semen_code: newSuggestion.semen_code || undefined,
      bull_name: newSuggestion.bull_name || undefined,
      suggested_date: newSuggestion.suggested_date || undefined,
      priority: parseInt(newSuggestion.priority),
      inbreeding_coefficient: inbreedingCoef,
      status: 'pendiente',
      notes: newSuggestion.notes || undefined,
    });

    setLoading(false);
    setAddDialogOpen(false);
    setNewSuggestion({
      female_id: '',
      male_id: '',
      semen_code: '',
      bull_name: '',
      suggested_date: new Date().toISOString().split('T')[0],
      priority: '1',
      notes: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Generador automático */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generador de Sugerencias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label>Seleccionar Hembra</Label>
              <Select value={selectedFemale} onValueChange={setSelectedFemale}>
                <SelectTrigger>
                  <SelectValue placeholder="Elegir hembra para apareamiento" />
                </SelectTrigger>
                <SelectContent>
                  {females.map((female) => (
                    <SelectItem key={female.id} value={female.id}>
                      {female.tag_id} - {female.name || female.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerateSuggestions} disabled={!selectedFemale}>
              <Sparkles className="mr-2 h-4 w-4" />
              Generar Sugerencias
            </Button>
            <Button variant="outline" onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Manual
            </Button>
          </div>

          {generatedSuggestions.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-3">Sugerencias Generadas para {getAnimalName(selectedFemale)}</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Toro</TableHead>
                    <TableHead>Compatibilidad</TableHead>
                    <TableHead>Consanguinidad</TableHead>
                    <TableHead>Mejoras Esperadas</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generatedSuggestions.slice(0, 5).map((suggestion) => (
                    <TableRow key={suggestion.id}>
                      <TableCell className="font-medium">{suggestion.bull_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${suggestion.compatibility_score}%` }}
                            />
                          </div>
                          <span className="text-sm">{Math.round(suggestion.compatibility_score || 0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRiskColor(suggestion.inbreeding_coefficient)}>
                          {getRiskLabel(suggestion.inbreeding_coefficient)} ({suggestion.inbreeding_coefficient?.toFixed(1)}%)
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-x-2">
                          {suggestion.expected_improvement?.milk && (
                            <span>Leche: +{suggestion.expected_improvement.milk}</span>
                          )}
                          {suggestion.expected_improvement?.meat && (
                            <span>Carne: +{suggestion.expected_improvement.meat}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => handleSaveSuggestion(suggestion)} disabled={loading}>
                          Guardar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de sugerencias guardadas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sugerencias de Apareamiento Guardadas</CardTitle>
        </CardHeader>
        <CardContent>
          {suggestions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hay sugerencias de apareamiento guardadas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hembra</TableHead>
                  <TableHead>Macho/Semen</TableHead>
                  <TableHead>Fecha Sugerida</TableHead>
                  <TableHead>Consanguinidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suggestions.map((suggestion) => (
                  <TableRow key={suggestion.id}>
                    <TableCell className="font-medium">{getAnimalName(suggestion.female_id)}</TableCell>
                    <TableCell>
                      {suggestion.male_id ? getAnimalName(suggestion.male_id) : suggestion.bull_name || suggestion.semen_code || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {suggestion.suggested_date
                        ? new Date(suggestion.suggested_date).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {suggestion.inbreeding_coefficient !== undefined ? (
                        <Badge className={getRiskColor(suggestion.inbreeding_coefficient)}>
                          {suggestion.inbreeding_coefficient.toFixed(1)}%
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={suggestion.status === 'ejecutado' ? 'default' : suggestion.status === 'rechazado' ? 'destructive' : 'secondary'}>
                        {suggestion.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {suggestion.status === 'pendiente' && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateSuggestionStatus(suggestion.id, 'ejecutado', new Date().toISOString().split('T')[0])}
                          >
                            <Check className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateSuggestionStatus(suggestion.id, 'rechazado')}
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteSuggestion(suggestion.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog para agregar manualmente */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Sugerencia de Apareamiento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Hembra *</Label>
              <Select
                value={newSuggestion.female_id}
                onValueChange={(value) => setNewSuggestion({ ...newSuggestion, female_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar hembra" />
                </SelectTrigger>
                <SelectContent>
                  {females.map((female) => (
                    <SelectItem key={female.id} value={female.id}>
                      {female.tag_id} - {female.name || female.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Toro (del hato)</Label>
              <Select
                value={newSuggestion.male_id}
                onValueChange={(value) => setNewSuggestion({ ...newSuggestion, male_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar toro o dejar vacío" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Ninguno (usar semen)</SelectItem>
                  {males.map((male) => (
                    <SelectItem key={male.id} value={male.id}>
                      {male.tag_id} - {male.name || male.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código de Semen</Label>
                <Input
                  value={newSuggestion.semen_code}
                  onChange={(e) => setNewSuggestion({ ...newSuggestion, semen_code: e.target.value })}
                  placeholder="Ej: 123ABC"
                />
              </div>
              <div className="space-y-2">
                <Label>Nombre del Toro</Label>
                <Input
                  value={newSuggestion.bull_name}
                  onChange={(e) => setNewSuggestion({ ...newSuggestion, bull_name: e.target.value })}
                  placeholder="Ej: Campeón XL"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha Sugerida</Label>
                <Input
                  type="date"
                  value={newSuggestion.suggested_date}
                  onChange={(e) => setNewSuggestion({ ...newSuggestion, suggested_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select
                  value={newSuggestion.priority}
                  onValueChange={(value) => setNewSuggestion({ ...newSuggestion, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Alta</SelectItem>
                    <SelectItem value="2">Media</SelectItem>
                    <SelectItem value="3">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={newSuggestion.notes}
                onChange={(e) => setNewSuggestion({ ...newSuggestion, notes: e.target.value })}
                placeholder="Observaciones..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddManualSuggestion} disabled={loading || !newSuggestion.female_id}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
