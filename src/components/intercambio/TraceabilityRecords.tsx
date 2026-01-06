import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TraceabilityRecord } from '@/hooks/useTraceability';
import { useAnimals } from '@/hooks/useAnimals';
import { History, FileOutput, FileInput, ArrowRightLeft, ClipboardCheck } from 'lucide-react';

interface TraceabilityRecordsProps {
  records: TraceabilityRecord[];
}

const getRecordTypeInfo = (type: string) => {
  switch (type) {
    case 'export':
      return { label: 'Exportación', icon: FileOutput, color: 'bg-blue-500' };
    case 'import':
      return { label: 'Importación', icon: FileInput, color: 'bg-green-500' };
    case 'transfer':
      return { label: 'Transferencia', icon: ArrowRightLeft, color: 'bg-purple-500' };
    case 'audit':
      return { label: 'Auditoría', icon: ClipboardCheck, color: 'bg-orange-500' };
    default:
      return { label: type, icon: History, color: 'bg-gray-500' };
  }
};

export const TraceabilityRecords = ({ records }: TraceabilityRecordsProps) => {
  const { animals } = useAnimals();

  const getAnimalTag = (animalId: string) => {
    const animal = animals.find(a => a.id === animalId);
    return animal?.tag_id || 'Desconocido';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5" />
          Historial de Trazabilidad
        </CardTitle>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No hay registros de trazabilidad</p>
            <p className="text-sm">Los registros aparecerán cuando exportes o importes hojas de vida</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Animal</TableHead>
                <TableHead>Origen/Destino</TableHead>
                <TableHead>Código Verificación</TableHead>
                <TableHead>Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => {
                const typeInfo = getRecordTypeInfo(record.record_type);
                const Icon = typeInfo.icon;
                return (
                  <TableRow key={record.id}>
                    <TableCell>
                      {new Date(record.record_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${typeInfo.color} text-white`}>
                        <Icon className="h-3 w-3 mr-1" />
                        {typeInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {getAnimalTag(record.animal_id)}
                    </TableCell>
                    <TableCell>
                      {record.record_type === 'export'
                        ? record.destination_organization || '-'
                        : record.source_organization || '-'}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {record.verification_code || 'N/A'}
                      </code>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {record.notes || '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
