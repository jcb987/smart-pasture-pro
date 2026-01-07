import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search, 
  Eye, 
  ClipboardList, 
  Activity,
  MapPin,
  Calendar,
  Users,
  StickyNote
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface Client {
  id: string;
  name: string;
  ownerName: string;
  country?: string;
  region?: string;
  productionType?: string;
  herdSize?: string;
  lastAccess?: string;
  createdAt: string;
  animalCount: number;
  isActive: boolean;
}

interface FounderClientsTableProps {
  clients: Client[];
  loading?: boolean;
  onEnterFounderMode: (client: Client) => void;
  onViewOnboarding: (client: Client) => void;
  onViewActivity: (client: Client) => void;
}

export function FounderClientsTable({ 
  clients, 
  loading, 
  onEnterFounderMode,
  onViewOnboarding,
  onViewActivity
}: FounderClientsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.region?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (client: Client) => {
    const daysSinceAccess = client.lastAccess 
      ? differenceInDays(new Date(), new Date(client.lastAccess))
      : 999;

    if (daysSinceAccess <= 7) {
      return <Badge className="bg-emerald-500">Activo</Badge>;
    } else if (daysSinceAccess <= 30) {
      return <Badge variant="outline" className="border-amber-500 text-amber-600">Prueba</Badge>;
    } else {
      return <Badge variant="secondary">Inactivo</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Clientes
        </CardTitle>
        <CardDescription>
          Buscar, ver y administrar todas las cuentas de clientes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, propietario, país o región..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente / Finca</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Producción</TableHead>
                <TableHead className="text-center">Animales</TableHead>
                <TableHead>Último Acceso</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{client.name}</p>
                      <p className="text-xs text-muted-foreground">{client.ownerName}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {client.country || client.region ? (
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {client.region && <span>{client.region}</span>}
                        {client.region && client.country && <span>, </span>}
                        {client.country && <span>{client.country}</span>}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {client.productionType ? (
                      <Badge variant="outline">{client.productionType}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-medium">{client.animalCount}</span>
                  </TableCell>
                  <TableCell>
                    {client.lastAccess ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(client.lastAccess), 'dd MMM', { locale: es })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Nunca</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(client)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewOnboarding(client)}
                        title="Ver encuesta"
                      >
                        <ClipboardList className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewActivity(client)}
                        title="Ver actividad"
                      >
                        <Activity className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onEnterFounderMode(client)}
                        className="gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        Entrar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredClients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No se encontraron clientes
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
