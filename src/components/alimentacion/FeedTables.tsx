import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, AlertTriangle } from 'lucide-react';
import { FeedItem, FeedConsumption } from '@/hooks/useFeeding';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface FeedInventoryTableProps {
  items: FeedItem[];
  onEdit: (item: FeedItem) => void;
  onDelete: (id: string) => void;
}

export const FeedInventoryTable = ({ items, onEdit, onDelete }: FeedInventoryTableProps) => {
  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      forraje: 'bg-green-600',
      concentrado: 'bg-amber-600',
      suplemento: 'bg-blue-600',
      mineral: 'bg-purple-600',
      otro: 'bg-gray-600',
    };
    return <Badge className={colors[category] || 'bg-gray-600'}>{category}</Badge>;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Inventario de Alimentos</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Alimento</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Mínimo</TableHead>
              <TableHead className="text-right">Costo/U</TableHead>
              <TableHead className="text-right">Proteína</TableHead>
              <TableHead className="text-right">Energía</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const isLowStock = item.current_stock <= item.min_stock;
              return (
                <TableRow key={item.id} className={isLowStock ? 'bg-destructive/10' : ''}>
                  <TableCell className="font-medium">
                    {item.name}
                    {isLowStock && <AlertTriangle className="h-4 w-4 text-destructive inline ml-2" />}
                  </TableCell>
                  <TableCell>{getCategoryBadge(item.category)}</TableCell>
                  <TableCell className="text-right">
                    {item.current_stock} {item.unit}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {item.min_stock} {item.unit}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.unit_cost ? `$${item.unit_cost}` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.protein_percentage ? `${item.protein_percentage}%` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.energy_mcal ? `${item.energy_mcal} Mcal` : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No hay alimentos en el inventario
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

interface ConsumptionTableProps {
  records: FeedConsumption[];
  onDelete: (id: string) => void;
}

export const ConsumptionTable = ({ records, onDelete }: ConsumptionTableProps) => {
  const formatDateStr = (dateStr: string) => {
    return format(new Date(dateStr), 'dd MMM yyyy', { locale: es });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Registros de Consumo</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Alimento</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="text-right">Costo</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.slice(0, 20).map((record) => (
              <TableRow key={record.id}>
                <TableCell>{formatDateStr(record.consumption_date)}</TableCell>
                <TableCell className="font-medium">{record.feed?.name || '-'}</TableCell>
                <TableCell>{record.lot_name || 'Individual'}</TableCell>
                <TableCell className="text-right">
                  {record.quantity_kg} {record.feed?.unit || 'kg'}
                </TableCell>
                <TableCell className="text-right">
                  {record.cost ? `$${record.cost.toFixed(2)}` : '-'}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(record.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {records.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No hay registros de consumo
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
