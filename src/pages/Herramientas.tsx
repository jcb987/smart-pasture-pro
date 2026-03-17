import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, ClipboardList, Star, FileText, Radio, Key, AlertTriangle, Bluetooth, Send, Link2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Hooks
import { useFieldTasks, FieldTask } from '@/hooks/useFieldTasks';
import { useCustomScores } from '@/hooks/useCustomScores';
import { useInvoices } from '@/hooks/useInvoices';
import { useRFID } from '@/hooks/useRFID';
import { useAPIKeys, API_PERMISSIONS } from '@/hooks/useAPIKeys';

// Components
import { TasksKanban } from '@/components/tareas/TasksKanban';
import { CreateTaskDialog } from '@/components/tareas/CreateTaskDialog';
import { ScoreDefinitionsManager } from '@/components/scores/ScoreDefinitionsManager';
import { RecordScoreDialog } from '@/components/scores/RecordScoreDialog';
import { InvoicesTable } from '@/components/facturas/InvoicesTable';
import { CreateInvoiceDialog } from '@/components/facturas/CreateInvoiceDialog';
import { InvoiceDetailModal } from '@/components/facturas/InvoiceDetailModal';
import { Invoice } from '@/hooks/useInvoices';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const Herramientas = () => {
  const [activeTab, setActiveTab] = useState('tareas');
  
  // Task state
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<FieldTask | null>(null);
  const { tasks, loading: tasksLoading, createTask, updateTask, deleteTask, overdueTasks } = useFieldTasks();

  // Scores state
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
  const { definitions, scores, loading: scoresLoading, createDefinition, deleteDefinition, recordScore } = useCustomScores();

  // Invoices state
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const { invoices, loading: invoicesLoading, createInvoice, markAsPaid, deleteInvoice, overdueInvoices, totalPending } = useInvoices();

  // RFID state
  const [manualTagInput, setManualTagInput] = useState('');
  const { devices, readings, loading: rfidLoading, recentReadings, startBluetoothScan, isScanning, manualTagRead, activeDevices, linkTagToAnimal } = useRFID();

  // API Keys state
  const { apiKeys, loading: apiLoading, activeKeys, createAPIKey, revokeAPIKey } = useAPIKeys();
  const [newKeyVisible, setNewKeyVisible] = useState<string | null>(null);
  const [apiKeyName, setApiKeyName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['animals:read', 'production:read']);

  const handleCreateAPIKey = async () => {
    const result = await createAPIKey({
      name: apiKeyName || 'Nueva API Key',
      permissions: selectedPermissions,
    });
    if (result.success && result.key) {
      setNewKeyVisible(result.key);
      setApiKeyName('');
    }
  };

  const handleManualTagRead = async () => {
    if (manualTagInput.trim()) {
      await manualTagRead(manualTagInput);
      setManualTagInput('');
    }
  };

  const apiDocsUrl = `${SUPABASE_URL}/functions/v1/public-api/docs`;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Herramientas Avanzadas</h1>
          <p className="text-muted-foreground">
            Tareas de campo, scores personalizados, facturas, RFID y API
          </p>
        </div>

        {/* Alert cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {overdueTasks.length > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="flex items-center gap-3 p-4">
                <AlertTriangle className="h-8 w-8 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-900">{overdueTasks.length} tareas vencidas</p>
                  <p className="text-sm text-amber-700">Requieren atención</p>
                </div>
              </CardContent>
            </Card>
          )}
          {overdueInvoices.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="flex items-center gap-3 p-4">
                <FileText className="h-8 w-8 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">{overdueInvoices.length} facturas vencidas</p>
                  <p className="text-sm text-red-700">${totalPending.toLocaleString()} pendiente</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full max-w-2xl">
            <TabsTrigger value="tareas" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Tareas</span>
            </TabsTrigger>
            <TabsTrigger value="scores" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Scores</span>
            </TabsTrigger>
            <TabsTrigger value="facturas" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Facturas</span>
            </TabsTrigger>
            <TabsTrigger value="rfid" className="flex items-center gap-2">
              <Radio className="h-4 w-4" />
              <span className="hidden sm:inline">RFID</span>
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              <span className="hidden sm:inline">API</span>
            </TabsTrigger>
          </TabsList>

          {/* TAREAS TAB */}
          <TabsContent value="tareas" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => { setEditingTask(null); setTaskDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Tarea
              </Button>
            </div>
            <TasksKanban
              tasks={tasks}
              loading={tasksLoading}
              onUpdateStatus={(id, status) => updateTask(id, { status })}
              onDelete={deleteTask}
              onEdit={(task) => { setEditingTask(task); setTaskDialogOpen(true); }}
            />
          </TabsContent>

          {/* SCORES TAB */}
          <TabsContent value="scores" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setScoreDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Score
              </Button>
            </div>
            <ScoreDefinitionsManager
              definitions={definitions}
              loading={scoresLoading}
              onCreate={createDefinition}
              onDelete={deleteDefinition}
            />
          </TabsContent>

          {/* FACTURAS TAB */}
          <TabsContent value="facturas" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setInvoiceDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Factura
              </Button>
            </div>
            <InvoicesTable
              invoices={invoices}
              loading={invoicesLoading}
              onMarkAsPaid={markAsPaid}
              onDelete={deleteInvoice}
              onView={(invoice) => setSelectedInvoice(invoice)}
            />
          </TabsContent>

          {/* RFID TAB */}
          <TabsContent value="rfid" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Connection Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bluetooth className="h-5 w-5" />
                    Conexión Bluetooth
                  </CardTitle>
                  <CardDescription>
                    Conecta un lector RFID Bluetooth para escanear tags automáticamente
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={startBluetoothScan} 
                    disabled={isScanning}
                    className="w-full"
                  >
                    <Bluetooth className="h-4 w-4 mr-2" />
                    {isScanning ? 'Buscando...' : 'Buscar dispositivos Bluetooth'}
                  </Button>
                  
                  {activeDevices.length > 0 && (
                    <div className="space-y-2">
                      <Label>Dispositivos conectados</Label>
                      {activeDevices.map(device => (
                        <div key={device.id} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                          <span className="font-medium text-green-800">{device.device_name}</span>
                          <Badge variant="secondary">Activo</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Manual Input Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Lectura Manual
                  </CardTitle>
                  <CardDescription>
                    Ingresa manualmente un ID de tag para pruebas o sin hardware
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ej: 123456789012"
                      value={manualTagInput}
                      onChange={(e) => setManualTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleManualTagRead()}
                    />
                    <Button onClick={handleManualTagRead} disabled={!manualTagInput.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Útil para pruebas o cuando no tienes un lector RFID físico
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Readings Table */}
            <Card>
              <CardHeader>
                <CardTitle>Historial de Lecturas</CardTitle>
              </CardHeader>
              <CardContent>
                {recentReadings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay lecturas registradas
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tag RFID</TableHead>
                        <TableHead>Animal</TableHead>
                        <TableHead>Fecha/Hora</TableHead>
                        <TableHead>Ubicación</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentReadings.map(reading => (
                        <TableRow key={reading.id}>
                          <TableCell className="font-mono">{reading.tag_id}</TableCell>
                          <TableCell>
                            {reading.animal ? (
                              <Badge variant="secondary">
                                {reading.animal.tag_id} {reading.animal.name && `- ${reading.animal.name}`}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-amber-600">Sin vincular</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {format(new Date(reading.read_at), 'dd/MM/yy HH:mm', { locale: es })}
                          </TableCell>
                          <TableCell>{reading.location || '-'}</TableCell>
                          <TableCell>
                            {!reading.animal && (
                              <Button variant="ghost" size="sm">
                                <Link2 className="h-4 w-4 mr-1" />
                                Vincular
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* API TAB */}
          <TabsContent value="api" className="space-y-4">
            {/* Documentation Card */}
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <h3 className="font-bold text-lg">Documentación de la API</h3>
                  <p className="text-muted-foreground">
                    Consulta todos los endpoints disponibles para integrar con tu ERP
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <a href={apiDocsUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver Documentación
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Create API Key */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Crear Nueva API Key
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="api-key-name">Nombre de la API Key</Label>
                    <Input
                      id="api-key-name"
                      placeholder="Ej: ERP Producción"
                      value={apiKeyName}
                      onChange={(e) => setApiKeyName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Permisos</Label>
                    <div className="flex flex-wrap gap-2">
                      {API_PERMISSIONS.slice(0, 6).map(perm => (
                        <Badge
                          key={perm.value}
                          variant={selectedPermissions.includes(perm.value) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => {
                            if (selectedPermissions.includes(perm.value)) {
                              setSelectedPermissions(selectedPermissions.filter(p => p !== perm.value));
                            } else {
                              setSelectedPermissions([...selectedPermissions, perm.value]);
                            }
                          }}
                        >
                          {perm.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <Button onClick={handleCreateAPIKey} disabled={!apiKeyName.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Generar API Key
                </Button>
              </CardContent>
            </Card>

            {/* New Key Display */}
            {newKeyVisible && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-6">
                  <p className="text-sm text-green-800 font-medium mb-2">
                    ¡Nueva API Key creada! Guárdala en un lugar seguro, no se mostrará de nuevo:
                  </p>
                  <code className="block p-3 bg-white rounded border font-mono text-sm break-all">
                    {newKeyVisible}
                  </code>
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(newKeyVisible);
                      }}
                    >
                      Copiar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setNewKeyVisible(null)}>
                      Entendido
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Active Keys */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Keys Activas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeKeys.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay API keys activas. Crea una para integrar con tu ERP.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Prefijo</TableHead>
                        <TableHead>Permisos</TableHead>
                        <TableHead>Último uso</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeKeys.map(key => (
                        <TableRow key={key.id}>
                          <TableCell className="font-medium">{key.name}</TableCell>
                          <TableCell className="font-mono">{key.key_prefix}...</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {(key.permissions as string[]).slice(0, 2).map(p => (
                                <Badge key={p} variant="secondary" className="text-xs">
                                  {p.split(':')[0]}
                                </Badge>
                              ))}
                              {(key.permissions as string[]).length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{(key.permissions as string[]).length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {key.last_used_at 
                              ? format(new Date(key.last_used_at), 'dd/MM/yy HH:mm', { locale: es })
                              : 'Nunca'
                            }
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => revokeAPIKey(key.id)}
                            >
                              Revocar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <CreateTaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        onSubmit={editingTask ? (data) => updateTask(editingTask.id, data) : createTask}
        editingTask={editingTask}
      />
      <RecordScoreDialog
        open={scoreDialogOpen}
        onOpenChange={setScoreDialogOpen}
        onSubmit={recordScore}
        definitions={definitions}
      />
      <CreateInvoiceDialog
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        onSubmit={createInvoice}
      />

      <InvoiceDetailModal
        invoice={selectedInvoice}
        open={!!selectedInvoice}
        onOpenChange={(open) => { if (!open) setSelectedInvoice(null); }}
        onMarkAsPaid={markAsPaid}
      />
    </DashboardLayout>
  );
};

export default Herramientas;
