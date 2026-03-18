import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { FileCheck, Truck, Syringe, FileText, Download, Loader2 } from 'lucide-react';
import { useDocumentos } from '@/hooks/useDocumentos';
import { useAnimals } from '@/hooks/useAnimals';
import { useHealth } from '@/hooks/useHealth';

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

const Documentos = () => {
  const { generateMovementGuide, generateVaccinationCertificate, generating } = useDocumentos();
  const { animals } = useAnimals();
  const { vaccinations } = useHealth();
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [selectedAnimals, setSelectedAnimals] = useState<string[]>([]);

  // Movement guide form
  const [movForm, setMovForm] = useState({
    farmName: '', ownerName: '', origin: '', destination: '',
    transport: '', transportId: '', date: new Date().toISOString().split('T')[0],
    reason: 'venta', municipio: '', departamento: '',
  });

  // Vaccination certificate form
  const [vacForm, setVacForm] = useState({
    animalId: '', vaccineName: '', applicationDate: new Date().toISOString().split('T')[0],
    dose: '1 dosis', lot: '', veterinarian: '', farmName: '', municipio: '',
  });

  const activeAnimals = animals.filter(a => a.status === 'activo');

  const handleMovementGuide = async () => {
    const chosenAnimals = activeAnimals.filter(a => selectedAnimals.includes(a.id));
    await generateMovementGuide({ ...movForm, animals: chosenAnimals });
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
