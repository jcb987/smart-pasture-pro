import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Play, Square, Droplets } from 'lucide-react';
import { Paddock, PaddockRotation, ForageMeasurement } from '@/hooks/usePaddocks';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PaddocksGridProps {
  paddocks: Paddock[];
  onDelete: (id: string) => void;
  onStartRotation: (paddockId: string) => void;
  onEndRotation: (paddockId: string) => void;
  activeRotations: PaddockRotation[];
}

export const PaddocksGrid = ({ 
  paddocks, 
  onDelete, 
  onStartRotation, 
  onEndRotation,
  activeRotations 
}: PaddocksGridProps) => {
  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      disponible: 'bg-green-600',
      ocupado: 'bg-blue-600',
      en_descanso: 'bg-amber-600',
      en_recuperacion: 'bg-purple-600',
    };
    const labels: Record<string, string> = {
      disponible: 'Disponible',
      ocupado: 'Ocupado',
      en_descanso: 'En Descanso',
      en_recuperacion: 'Recuperación',
    };
    return <Badge className={colors[status] || 'bg-gray-600'}>{labels[status] || status}</Badge>;
  };

  const getRestDays = (paddock: Paddock) => {
    if (!paddock.last_rest_start || paddock.current_status !== 'en_descanso') return null;
    const days = Math.ceil(
      (new Date().getTime() - new Date(paddock.last_rest_start).getTime()) / (1000 * 60 * 60 * 24)
    );
    const isReady = days >= paddock.recommended_rest_days;
    return { days, isReady };
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {paddocks.map((paddock) => {
        const restInfo = getRestDays(paddock);
        const activeRotation = activeRotations.find(r => r.paddock_id === paddock.id && !r.exit_date);

        return (
          <Card key={paddock.id} className={restInfo?.isReady ? 'border-green-500 border-2' : ''}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    {paddock.name}
                    {paddock.irrigation && <Droplets className="h-4 w-4 text-blue-500" />}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {paddock.area_hectares ? `${paddock.area_hectares} ha` : 'Área no definida'}
                    {paddock.grass_type && ` • ${paddock.grass_type}`}
                  </p>
                </div>
                {getStatusBadge(paddock.current_status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Animales:</span>{' '}
                  <span className="font-medium">{paddock.current_animals}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Capacidad:</span>{' '}
                  <span className="font-medium">{paddock.max_capacity || '-'}</span>
                </div>
              </div>

              {restInfo && (
                <div className={`p-2 rounded text-sm ${restInfo.isReady ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                  {restInfo.days} días en descanso
                  {restInfo.isReady ? ' ✓ Listo para uso' : ` (recomendado: ${paddock.recommended_rest_days})`}
                </div>
              )}

              {activeRotation && (
                <div className="p-2 bg-blue-100 text-blue-800 rounded text-sm">
                  <strong>{activeRotation.lot_name}</strong> - {activeRotation.animals_count} animales
                </div>
              )}

              <div className="flex gap-2">
                {paddock.current_status === 'ocupado' ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => onEndRotation(paddock.id)}
                  >
                    <Square className="h-3 w-3 mr-1" />
                    Finalizar
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => onStartRotation(paddock.id)}
                    disabled={paddock.current_status === 'en_recuperacion'}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Ocupar
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => onDelete(paddock.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
      {paddocks.length === 0 && (
        <Card className="col-span-full">
          <CardContent className="flex items-center justify-center h-32 text-muted-foreground">
            No hay potreros registrados
          </CardContent>
        </Card>
      )}
    </div>
  );
};

interface RotationHistoryTableProps {
  rotations: PaddockRotation[];
}

export const RotationHistoryTable = ({ rotations }: RotationHistoryTableProps) => {
  const formatDateStr = (dateStr: string) => {
    return format(new Date(dateStr), 'dd MMM yyyy', { locale: es });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Historial de Rotaciones</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Potrero</TableHead>
              <TableHead>Lote</TableHead>
              <TableHead>Animales</TableHead>
              <TableHead>Entrada</TableHead>
              <TableHead>Salida</TableHead>
              <TableHead className="text-right">Días</TableHead>
              <TableHead className="text-right">Consumo (kg)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rotations.slice(0, 15).map((rotation) => (
              <TableRow key={rotation.id}>
                <TableCell className="font-medium">{rotation.paddock?.name || '-'}</TableCell>
                <TableCell>{rotation.lot_name}</TableCell>
                <TableCell>{rotation.animals_count}</TableCell>
                <TableCell>{formatDateStr(rotation.entry_date)}</TableCell>
                <TableCell>{rotation.exit_date ? formatDateStr(rotation.exit_date) : <Badge variant="outline">Activo</Badge>}</TableCell>
                <TableCell className="text-right">{rotation.days_occupied || '-'}</TableCell>
                <TableCell className="text-right">
                  {rotation.forage_consumed_kg ? rotation.forage_consumed_kg.toLocaleString() : '-'}
                </TableCell>
              </TableRow>
            ))}
            {rotations.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No hay historial de rotaciones
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

interface MeasurementsTableProps {
  measurements: ForageMeasurement[];
  onDelete: (id: string) => void;
}

export const MeasurementsTable = ({ measurements, onDelete }: MeasurementsTableProps) => {
  const formatDateStr = (dateStr: string) => {
    return format(new Date(dateStr), 'dd MMM yyyy', { locale: es });
  };

  const getQualityStars = (score: number | null) => {
    if (!score) return '-';
    return '★'.repeat(score) + '☆'.repeat(5 - score);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Aforos Registrados</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Potrero</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Altura (cm)</TableHead>
              <TableHead className="text-right">kg/ha</TableHead>
              <TableHead className="text-right">Total (kg)</TableHead>
              <TableHead>Calidad</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {measurements.slice(0, 15).map((m) => (
              <TableRow key={m.id}>
                <TableCell>{formatDateStr(m.measurement_date)}</TableCell>
                <TableCell className="font-medium">{m.paddock?.name || '-'}</TableCell>
                <TableCell>
                  <Badge variant="outline">{m.measurement_type}</Badge>
                </TableCell>
                <TableCell className="text-right">{m.grass_height_cm || '-'}</TableCell>
                <TableCell className="text-right">{m.forage_kg_per_ha?.toLocaleString() || '-'}</TableCell>
                <TableCell className="text-right font-medium">
                  {m.total_forage_kg?.toLocaleString() || '-'}
                </TableCell>
                <TableCell className="text-amber-500">{getQualityStars(m.quality_score)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(m.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {measurements.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No hay aforos registrados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
