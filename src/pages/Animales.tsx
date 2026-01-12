import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Beef, Plus, FileSpreadsheet, AlertTriangle, Upload, Brain, Calculator, List } from 'lucide-react';
import { useAnimals, type Animal, type AnimalFilters } from '@/hooks/useAnimals';
import { CreateAnimalDialog } from '@/components/animales/CreateAnimalDialog';
import { AnimalEditDetailDialog } from '@/components/animales/AnimalEditDetailDialog';
import { AnimalsTable } from '@/components/animales/AnimalsTable';
import { AnimalsFilters } from '@/components/animales/AnimalsFilters';
import { AddWeightDialog } from '@/components/animales/AddWeightDialog';
import { ExportDialog } from '@/components/animales/ExportDialog';
import { SmartAnimalImporter } from '@/components/animales/SmartAnimalImporter';
import { AnimalScanner } from '@/components/animales/AnimalScanner';
import { WeightPredictionCard } from '@/components/animales/WeightPredictionCard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const Animales = () => {
  const {
    animals,
    loading,
    createAnimal,
    updateAnimal,
    deleteAnimal,
    getAnimalEvents,
    addAnimalEvent,
    getStats,
    filterAnimals,
    getAlertas,
    fetchAnimals,
  } = useAnimals();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [weightDialogOpen, setWeightDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  
  const [filters, setFilters] = useState<AnimalFilters>({
    search: '',
    category: 'all',
    status: 'all',
    sex: 'all',
    lot: 'all',
  });

  const stats = getStats();
  const filteredAnimals = filterAnimals(filters);
  const alertas = getAlertas();

  const handleViewAnimal = (animal: Animal) => {
    setSelectedAnimal(animal);
    setDetailDialogOpen(true);
  };

  const handleEditAnimal = (animal: Animal) => {
    // Por ahora solo abrimos el detalle
    setSelectedAnimal(animal);
    setDetailDialogOpen(true);
  };

  const handleAddWeight = (animal: Animal) => {
    setSelectedAnimal(animal);
    setWeightDialogOpen(true);
  };

  const handleDeleteAnimal = (animal: Animal) => {
    setSelectedAnimal(animal);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedAnimal) {
      await deleteAnimal(selectedAnimal.id);
      setDeleteDialogOpen(false);
      setSelectedAnimal(null);
    }
  };

  const handleWeightSubmit = async (animalId: string, weight: number, date: string, notes: string) => {
    await addAnimalEvent({
      animal_id: animalId,
      event_type: 'pesaje',
      event_date: date,
      weight,
      notes,
    });
  };

  const handleAnimalScanned = (tagId: string) => {
    const animal = animals.find(a => a.tag_id.toUpperCase() === tagId.toUpperCase());
    if (animal) {
      setSelectedAnimal(animal);
      setDetailDialogOpen(true);
    } else {
      toast.info(`Animal ${tagId} no encontrado en el sistema`);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inventario de Animales</h1>
            <p className="text-muted-foreground">Registro y control total del hato</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
              <Brain className="mr-2 h-4 w-4" />
              Importar Inteligente
            </Button>
            <Button variant="outline" onClick={() => setExportDialogOpen(true)}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Animal
            </Button>
          </div>
        </div>

        {/* Scanner + Stats */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-5">
          <AnimalScanner 
            onAnimalFound={handleAnimalScanned} 
            className="md:col-span-1"
          />
          
          <Card className="md:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Hato</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">animales activos</p>
            </CardContent>
          </Card>
          <Card className="md:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Hembras</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.hembras}</div>
              <p className="text-xs text-muted-foreground">
                {stats.porCategoria.vaca} vacas, {stats.porCategoria.novilla} novillas
              </p>
            </CardContent>
          </Card>
          <Card className="md:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Machos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.machos}</div>
              <p className="text-xs text-muted-foreground">
                {stats.porCategoria.toro} toros, {stats.porCategoria.novillo} novillos
              </p>
            </CardContent>
          </Card>
          <Card className="md:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Lotes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.lotes.length}</div>
              <p className="text-xs text-muted-foreground">grupos activos</p>
            </CardContent>
          </Card>
        </div>
        {/* Alertas */}
        {alertas.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                Alertas ({alertas.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                {alertas.length} animales sin pesaje reciente (más de 30 días)
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tabs for Animals */}
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">
              <List className="mr-1 h-4 w-4" />
              Inventario
            </TabsTrigger>
            <TabsTrigger value="prediction">
              <Calculator className="mr-1 h-4 w-4" />
              Predicción Peso
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            {/* Filters */}
            <AnimalsFilters
              filters={filters}
              onFiltersChange={setFilters}
              lotes={stats.lotes}
            />

            {/* Table */}
            <Card>
              <CardHeader>
                <CardTitle>Listado de Animales</CardTitle>
                <CardDescription>
                  {filteredAnimals.length} de {animals.length} animales
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : filteredAnimals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Beef className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-medium">
                      {animals.length === 0 ? 'Sin animales registrados' : 'Sin resultados'}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {animals.length === 0 
                        ? 'Comienza registrando tu primer animal'
                        : 'Intenta ajustar los filtros de búsqueda'}
                    </p>
                    {animals.length === 0 && (
                      <Button onClick={() => setCreateDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Registrar Animal
                      </Button>
                    )}
                  </div>
                ) : (
                  <AnimalsTable
                    animals={filteredAnimals}
                    onView={handleViewAnimal}
                    onEdit={handleEditAnimal}
                    onAddWeight={handleAddWeight}
                    onDelete={handleDeleteAnimal}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prediction">
            <WeightPredictionCard animals={animals} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <CreateAnimalDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={createAnimal}
      />

      <AnimalEditDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        animal={selectedAnimal}
        animals={animals}
        getEvents={getAnimalEvents}
        onSave={updateAnimal}
      />

      <AddWeightDialog
        open={weightDialogOpen}
        onOpenChange={setWeightDialogOpen}
        animal={selectedAnimal}
        onSubmit={handleWeightSubmit}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar animal?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente a {selectedAnimal?.name || selectedAnimal?.tag_id} 
              y todo su historial. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        availableLots={stats.lotes}
      />

      <SmartAnimalImporter
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        existingAnimals={animals}
        onImportComplete={fetchAnimals}
      />
    </DashboardLayout>
  );
};

export default Animales;
