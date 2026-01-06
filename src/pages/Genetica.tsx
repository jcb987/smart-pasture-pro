import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dna, Plus, Award, GitBranch, Users, Sparkles, Calculator, Loader2 } from 'lucide-react';
import { useGenetics } from '@/hooks/useGenetics';
import { useAnimals } from '@/hooks/useAnimals';
import { PedigreeTree } from '@/components/genetica/PedigreeTree';
import { AddEvaluationDialog } from '@/components/genetica/AddEvaluationDialog';
import { BreedingSuggestions } from '@/components/genetica/BreedingSuggestions';
import { GeneticIndicators } from '@/components/genetica/GeneticIndicators';
import { InbreedingCalculator } from '@/components/genetica/InbreedingCalculator';

const Genetica = () => {
  const { evaluations, suggestions, loading, buildPedigree, getGeneticStats } = useGenetics();
  const { animals } = useAnimals();
  const [addEvalOpen, setAddEvalOpen] = useState(false);
  const [selectedAnimalForPedigree, setSelectedAnimalForPedigree] = useState<string>('');

  const stats = getGeneticStats();
  const activeAnimals = animals.filter(a => a.status === 'activo');
  const pedigree = selectedAnimalForPedigree ? buildPedigree(selectedAnimalForPedigree) : null;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Genética y Reproductores</h1>
            <p className="text-muted-foreground">Gestión de genética, pedigrí y selección</p>
          </div>
          <Button onClick={() => setAddEvalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Evaluación
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                Animales Evaluados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.animalsEvaluated}</div>
              <p className="text-xs text-muted-foreground">
                de {activeAnimals.length} activos
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Dna className="h-4 w-4 text-primary" />
                Valor Genético Prom.
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgGeneticValue}</div>
              <p className="text-xs text-muted-foreground">puntos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Sugerencias Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingSuggestions}</div>
              <p className="text-xs text-muted-foreground">apareamientos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-primary" />
                Total Evaluaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvaluations}</div>
              <p className="text-xs text-muted-foreground">registradas</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pedigree" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pedigree">
              <Users className="mr-2 h-4 w-4" />
              Pedigrí
            </TabsTrigger>
            <TabsTrigger value="indicators">
              <Award className="mr-2 h-4 w-4" />
              Indicadores
            </TabsTrigger>
            <TabsTrigger value="suggestions">
              <Sparkles className="mr-2 h-4 w-4" />
              Apareamientos
            </TabsTrigger>
            <TabsTrigger value="inbreeding">
              <Calculator className="mr-2 h-4 w-4" />
              Consanguinidad
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pedigree" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Seleccionar Animal</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedAnimalForPedigree} onValueChange={setSelectedAnimalForPedigree}>
                  <SelectTrigger className="max-w-md">
                    <SelectValue placeholder="Elegir animal para ver árbol genealógico" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeAnimals.map((animal) => (
                      <SelectItem key={animal.id} value={animal.id}>
                        {animal.tag_id} - {animal.name || animal.category} ({animal.sex})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            <PedigreeTree pedigree={pedigree} />
          </TabsContent>

          <TabsContent value="indicators">
            <GeneticIndicators evaluations={evaluations} stats={stats} />
          </TabsContent>

          <TabsContent value="suggestions">
            <BreedingSuggestions suggestions={suggestions} />
          </TabsContent>

          <TabsContent value="inbreeding">
            <InbreedingCalculator />
          </TabsContent>
        </Tabs>
      </div>

      <AddEvaluationDialog open={addEvalOpen} onOpenChange={setAddEvalOpen} />
    </DashboardLayout>
  );
};

export default Genetica;
