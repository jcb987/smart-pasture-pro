import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Beef, Plus, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { useAnimals, type Animal, type AnimalFilters } from '@/hooks/useAnimals';
import { CreateAnimalDialog } from '@/components/animales/CreateAnimalDialog';
import { AnimalDetailDialog } from '@/components/animales/AnimalDetailDialog';
import { AnimalsTable } from '@/components/animales/AnimalsTable';
import { AnimalsFilters } from '@/components/animales/AnimalsFilters';
import { AddWeightDialog } from '@/components/animales/AddWeightDialog';
import { ExportDialog } from '@/components/animales/ExportDialog';
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
  } = useAnimals();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [weightDialogOpen, setWeightDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
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
            <Button variant="outline" onClick={() => setExportDialogOpen(true)}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Exportar a Excel
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Animal
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Hato</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">animales activos</p>
            </CardContent>
          </Card>
          <Card>
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
          <Card>
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
          <Card>
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
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
                Alertas ({alertas.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-amber-700">
                {alertas.length} animales sin pesaje reciente (más de 30 días)
              </p>
            </CardContent>
          </Card>
        )}

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
      </div>

      {/* Dialogs */}
      <CreateAnimalDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={createAnimal}
      />

      <AnimalDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        animal={selectedAnimal}
        getEvents={getAnimalEvents}
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
    </DashboardLayout>
  );
};

export default Animales;
