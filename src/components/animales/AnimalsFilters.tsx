import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { type AnimalFilters, type AnimalCategory, type AnimalStatus, type AnimalSex } from '@/hooks/useAnimals';

interface AnimalsFiltersProps {
  filters: AnimalFilters;
  onFiltersChange: (filters: AnimalFilters) => void;
  lotes: string[];
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

export function AnimalsFilters({ filters, onFiltersChange, lotes }: AnimalsFiltersProps) {
  const hasActiveFilters = 
    filters.search || 
    filters.category !== 'all' || 
    filters.status !== 'all' || 
    filters.sex !== 'all' || 
    filters.lot !== 'all';

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      category: 'all',
      status: 'all',
      sex: 'all',
      lot: 'all',
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por arete, nombre o raza..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-10"
        />
      </div>

      <Select
        value={filters.category}
        onValueChange={(value) => onFiltersChange({ ...filters, category: value as AnimalCategory | 'all' })}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Categoría" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          {Object.entries(categoryLabels).map(([value, label]) => (
            <SelectItem key={value} value={value}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.sex}
        onValueChange={(value) => onFiltersChange({ ...filters, sex: value as AnimalSex | 'all' })}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Sexo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="hembra">Hembras</SelectItem>
          <SelectItem value="macho">Machos</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.status}
        onValueChange={(value) => onFiltersChange({ ...filters, status: value as AnimalStatus | 'all' })}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="activo">Activos</SelectItem>
          <SelectItem value="vendido">Vendidos</SelectItem>
          <SelectItem value="muerto">Muertos</SelectItem>
          <SelectItem value="descartado">Descartados</SelectItem>
        </SelectContent>
      </Select>

      {lotes.length > 0 && (
        <Select
          value={filters.lot}
          onValueChange={(value) => onFiltersChange({ ...filters, lot: value })}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Lote" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {lotes.map((lot) => (
              <SelectItem key={lot} value={lot}>{lot}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="mr-1 h-4 w-4" />
          Limpiar
        </Button>
      )}
    </div>
  );
}
