import { useState } from 'react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { FileCheck, Truck, Syringe, Download, Loader2, Trash2, MapPin, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useDocumentos } from '@/hooks/useDocumentos';
import { useAnimals } from '@/hooks/useAnimals';
import { useHealth } from '@/hooks/useHealth';
import { useMobilityTracking, MOBILITY_LABELS, MobilityType } from '@/hooks/useMobilityTracking';

const DOCUMENT_TYPES = [
  {
    id: 'guia_movilizacion',
    title: 'Guía de Movilización',
    description: 'Documento oficial para mover animales entre predios o municipios',
    icon: Truck,
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
  },
  {
    id: 'cert_vacunacion',
    title: 'Certificado de Vacunación',
    description: 'Certificado individual de vacunación para un animal',
    icon: Syringe,
    color: 'text-green-600',
    bg: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
  },
];

const MOBILITY_TYPE_OPTIONS: { value: MobilityType; label: string; isTemporary: boolean }[] = [
  { value: 'feria', label: 'Feria / Exposición (con retorno)', isTemporary: true },
  { value: 'traslado_temporal', label: 'Traslado Temporal', isTemporary: true },
  { value: 'venta', label: 'Venta Definitiva', isTemporary: false },
  { value: 'sacrificio', label: 'Sacrificio / Faena', isTemporary: false },
];

const Documentos = () => {
  const { generateMovementGuide, generateVaccinationCertificate, generating, documentHistory, deleteDocumentRecord } = useDocumentos();
  const { animals, updateAnimal } = useAnimals();
  const { vaccinations } = useHealth();
  const { activeEvents, addMobilityEvents, resolveEvent, extendReturnDate, isExpired } = useMobilityTracking();

  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [selectedAnimals, setSelectedAnimals] = useState<string[]>([]);
  const [resolveDialogEvent, setResolveDialogEvent] = useState<string | null>(null);
  const [extendDate, setExtendDate] = useState('');

  const [movForm, setMovForm] = useState({
    farmName: '', ownerName: '', origin: '', destination: '',
    transport: '', transportId: '', date: new Date().toISOString().split('T')[0],
    reason: 'venta', municipio: '', departamento: '',
    mobility_type: 'feria' as MobilityType, return_date: '',
  });

  const [vacForm, setVacForm] = useState({
    animalId: '', vaccineName: '', applicationDate: new Date().toISOString().split('T')[0],
    dose: '1 dosis', lot: '', veterinarian: '', farmName: '', municipio: '',
  });

  const activeAnimals = animals.filter(a => a.status === 'activo');

  const selectedMobilityOption = MOBILITY_TYPE_OPTIONS.find(o => o.value === movForm.mobility_type);

  const handleMovementGuide = async () => {
    const requiredFields = [
      { field: movForm.farmName, label: 'Nombre del Predio' },
      { field: movForm.ownerName, label: 'Nombre del Propietario' },
      { field: movForm.origin, label: 'Origen' },
      { field: movForm.destination, label: 'Destino' },
      { field: movForm.transport, label: 'Transportador' },
    ];
    const missing = requiredFields.find(f => !f.field.trim());
    if (missing) {
      toast.error(`Campo requerido: ${missing.label}`);
      return;
    }
    const chosenAnimals = activeAnimals.filter(a => selectedAnimals.includes(a.id));
    const docId = await generateMovementGuide({ ...movForm, animals: chosenAnimals });
    if (docId) {
      await addMobilityEvents(chosenAnimals, {
        mobility_type: movForm.mobility_type,
        destination: movForm.destination,
        start_date: movForm.date,
        return_date: selectedMobilityOption?.isTemporary && movForm.return_date ? movForm.return_date : undefined,
        document_id: docId,
      });
    }
    setOpenDialog(null);
  };

  const handleVaccinationCert = async () => {
    const animal = animals.find(a => a.id === vacForm.animalId);
    if (!animal) return;
    await generateVaccinationCertificate({ ...vacForm, animal });
    setOpenDialog(null);
  };

  const toggleAnimal = (id: string) => {
    setSelectedAnimals(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedAnimals(activeAnimals.map(a => a.id));
  const selectNone = () => setSelectedAnimals([]);

  const resolveEventObj = activeEvents.find(e => e.id === resolveDialogEvent);

  const handleResolve = async (resolution: 'returned' | 'sold' | 'dead') => {
    if (!resolveDialogEvent || !resolveEventObj) return;
    await resolveEvent(resolveDialogEvent, resolution);
    if (resolution === 'sold') {
      await updateAnimal(resolveEventObj.animal_id, { status: 'vendido', status_reason: 'Vendido en movilización' });
    } else if (resolution === 'dead') {
      await updateAnimal(resolveEventObj.animal_id, { status: 'muerto', status_reason: 'Sacrificio en movilización' });
    }
    setResolveDialogEvent(null);
  };

  const handleExtend = async () => {
    if (!resolveDialogEvent || !extendDate) return;
    await extendReturnDate(resolveDialogEvent, extendDate);
    setResolveDialogEvent(null);
    setExtendDate('');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <FileCheck className="h-8 w-8 text-green-600" />
            Documentos Oficiales
          </h1>
          <p className="text-muted-foreground">
            Genera guías de movilización y certificados sanitarios en formato PDF
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {DOCUMENT_TYPES.map(dt => (
            <Card key={dt.id} className={`border cursor-pointer hover:shadow-md transition-shadow ${dt.bg}`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${dt.color}`}>
                  <dt.icon className="h-6 w-6" />
                  {dt.title}
                </CardTitle>
                <CardDescription>{dt.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => { setOpenDialog(dt.id); setSelectedAnimals([]); }} className="gap-2">
                  <Download className="h-4 w-4" />
                  Generar PDF
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Animales en Tránsito */}
        {activeEvents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <MapPin className="h-5 w-5" />
                Animales en Tránsito ({activeEvents.length})
              </CardTitle>
              <CardDescription>Animales con guía de movilización activa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {activeEvents.map(ev => {
                  const expired = isExpired(ev);
                  return (
                    <div
                      key={ev.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        expired
                          ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                          : 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{ev.tag_id}</span>
                          {ev.name && <span className="text-muted-foreground text-sm">({ev.name})</span>}
                          <Badge variant="outline" className="text-xs">
                            {MOBILITY_LABELS[ev.mobility_type]}
                          </Badge>
                          {expired && (
                            <Badge className="bg-red-500 text-white text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Vencida
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Destino: {ev.destination} | Salida: {ev.start_date}
                          {ev.return_date && ` | Retorno: ${ev.return_date}`}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setResolveDialogEvent(ev.id)}
                      >
                        Resolver
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Movement Guide Dialog */}
        <Dialog open={openDialog === 'guia_movilizacion'} onOpenChange={() => setOpenDialog(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-600" />
                Guía de Movilización Animal
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Nombre del Predio</Label>
                  <Input value={movForm.farmName} onChange={e => setMovForm(p => ({ ...p, farmName: e.target.value }))} placeholder="Hacienda El Prado" />
                </div>
                <div className="space-y-1">
                  <Label>Propietario</Label>
                  <Input value={movForm.ownerName} onChange={e => setMovForm(p => ({ ...p, ownerName: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Municipio</Label>
                  <Input value={movForm.municipio} onChange={e => setMovForm(p => ({ ...p, municipio: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Departamento</Label>
                  <Input value={movForm.departamento} onChange={e => setMovForm(p => ({ ...p, departamento: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Origen</Label>
                  <Input value={movForm.origin} onChange={e => setMovForm(p => ({ ...p, origin: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Destino</Label>
                  <Input value={movForm.destination} onChange={e => setMovForm(p => ({ ...p, destination: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Transportador</Label>
                  <Input value={movForm.transport} onChange={e => setMovForm(p => ({ ...p, transport: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Placa / Cédula</Label>
                  <Input value={movForm.transportId} onChange={e => setMovForm(p => ({ ...p, transportId: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Fecha</Label>
                  <Input type="date" value={movForm.date} onChange={e => setMovForm(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Motivo</Label>
                  <Select value={movForm.reason} onValueChange={v => setMovForm(p => ({ ...p, reason: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="venta">Venta</SelectItem>
                      <SelectItem value="feria">Feria</SelectItem>
                      <SelectItem value="traslado">Traslado</SelectItem>
                      <SelectItem value="sacrificio">Sacrificio</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Mobility tracking section */}
              <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  Tipo de Movilización (para rastreo)
                </Label>
                <Select value={movForm.mobility_type} onValueChange={v => setMovForm(p => ({ ...p, mobility_type: v as MobilityType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MOBILITY_TYPE_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedMobilityOption?.isTemporary && (
                  <div className="space-y-1">
                    <Label className="text-sm">Fecha de Retorno Estimada</Label>
                    <Input
                      type="date"
                      value={movForm.return_date}
                      min={movForm.date}
                      onChange={e => setMovForm(p => ({ ...p, return_date: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Recibirás una alerta si el animal no retorna antes de esta fecha
                    </p>
                  </div>
                )}
                {!selectedMobilityOption?.isTemporary && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    El animal quedará marcado para dar de baja. Confirma en ConsultarAnimal.
                  </p>
                )}
              </div>

              {/* Animal selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Animales a movilizar ({selectedAnimals.length} seleccionados)</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAll}>Todos</Button>
                    <Button variant="outline" size="sm" onClick={selectNone}>Ninguno</Button>
                  </div>
                </div>
                <div className="border rounded-lg max-h-40 overflow-y-auto p-2 space-y-1">
                  {activeAnimals.map(a => (
                    <div key={a.id} className="flex items-center gap-2 hover:bg-muted/50 rounded px-2 py-1">
                      <Checkbox
                        checked={selectedAnimals.includes(a.id)}
                        onCheckedChange={() => toggleAnimal(a.id)}
                      />
                      <span className="text-sm font-medium">{a.tag_id}</span>
                      {a.name && <span className="text-sm text-muted-foreground">{a.name}</span>}
                      <span className="text-xs text-muted-foreground ml-auto">{a.category}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenDialog(null)}>Cancelar</Button>
              <Button
                onClick={handleMovementGuide}
                disabled={generating || selectedAnimals.length === 0}
                className="gap-2"
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Generar PDF ({selectedAnimals.length} animales)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Vaccination Certificate Dialog */}
        <Dialog open={openDialog === 'cert_vacunacion'} onOpenChange={() => setOpenDialog(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Syringe className="h-5 w-5 text-green-600" />
                Certificado de Vacunación
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Animal</Label>
                <Select value={vacForm.animalId} onValueChange={v => setVacForm(p => ({ ...p, animalId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar animal..." /></SelectTrigger>
                  <SelectContent>
                    {activeAnimals.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.tag_id}{a.name ? ` - ${a.name}` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Vacuna</Label>
                  <Input value={vacForm.vaccineName} onChange={e => setVacForm(p => ({ ...p, vaccineName: e.target.value }))} placeholder="Fiebre Aftosa" />
                </div>
                <div className="space-y-1">
                  <Label>Fecha</Label>
                  <Input type="date" value={vacForm.applicationDate} onChange={e => setVacForm(p => ({ ...p, applicationDate: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Dosis</Label>
                  <Input value={vacForm.dose} onChange={e => setVacForm(p => ({ ...p, dose: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Lote</Label>
                  <Input value={vacForm.lot} onChange={e => setVacForm(p => ({ ...p, lot: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Veterinario</Label>
                  <Input value={vacForm.veterinarian} onChange={e => setVacForm(p => ({ ...p, veterinarian: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Municipio</Label>
                  <Input value={vacForm.municipio} onChange={e => setVacForm(p => ({ ...p, municipio: e.target.value }))} />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>Nombre del Predio</Label>
                  <Input value={vacForm.farmName} onChange={e => setVacForm(p => ({ ...p, farmName: e.target.value }))} />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenDialog(null)}>Cancelar</Button>
              <Button
                onClick={handleVaccinationCert}
                disabled={generating || !vacForm.animalId || !vacForm.vaccineName}
                className="gap-2"
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Generar Certificado
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Resolve Mobility Dialog */}
        <Dialog open={!!resolveDialogEvent} onOpenChange={() => { setResolveDialogEvent(null); setExtendDate(''); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Resolver Movilización</DialogTitle>
            </DialogHeader>
            {resolveEventObj && (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-muted text-sm">
                  <p><strong>{resolveEventObj.tag_id}</strong>{resolveEventObj.name ? ` (${resolveEventObj.name})` : ''}</p>
                  <p className="text-muted-foreground">{MOBILITY_LABELS[resolveEventObj.mobility_type]} → {resolveEventObj.destination}</p>
                  {resolveEventObj.return_date && (
                    <p className={`text-xs mt-1 ${isExpired(resolveEventObj) ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                      Retorno: {resolveEventObj.return_date}
                      {isExpired(resolveEventObj) && ' (VENCIDA)'}
                    </p>
                  )}
                </div>
                <p className="text-sm font-medium">¿Qué ocurrió con el animal?</p>
                <div className="space-y-2">
                  <Button
                    className="w-full justify-start gap-2"
                    variant="outline"
                    onClick={() => handleResolve('returned')}
                  >
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Retornó a la finca
                  </Button>
                  <Button
                    className="w-full justify-start gap-2"
                    variant="outline"
                    onClick={() => handleResolve('sold')}
                  >
                    <FileCheck className="h-4 w-4 text-blue-600" />
                    Se vendió — dar de baja (vendido)
                  </Button>
                  <Button
                    className="w-full justify-start gap-2"
                    variant="outline"
                    onClick={() => handleResolve('dead')}
                  >
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    Fue sacrificado — dar de baja
                  </Button>
                  {resolveEventObj.return_date && (
                    <div className="space-y-1 pt-2 border-t">
                      <p className="text-xs text-muted-foreground">Ampliar fecha de retorno:</p>
                      <div className="flex gap-2">
                        <Input
                          type="date"
                          value={extendDate}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={e => setExtendDate(e.target.value)}
                          className="h-8 text-xs"
                        />
                        <Button size="sm" variant="outline" onClick={handleExtend} disabled={!extendDate}>
                          <Clock className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Document History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Historial de Documentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documentHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aún no has generado documentos. Los PDFs generados aparecerán aquí.
              </p>
            ) : (
              <div className="space-y-2">
                {documentHistory.slice(0, 20).map(rec => (
                  <div key={rec.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      {rec.type === 'guia_movilizacion'
                        ? <Truck className="h-4 w-4 text-blue-500 shrink-0" />
                        : <Syringe className="h-4 w-4 text-green-500 shrink-0" />
                      }
                      <div>
                        <p className="text-sm font-medium">{rec.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(rec.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          {rec.mobility_type && ` · ${MOBILITY_LABELS[rec.mobility_type as keyof typeof MOBILITY_LABELS] || rec.mobility_type}`}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteDocumentRecord(rec.id)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Acerca de los Documentos</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• <strong>Guía de Movilización:</strong> Requerida por el ICA para mover ganado entre predios. Los documentos generados son plantillas de referencia — verifique los requisitos actuales del ICA en su municipio.</p>
            <p>• <strong>Certificado de Vacunación:</strong> Registro de vacunas aplicadas. Útil para auditorías sanitarias y certificaciones.</p>
            <p>• Los PDFs se descargan directamente en su dispositivo. Imprima y lleve siempre el original firmado.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Documentos;
