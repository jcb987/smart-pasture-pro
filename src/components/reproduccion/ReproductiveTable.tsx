import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus, History, AlertTriangle, Calendar } from 'lucide-react';
import { FemaleAnimal, ReproductiveEvent } from '@/hooks/useReproduction';
import { format, parseISO, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  females: FemaleAnimal[];
  events: ReproductiveEvent[];
  onRegisterEvent: (animalId: string) => void;
  onViewHistory: (animalId: string) => void;
}

const statusColors: Record<string, string> = {
  vacia: 'bg-gray-100 text-gray-800',
  servida: 'bg-blue-100 text-blue-800',
  preñada: 'bg-green-100 text-green-800',
  lactando: 'bg-purple-100 text-purple-800',
  seca: 'bg-amber-100 text-amber-800',
};

const statusLabels: Record<string, string> = {
  vacia: 'Vacía',
  servida: 'Servida',
  preñada: 'Preñada',
  lactando: 'Lactando',
  seca: 'Seca',
};

export const ReproductiveTable = ({ females, events, onRegisterEvent, onViewHistory }: Props) => {
  const today = new Date();

  const getLastEvent = (animalId: string) => {
    return events.find(e => e.animal_id === animalId);
  };

  const getDaysOpen = (female: FemaleAnimal) => {
    if (!female.last_calving_date) return null;
    if (female.reproductive_status === 'preñada') return null;
    return differenceInDays(today, parseISO(female.last_calving_date));
  };

  const getGestationDays = (female: FemaleAnimal) => {
    if (female.reproductive_status !== 'preñada' && female.reproductive_status !== 'servida') return null;
    if (!female.last_service_date) return null;
    return differenceInDays(today, parseISO(female.last_service_date));
  };

  const isOverdue = (female: FemaleAnimal) => {
    if (!female.expected_calving_date) return false;
    return parseISO(female.expected_calving_date) < today && female.reproductive_status === 'preñada';
  };

  const isNearBirth = (female: FemaleAnimal) => {
    if (!female.expected_calving_date) return false;
    const daysUntil = differenceInDays(parseISO(female.expected_calving_date), today);
    return daysUntil >= 0 && daysUntil <= 30 && female.reproductive_status === 'preñada';
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Arete</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Estado Reproductivo</TableHead>
            <TableHead>Días Abiertos</TableHead>
            <TableHead>Días Gestación</TableHead>
            <TableHead>Fecha Parto Esperado</TableHead>
            <TableHead>Último Evento</TableHead>
            <TableHead>Partos</TableHead>
            <TableHead className="w-[80px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {females.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                No hay hembras reproductivas registradas
              </TableCell>
            </TableRow>
          ) : (
            females.map((female) => {
              const lastEvent = getLastEvent(female.id);
              const daysOpen = getDaysOpen(female);
              const gestationDays = getGestationDays(female);
              const overdue = isOverdue(female);
              const nearBirth = isNearBirth(female);

              return (
                <TableRow key={female.id} className={overdue ? 'bg-red-50' : nearBirth ? 'bg-amber-50' : ''}>
                  <TableCell className="font-medium">{female.tag_id}</TableCell>
                  <TableCell>{female.name || '-'}</TableCell>
                  <TableCell className="capitalize">{female.category}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[female.reproductive_status || 'vacia']}>
                      {statusLabels[female.reproductive_status || 'vacia']}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {daysOpen !== null ? (
                      <span className={daysOpen > 150 ? 'text-red-600 font-medium' : ''}>
                        {daysOpen} días
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {gestationDays !== null ? `${gestationDays} días` : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {female.expected_calving_date ? (
                        <>
                          <span className={overdue ? 'text-red-600 font-medium' : nearBirth ? 'text-amber-600' : ''}>
                            {format(parseISO(female.expected_calving_date), 'dd/MM/yyyy')}
                          </span>
                          {overdue && <AlertTriangle className="h-4 w-4 text-red-500" />}
                          {nearBirth && !overdue && <Calendar className="h-4 w-4 text-amber-500" />}
                        </>
                      ) : '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {lastEvent ? (
                      <span className="text-sm text-muted-foreground">
                        {format(parseISO(lastEvent.event_date), 'dd/MM/yy', { locale: es })}
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell>{female.total_calvings || 0}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onRegisterEvent(female.id)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Registrar Evento
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onViewHistory(female.id)}>
                          <History className="mr-2 h-4 w-4" />
                          Ver Historial
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};
