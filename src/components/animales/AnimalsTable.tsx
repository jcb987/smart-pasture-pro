import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Eye, Edit, Scale, Trash2 } from 'lucide-react';
import { type Animal, type AnimalCategory } from '@/hooks/useAnimals';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/shared/PaginationControls';

interface AnimalsTableProps {
  animals: Animal[];
  onView: (animal: Animal) => void;
  onEdit: (animal: Animal) => void;
  onAddWeight: (animal: Animal) => void;
  onDelete: (animal: Animal) => void;
}

const categoryLabels: Record<AnimalCategory, string> = {
  vaca: 'Vaca',
  toro: 'Toro',
  novilla: 'Novilla',
  novillo: 'Novillo',
  ternera: 'Ternera',
  ternero: 'Ternero',
  becerra: 'Becerra',
  becerro: 'Becerro',
  bufala: 'Búfala',
  bufalo: 'Búfalo',
};

const categoryColors: Record<AnimalCategory, string> = {
  vaca: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  toro: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  novilla: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  novillo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  ternera: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
  ternero: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  becerra: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-200',
  becerro: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  bufala: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  bufalo: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const calculateAge = (birthDate: string | null) => {
  if (!birthDate) return '-';
  const birth = new Date(birthDate);
  const today = new Date();
  const months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
  
  if (months < 12) {
    return `${months}m`;
  }
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return remainingMonths > 0 ? `${years}a ${remainingMonths}m` : `${years}a`;
};

export function AnimalsTable({ animals, onView, onEdit, onAddWeight, onDelete }: AnimalsTableProps) {
  const pagination = usePagination(animals, {
    initialPageSize: 25,
    pageSizeOptions: [10, 25, 50, 100],
  });

  if (animals.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Arete</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Raza</TableHead>
              <TableHead>Edad</TableHead>
              <TableHead>Peso (kg)</TableHead>
              <TableHead>Lote</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagination.paginatedData.map((animal) => (
              <TableRow 
                key={animal.id} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onView(animal)}
              >
                <TableCell className="font-medium">{animal.tag_id}</TableCell>
                <TableCell>{animal.name || '-'}</TableCell>
                <TableCell>
                  <Badge className={categoryColors[animal.category]} variant="secondary">
                    {categoryLabels[animal.category]}
                  </Badge>
                </TableCell>
                <TableCell>{animal.breed || '-'}</TableCell>
                <TableCell>{calculateAge(animal.birth_date)}</TableCell>
                <TableCell>
                  {animal.current_weight ? (
                    <span>{animal.current_weight}</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>{animal.lot_name || '-'}</TableCell>
                <TableCell>
                  <Badge variant={animal.status === 'activo' ? 'default' : 'secondary'}>
                    {animal.status}
                  </Badge>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover">
                      <DropdownMenuItem onClick={() => onView(animal)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalle
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(animal)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAddWeight(animal)}>
                        <Scale className="mr-2 h-4 w-4" />
                        Registrar peso
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDelete(animal)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <PaginationControls
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          pageSize={pagination.pageSize}
          pageSizeOptions={pagination.pageSizeOptions}
          rangeDisplay={pagination.rangeDisplay}
          hasNextPage={pagination.hasNextPage}
          hasPreviousPage={pagination.hasPreviousPage}
          onPageChange={pagination.goToPage}
          onPageSizeChange={pagination.setPageSize}
          onFirstPage={pagination.firstPage}
          onLastPage={pagination.lastPage}
          onNextPage={pagination.nextPage}
          onPreviousPage={pagination.previousPage}
        />
      )}
    </div>
  );
}
