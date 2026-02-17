import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Check, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { HealthEvent, VaccinationSchedule } from '@/hooks/useHealth';

interface HealthEventsTableProps {
  events: HealthEvent[];
  onDelete?: (id: string) => void;
  onComplete?: (id: string) => void;
}

export const HealthEventsTable = ({ events, onDelete, onComplete }: HealthEventsTableProps) => {
  const formatDateStr = (dateStr: string) => {
    return format(new Date(dateStr), 'dd MMM yyyy', { locale: es });
  };

  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case 'tratamiento':
        return <Badge variant="default">Tratamiento</Badge>;
      case 'diagnostico':
        return <Badge variant="secondary">Diagnóstico</Badge>;
      case 'vacuna':
        return <Badge className="bg-green-600">Vacuna</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'activo':
        return <Badge variant="outline" className="text-amber-600 border-amber-600">Activo</Badge>;
      case 'completado':
        return <Badge variant="outline" className="text-green-600 border-green-600">Completado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Eventos de Salud Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Animal</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Diagnóstico/Tratamiento</TableHead>
              <TableHead>Medicamento</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.slice(0, 15).map((event) => (
              <TableRow key={event.id}>
                <TableCell>{formatDateStr(event.event_date)}</TableCell>
                <TableCell>
                  {event.animal?.tag_id}
                  {event.animal?.name && <span className="text-muted-foreground ml-1">({event.animal.name})</span>}
                </TableCell>
                <TableCell>{getEventTypeBadge(event.event_type)}</TableCell>
                <TableCell>{event.diagnosis || event.treatment || '-'}</TableCell>
                <TableCell>
                  {event.medication && (
                    <span>{event.medication} {event.dosage && `(${event.dosage})`}</span>
                  )}
                  {!event.medication && '-'}
                </TableCell>
                <TableCell>{getStatusBadge(event.status)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {onComplete && event.status === 'activo' && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => onComplete(event.id)}
                        title="Marcar como completado"
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(event.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {events.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No hay eventos de salud registrados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

interface VaccinationTableProps {
  vaccinations: VaccinationSchedule[];
  onApply?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const VaccinationTable = ({ vaccinations, onApply, onDelete }: VaccinationTableProps) => {
  const today = new Date().toISOString().split('T')[0];

  const formatDateStr = (dateStr: string) => {
    return format(new Date(dateStr), 'dd MMM yyyy', { locale: es });
  };

  const getStatusBadge = (vac: VaccinationSchedule) => {
    if (vac.is_applied) {
      return <Badge className="bg-green-600">Aplicada</Badge>;
    }
    if (vac.scheduled_date < today) {
      return <Badge variant="destructive">Vencida</Badge>;
    }
    return <Badge variant="outline" className="text-amber-600 border-amber-600">Pendiente</Badge>;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Calendario de Vacunación</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha Programada</TableHead>
              <TableHead>Animal/Lote</TableHead>
              <TableHead>Vacuna</TableHead>
              <TableHead>Dosis #</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Próxima</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vaccinations.slice(0, 15).map((vac) => (
              <TableRow key={vac.id} className={!vac.is_applied && vac.scheduled_date < today ? 'bg-destructive/10' : ''}>
                <TableCell>{formatDateStr(vac.scheduled_date)}</TableCell>
                <TableCell>
                  {vac.animal?.tag_id || vac.lot_name || '-'}
                  {vac.animal?.name && <span className="text-muted-foreground ml-1">({vac.animal.name})</span>}
                </TableCell>
                <TableCell className="font-medium">{vac.vaccine_name}</TableCell>
                <TableCell>{vac.dose_number}</TableCell>
                <TableCell>{getStatusBadge(vac)}</TableCell>
                <TableCell>
                  {vac.next_application_date ? formatDateStr(vac.next_application_date) : '-'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {onApply && !vac.is_applied && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => onApply(vac.id)}
                        title="Marcar como aplicada"
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(vac.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {vaccinations.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No hay vacunaciones programadas
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
