import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MilkRecord {
  id: string;
  production_date: string;
  morning_liters: number;
  afternoon_liters: number;
  evening_liters: number;
  total_liters: number;
  fat_percentage: number | null;
  animal?: {
    tag_id: string;
    name: string | null;
  };
}

interface WeightRecord {
  id: string;
  weight_date: string;
  weight_kg: number;
  daily_gain: number | null;
  condition_score: number | null;
  animal?: {
    tag_id: string;
    name: string | null;
  };
}

interface ProductionRecordsTableProps {
  type: 'milk' | 'weight';
  records: (MilkRecord | WeightRecord)[];
  onDelete?: (id: string) => void;
}

export const ProductionRecordsTable = ({ type, records, onDelete }: ProductionRecordsTableProps) => {
  const formatDateStr = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return format(new Date(year, month - 1, day), 'dd MMM yyyy', { locale: es });
  };

  if (type === 'milk') {
    const milkRecords = records as MilkRecord[];
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Últimos Registros de Producción</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Animal</TableHead>
                <TableHead className="text-right">Mañana</TableHead>
                <TableHead className="text-right">Tarde</TableHead>
                <TableHead className="text-right">Noche</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Grasa</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {milkRecords.slice(0, 100).map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{formatDateStr(record.production_date)}</TableCell>
                  <TableCell>
                    {record.animal?.tag_id}
                    {record.animal?.name && <span className="text-muted-foreground ml-1">({record.animal.name})</span>}
                  </TableCell>
                  <TableCell className="text-right">{record.morning_liters || '-'}</TableCell>
                  <TableCell className="text-right">{record.afternoon_liters || '-'}</TableCell>
                  <TableCell className="text-right">{record.evening_liters || '-'}</TableCell>
                  <TableCell className="text-right font-medium">{record.total_liters} L</TableCell>
                  <TableCell className="text-right">
                    {record.fat_percentage ? `${record.fat_percentage}%` : '-'}
                  </TableCell>
                  {onDelete && (
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(record.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {milkRecords.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No hay registros de producción
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {milkRecords.length > 100 && (
            <p className="text-xs text-muted-foreground text-center pt-2">
              Mostrando 100 de {milkRecords.length} registros
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  const weightRecords = records as WeightRecord[];
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Últimos Registros de Peso</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Animal</TableHead>
              <TableHead className="text-right">Peso</TableHead>
              <TableHead className="text-right">GDP</TableHead>
              <TableHead className="text-right">CC</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {weightRecords.slice(0, 15).map((record) => (
              <TableRow key={record.id}>
                <TableCell>{formatDateStr(record.weight_date)}</TableCell>
                <TableCell>
                  {record.animal?.tag_id}
                  {record.animal?.name && <span className="text-muted-foreground ml-1">({record.animal.name})</span>}
                </TableCell>
                <TableCell className="text-right font-medium">{record.weight_kg} kg</TableCell>
                <TableCell className="text-right">
                  {record.daily_gain ? (
                    <span className={record.daily_gain > 0 ? 'text-green-600' : 'text-red-600'}>
                      {record.daily_gain > 0 ? '+' : ''}{record.daily_gain.toFixed(0)} g/día
                    </span>
                  ) : '-'}
                </TableCell>
                <TableCell className="text-right">
                  {record.condition_score || '-'}
                </TableCell>
                {onDelete && (
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(record.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {weightRecords.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No hay registros de peso
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
