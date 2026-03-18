import { useState } from 'react';
import QRCode from 'react-qr-code';
import jsPDF from 'jspdf';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';

interface AnimalQRDialogProps {
  open: boolean;
  onClose: () => void;
  animal: {
    id: string;
    tag_id: string;
    name?: string | null;
    category: string;
    sex: string;
    birth_date?: string | null;
    breed?: string | null;
  };
  farmName?: string;
}

export const AnimalQRDialog = ({ open, onClose, animal, farmName = 'AgroData' }: AnimalQRDialogProps) => {
  const [generating, setGenerating] = useState(false);

  const qrValue = JSON.stringify({
    arete: animal.tag_id,
    nombre: animal.name || '',
    categoria: animal.category,
    sexo: animal.sex,
    raza: animal.breed || '',
    finca: farmName,
    sistema: 'AgroData',
    generado: new Date().toISOString().split('T')[0],
  });

  const handleDownloadPDF = async () => {
    setGenerating(true);
    try {
      const QRCodePkg = await import('qrcode');
      const qrDataUrl = await QRCodePkg.default.toDataURL(qrValue, { width: 200, margin: 1 });

      // Tamaño tarjeta: 85mm × 55mm
      const doc = new jsPDF({ unit: 'mm', format: [85, 55] });

      // Header verde
      doc.setFillColor(26, 92, 46);
      doc.rect(0, 0, 85, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.text('AgroData — Identificación Animal', 42.5, 5, { align: 'center' });
      doc.setFontSize(6);
      doc.text(farmName, 42.5, 9.5, { align: 'center' });

      // QR code
      doc.addImage(qrDataUrl, 'PNG', 3, 14, 34, 34);

      // Línea divisoria
      doc.setDrawColor(200, 200, 200);
      doc.line(40, 14, 40, 48);

      // Datos del animal
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(animal.tag_id, 43, 20);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      if (animal.name) {
        doc.text(animal.name, 43, 26);
      }
      doc.setFontSize(7);
      doc.setTextColor(80, 80, 80);
      doc.text(`Categoría: ${animal.category}`, 43, 31);
      doc.text(`Sexo: ${animal.sex === 'hembra' ? 'Hembra' : 'Macho'}`, 43, 36);
      if (animal.breed) {
        doc.text(`Raza: ${animal.breed}`, 43, 41);
      }
      if (animal.birth_date) {
        doc.text(`Nac: ${animal.birth_date}`, 43, 46);
      }

      // Footer
      doc.setFillColor(240, 240, 240);
      doc.rect(0, 50, 85, 5, 'F');
      doc.setTextColor(120, 120, 120);
      doc.setFontSize(5);
      doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 42.5, 53.5, { align: 'center' });

      doc.save(`QR_${animal.tag_id}.pdf`);
    } catch (err) {
      console.error('Error generating QR PDF:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Código QR — {animal.tag_id}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {/* QR Code display */}
          <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
            <QRCode
              value={qrValue}
              size={200}
              style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
            />
          </div>

          {/* Animal info */}
          <div className="w-full bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Arete:</span>
              <span className="font-semibold">{animal.tag_id}</span>
            </div>
            {animal.name && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nombre:</span>
                <span>{animal.name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Categoría:</span>
              <span className="capitalize">{animal.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Finca:</span>
              <span>{farmName}</span>
            </div>
          </div>

          {/* Action buttons */}
          <Button
            onClick={handleDownloadPDF}
            disabled={generating}
            className="w-full gap-2"
          >
            <Download className="h-4 w-4" />
            {generating ? 'Generando PDF...' : 'Descargar PDF (tarjeta)'}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            El PDF tiene formato de tarjeta (85×55mm) lista para imprimir
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
