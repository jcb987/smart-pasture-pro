import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSupplies, Supply, SUPPLY_CATEGORIES } from '@/hooks/useSupplies';
import { Trash2, Search, Package, AlertTriangle, Clock } from 'lucide-react';
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

interface SuppliesTableProps {
  onSelectSupply?: (supply: Supply) => void;
}

export const SuppliesTable = ({ onSelectSupply }: SuppliesTableProps) => {
  const { supplies, deleteSupply, loading } = useSupplies();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStock, setFilterStock] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const getCategoryLabel = (value: string) => {
    const cat = SUPPLY_CATEGORIES.find(c => c.value === value);
    return cat?.label || value;
  };

  const filteredSupplies = supplies.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.supplier?.toLowerCase().includes(search.toLowerCase()) ||
      s.location?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = filterCategory === 'all' || s.category === filterCategory;
    
    let matchesStock = true;
    if (filterStock === 'low') {
      matchesStock = s.current_stock <= s.min_stock;
    } else if (filterStock === 'ok') {
      matchesStock = s.current_stock > s.min_stock;
    }

    return matchesSearch && matchesCategory && matchesStock && s.is_active;
  });

  const handleDelete = async () => {
    if (deleteId) {
      await deleteSupply.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando inventario...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, proveedor, ubicación..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {SUPPLY_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStock} onValueChange={setFilterStock}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Stock" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo el stock</SelectItem>
            <SelectItem value="low">Stock bajo</SelectItem>
            <SelectItem value="ok">Stock OK</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Insumo</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-center">Stock</TableHead>
              <TableHead className="text-center">Mínimo</TableHead>
              <TableHead className="text-right">Costo Unit.</TableHead>
              <TableHead className="text-center">Retiro</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSupplies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  No hay insumos registrados
                </TableCell>
              </TableRow>
            ) : (
              filteredSupplies.map((supply) => {
                const isLowStock = supply.current_stock <= supply.min_stock;
                return (
                  <TableRow 
                    key={supply.id} 
                    className={`cursor-pointer hover:bg-muted/50 ${isLowStock ? 'bg-red-50 dark:bg-red-950/20' : ''}`}
                    onClick={() => onSelectSupply?.(supply)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {supply.name}
                        {isLowStock && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getCategoryLabel(supply.category)}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`font-medium ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                        {supply.current_stock} {supply.unit}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {supply.min_stock} {supply.unit}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(supply.unit_cost)}
                    </TableCell>
                    <TableCell className="text-center">
                      {supply.withdrawal_days > 0 ? (
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="h-3 w-3" />
                          {supply.withdrawal_days}d
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {supply.location || '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(supply.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar insumo?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán también todos los lotes y movimientos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
