import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  useCostos, 
  FinancialTransaction, 
  INCOME_CATEGORIES, 
  EXPENSE_CATEGORIES 
} from '@/hooks/useCostos';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Trash2, Search, TrendingUp, TrendingDown } from 'lucide-react';
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

export const TransactionsTable = () => {
  const { transactions, deleteTransaction, isLoading } = useCostos();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const allCategories = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

  const getCategoryLabel = (value: string) => {
    const cat = allCategories.find(c => c.value === value);
    return cat?.label || value;
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.description?.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      t.animals?.tag_id?.toLowerCase().includes(search.toLowerCase()) ||
      t.lot_name?.toLowerCase().includes(search.toLowerCase());

    const matchesType = filterType === 'all' || t.transaction_type === filterType;
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;

    return matchesSearch && matchesType && matchesCategory;
  });

  const handleDelete = async () => {
    if (deleteId) {
      await deleteTransaction.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando transacciones...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descripción, categoría, animal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ingreso">Ingresos</SelectItem>
            <SelectItem value="egreso">Egresos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {allCategories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Lote</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No hay transacciones registradas
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {format(new Date(transaction.transaction_date), 'dd MMM yyyy', { locale: es })}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={transaction.transaction_type === 'ingreso' ? 'default' : 'destructive'}
                      className={transaction.transaction_type === 'ingreso' ? 'bg-green-600' : ''}
                    >
                      {transaction.transaction_type === 'ingreso' ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {transaction.transaction_type === 'ingreso' ? 'Ingreso' : 'Egreso'}
                    </Badge>
                  </TableCell>
                  <TableCell>{getCategoryLabel(transaction.category)}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {transaction.description || '-'}
                  </TableCell>
                  <TableCell>{transaction.lot_name || '-'}</TableCell>
                  <TableCell className={`text-right font-medium ${
                    transaction.transaction_type === 'ingreso' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.transaction_type === 'ingreso' ? '+' : '-'}
                    {formatCurrency(Number(transaction.amount))}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(transaction.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar transacción?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
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
