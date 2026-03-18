import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTraceability, AnimalLifeSheet } from '@/hooks/useTraceability';
import { useAnimals } from '@/hooks/useAnimals';
import { FileText, Download, Loader2, Copy, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';

export const ExportLifeSheet = () => {
  const { animals } = useAnimals();
  const { generateLifeSheet, createExportRecord } = useTraceability();
  const [selectedAnimal, setSelectedAnimal] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [lifeSheet, setLifeSheet] = useState<AnimalLifeSheet | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeAnimals = animals.filter(a => a.status === 'activo');

  const handleGenerate = async () => {
    if (!selectedAnimal) return;
    setLoading(true);
    const sheet = await generateLifeSheet(selectedAnimal);
    setLifeSheet(sheet);
    setPreviewOpen(true);
    setLoading(false);
  };

  const handleExportPDF = async () => {
    if (!lifeSheet) return;

    const doc = new jsPDF();
    const animal = lifeSheet.animal;
    const PAGE_HEIGHT = 270;

    const checkBreak = (currentY: number, needed = 12): number => {
      if (currentY + needed > PAGE_HEIGHT) {
        doc.addPage();
        return 20;
      }
      return currentY;
    };

    // Título
    doc.setFontSize(20);
    doc.text('HOJA DE VIDA DEL ANIMAL', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.text(`Código de Verificación: ${lifeSheet.verificationCode}`, 105, 28, { align: 'center' });

    // Información básica
    doc.setFontSize(14);
    doc.text('Información General', 20, 45);
    doc.setFontSize(10);

    let y = 55;
    doc.text(`ID: ${animal.tag_id}`, 20, y);
    doc.text(`Nombre: ${animal.name || 'N/A'}`, 100, y);
    y += 7;
    doc.text(`Sexo: ${animal.sex}`, 20, y);
    doc.text(`Categoría: ${animal.category}`, 100, y);
    y += 7;
    doc.text(`Raza: ${animal.breed || 'N/A'}`, 20, y);
    doc.text(`Estado: ${animal.status}`, 100, y);
    y += 7;
    doc.text(`Fecha Nacimiento: ${animal.birth_date || 'N/A'}`, 20, y);
    doc.text(`Peso Actual: ${animal.current_weight || 'N/A'} kg`, 100, y);

    // Pedigrí
    y = checkBreak(y + 15, 20);
    doc.setFontSize(14);
    doc.text('Pedigrí', 20, y);
    doc.setFontSize(10);
    y += 10;
    doc.text(`Madre: ${lifeSheet.pedigree.mother?.tag_id || 'Desconocida'}`, 20, y);
    doc.text(`Padre: ${lifeSheet.pedigree.father?.tag_id || 'Desconocido'}`, 100, y);

    // Historial de peso
    y = checkBreak(y + 15, 25);
    doc.setFontSize(14);
    doc.text(`Historial de Peso (${lifeSheet.weightHistory.length} registros)`, 20, y);
    doc.setFontSize(10);
    y += 10;

    lifeSheet.weightHistory.slice(-5).forEach((w) => {
      y = checkBreak(y, 6);
      doc.text(`${w.date}: ${w.weight} kg${w.daily_gain ? ` (GDP: ${w.daily_gain} g/día)` : ''}`, 25, y);
      y += 5;
    });

    // Eventos de salud
    y = checkBreak(y + 10, 25);
    doc.setFontSize(14);
    doc.text(`Eventos de Salud (${lifeSheet.healthEvents.length} registros)`, 20, y);
    doc.setFontSize(10);
    y += 10;

    lifeSheet.healthEvents.slice(-5).forEach((h) => {
      y = checkBreak(y, 6);
      doc.text(`${h.date}: ${h.type}${h.diagnosis ? ` - ${h.diagnosis}` : ''}`, 25, y);
      y += 5;
    });

    // Eventos reproductivos
    if (lifeSheet.reproductiveEvents.length > 0) {
      y = checkBreak(y + 10, 25);
      doc.setFontSize(14);
      doc.text(`Eventos Reproductivos (${lifeSheet.reproductiveEvents.length} registros)`, 20, y);
      doc.setFontSize(10);
      y += 10;

      lifeSheet.reproductiveEvents.slice(-5).forEach((r) => {
        y = checkBreak(y, 6);
        doc.text(`${r.date}: ${r.type}${r.result ? ` - ${r.result}` : ''}`, 25, y);
        y += 5;
      });
    }

    // Pie de página (última página)
    const totalPages = doc.getNumberOfPages();
    doc.setPage(totalPages);
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.text(`Generado: ${new Date(lifeSheet.generatedAt).toLocaleString()}`, 20, pageH - 10);
    doc.text('Sistema de Gestión Ganadera', 190, pageH - 10, { align: 'right' });

    doc.save(`hoja_vida_${animal.tag_id}.pdf`);

    // Registrar exportación
    await createExportRecord(animal.id, lifeSheet, destination);
  };

  const handleExportJSON = async () => {
    if (!lifeSheet) return;

    const dataStr = JSON.stringify(lifeSheet, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportName = `hoja_vida_${lifeSheet.animal.tag_id}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportName);
    linkElement.click();

    await createExportRecord(lifeSheet.animal.id, lifeSheet, destination);
  };

  const handleCopyCode = () => {
    if (lifeSheet) {
      navigator.clipboard.writeText(lifeSheet.verificationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Exportar Hoja de Vida
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Seleccionar Animal</Label>
            <Select value={selectedAnimal} onValueChange={setSelectedAnimal}>
              <SelectTrigger>
                <SelectValue placeholder="Elegir animal para exportar" />
              </SelectTrigger>
              <SelectContent>
                {activeAnimals.map((animal) => (
                  <SelectItem key={animal.id} value={animal.id}>
                    {animal.tag_id} - {animal.name || animal.category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Destino (opcional)</Label>
            <Input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Nombre de la finca o comprador"
            />
          </div>

          <Button onClick={handleGenerate} disabled={!selectedAnimal || loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <FileText className="mr-2 h-4 w-4" />
            Generar Hoja de Vida
          </Button>
        </CardContent>
      </Card>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vista Previa - Hoja de Vida</DialogTitle>
          </DialogHeader>

          {lifeSheet && (
            <div className="space-y-6">
              {/* Código de verificación */}
              <div className="bg-muted p-4 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Código de Verificación</p>
                  <p className="text-xl font-mono font-bold">{lifeSheet.verificationCode}</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleCopyCode}>
                  {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              {/* Información básica */}
              <div>
                <h3 className="font-semibold mb-2">Información del Animal</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">ID</p>
                    <p className="font-medium">{lifeSheet.animal.tag_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre</p>
                    <p className="font-medium">{lifeSheet.animal.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sexo</p>
                    <p className="font-medium">{lifeSheet.animal.sex}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Categoría</p>
                    <p className="font-medium">{lifeSheet.animal.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Raza</p>
                    <p className="font-medium">{lifeSheet.animal.breed || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nacimiento</p>
                    <p className="font-medium">{lifeSheet.animal.birth_date || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Peso Actual</p>
                    <p className="font-medium">{lifeSheet.animal.current_weight || 'N/A'} kg</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estado</p>
                    <Badge>{lifeSheet.animal.status}</Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Pedigrí */}
              <div>
                <h3 className="font-semibold mb-2">Pedigrí</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Madre</p>
                    <p className="font-medium">
                      {lifeSheet.pedigree.mother?.tag_id || 'Desconocida'}
                      {lifeSheet.pedigree.mother?.name && ` (${lifeSheet.pedigree.mother.name})`}
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Padre</p>
                    <p className="font-medium">
                      {lifeSheet.pedigree.father?.tag_id || 'Desconocido'}
                      {lifeSheet.pedigree.father?.name && ` (${lifeSheet.pedigree.father.name})`}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Resumen */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{lifeSheet.weightHistory.length}</p>
                  <p className="text-sm text-muted-foreground">Pesajes</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{lifeSheet.healthEvents.length}</p>
                  <p className="text-sm text-muted-foreground">Eventos Salud</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{lifeSheet.reproductiveEvents.length}</p>
                  <p className="text-sm text-muted-foreground">Eventos Reprod.</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{lifeSheet.events.length}</p>
                  <p className="text-sm text-muted-foreground">Otros Eventos</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Cerrar
            </Button>
            <Button variant="outline" onClick={handleExportJSON}>
              <Download className="mr-2 h-4 w-4" />
              Exportar JSON
            </Button>
            <Button onClick={handleExportPDF}>
              <Download className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
