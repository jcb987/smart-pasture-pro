import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, ClipboardList, Star, FileText, Radio, Key, AlertTriangle } from 'lucide-react';

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
  const { invoices, loading: invoicesLoading, createInvoice, markAsPaid, deleteInvoice, overdueInvoices, totalPending } = useInvoices();

  // RFID state
  const { devices, readings, loading: rfidLoading, recentReadings, startBluetoothScan, isScanning } = useRFID();

  // API Keys state
  const { apiKeys, loading: apiLoading, activeKeys, createAPIKey, revokeAPIKey } = useAPIKeys();
  const [newKeyVisible, setNewKeyVisible] = useState<string | null>(null);

  const handleCreateAPIKey = async () => {
    const result = await createAPIKey({
      name: 'Nueva API Key',
      permissions: ['animals:read', 'production:read'],
    });
    if (result.success && result.key) {
      setNewKeyVisible(result.key);
    }
  };

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
              onView={() => {}}
            />
          </TabsContent>

          {/* RFID TAB */}
          <TabsContent value="rfid" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radio className="h-5 w-5" />
                  Lectores RFID
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Radio className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-medium mb-2">Conecta un lector RFID</h3>
                  <p className="text-muted-foreground mb-4">
                    Conecta un lector RFID Bluetooth para identificar animales automáticamente
                  </p>
                  <Button onClick={startBluetoothScan} disabled={isScanning}>
                    {isScanning ? 'Buscando...' : 'Buscar dispositivos Bluetooth'}
                  </Button>
                </div>
                {recentReadings.length > 0 && (
                  <div className="mt-6 border-t pt-4">
                    <h4 className="font-medium mb-2">Últimas lecturas</h4>
                    <div className="space-y-2">
                      {recentReadings.slice(0, 5).map(reading => (
                        <div key={reading.id} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="font-mono">{reading.tag_id}</span>
                          {reading.animal ? (
                            <Badge variant="secondary">{reading.animal.tag_id}</Badge>
                          ) : (
                            <Badge variant="outline">Sin vincular</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* API TAB */}
          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    API Keys para ERP
                  </CardTitle>
                  <Button onClick={handleCreateAPIKey}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva API Key
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {newKeyVisible && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 font-medium mb-2">
                      ¡Nueva API Key creada! Guárdala, no se mostrará de nuevo:
                    </p>
                    <code className="block p-2 bg-white rounded border font-mono text-sm break-all">
                      {newKeyVisible}
                    </code>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => setNewKeyVisible(null)}>
                      Entendido
                    </Button>
                  </div>
                )}
                {activeKeys.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay API keys activas. Crea una para integrar con tu ERP.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {activeKeys.map(key => (
                      <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{key.name}</p>
                          <p className="text-sm text-muted-foreground font-mono">{key.key_prefix}...</p>
                        </div>
                        <Button variant="destructive" size="sm" onClick={() => revokeAPIKey(key.id)}>
                          Revocar
                        </Button>
                      </div>
                    ))}
                  </div>
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
    </DashboardLayout>
  );
};

export default Herramientas;
