import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';

export interface MovementGuideParams {
  animals: {
    tag_id: string;
    name?: string | null;
    category: string;
    sex: string;
    current_weight?: number | null;
  }[];
  farmName: string;
  ownerName: string;
  origin: string;
  destination: string;
  transport: string;
  transportId: string;
  date: string;
  reason: string;
  municipio: string;
  departamento: string;
}

export interface VaccinationCertParams {
  animal: {
    tag_id: string;
    name?: string | null;
    category: string;
    sex: string;
    birth_date?: string | null;
    breed?: string | null;
  };
  vaccineName: string;
  applicationDate: string;
  dose: string;
  lot: string;
  veterinarian: string;
  farmName: string;
  municipio: string;
}

export const useDocumentos = () => {
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const generateMovementGuide = async (params: MovementGuideParams) => {
    setGenerating(true);
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });

      // Header
      doc.setFillColor(26, 92, 46);
      doc.rect(0, 0, 210, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('GUÍA DE MOVILIZACIÓN ANIMAL', 105, 13, { align: 'center' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Sistema AgroData — República de Colombia', 105, 21, { align: 'center' });
      doc.text(`No. ${Date.now().toString().slice(-8)}`, 105, 27, { align: 'center' });

      // Predio data
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('DATOS DEL PREDIO ORIGEN', 14, 40);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      const col1 = 14, col2 = 105;
      doc.text(`Nombre del Predio: ${params.farmName}`, col1, 47);
      doc.text(`Municipio: ${params.municipio}`, col2, 47);
      doc.text(`Propietario: ${params.ownerName}`, col1, 53);
      doc.text(`Departamento: ${params.departamento}`, col2, 53);
      doc.text(`Origen: ${params.origin}`, col1, 59);
      doc.text(`Destino: ${params.destination}`, col2, 59);
      doc.text(`Fecha de Movilización: ${params.date}`, col1, 65);
      doc.text(`Motivo: ${params.reason}`, col2, 65);
      doc.text(`Transportador: ${params.transport}`, col1, 71);
      doc.text(`ID/Placa: ${params.transportId}`, col2, 71);

      doc.setDrawColor(200, 200, 200);
      doc.line(14, 75, 196, 75);

      // Animal table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('RELACIÓN DE ANIMALES A MOVILIZAR', 14, 82);

      autoTable(doc, {
        startY: 86,
        head: [['#', 'Arete', 'Nombre', 'Categoría', 'Sexo', 'Peso Aprox.']],
        body: params.animals.map((a, i) => [
          i + 1,
          a.tag_id,
          a.name || '',
          a.category,
          a.sex === 'hembra' ? 'Hembra' : 'Macho',
          a.current_weight ? `${a.current_weight} kg` : '-',
        ]),
        headStyles: { fillColor: [26, 92, 46], textColor: 255, fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [245, 250, 245] },
        margin: { left: 14, right: 14 },
      });

      const finalY = (doc as any).lastAutoTable.finalY || 150;

      // Summary
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`Total animales: ${params.animals.length}`, 14, finalY + 10);

      // Signatures
      const sigY = finalY + 35;
      doc.setFont('helvetica', 'normal');
      doc.line(14, sigY, 90, sigY);
      doc.line(120, sigY, 196, sigY);
      doc.text('Firma del Propietario / Autorizado', 14, sigY + 5);
      doc.text('Firma del Transportador', 120, sigY + 5);

      // Footer
      doc.setFillColor(240, 240, 240);
      doc.rect(0, 285, 210, 12, 'F');
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(7);
      doc.text(`Generado por AgroData el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`, 105, 292, { align: 'center' });
      doc.text('Documento de referencia — Verificar requisitos ICA/SENASA vigentes', 105, 296, { align: 'center' });

      doc.save(`Guia_Movilizacion_${params.date.replace(/-/g, '')}.pdf`);
      toast({ title: 'PDF generado', description: `Guía de movilización para ${params.animals.length} animales` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const generateVaccinationCertificate = async (params: VaccinationCertParams) => {
    setGenerating(true);
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });

      // Header
      doc.setFillColor(26, 92, 46);
      doc.rect(0, 0, 210, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('CERTIFICADO DE VACUNACIÓN', 105, 13, { align: 'center' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`${params.farmName} — ${params.municipio}`, 105, 21, { align: 'center' });

      doc.setTextColor(0, 0, 0);

      // Animal data box
      doc.setFillColor(245, 250, 245);
      doc.rect(14, 40, 182, 55, 'F');
      doc.setDrawColor(26, 92, 46);
      doc.rect(14, 40, 182, 55, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('DATOS DEL ANIMAL', 20, 50);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Arete: ${params.animal.tag_id}`, 20, 58);
      doc.text(`Nombre: ${params.animal.name || 'N/A'}`, 110, 58);
      doc.text(`Categoría: ${params.animal.category}`, 20, 65);
      doc.text(`Sexo: ${params.animal.sex === 'hembra' ? 'Hembra' : 'Macho'}`, 110, 65);
      doc.text(`Fecha Nac.: ${params.animal.birth_date || 'N/A'}`, 20, 72);
      doc.text(`Raza: ${params.animal.breed || 'N/A'}`, 110, 72);
      doc.text(`Finca: ${params.farmName}`, 20, 79);
      doc.text(`Municipio: ${params.municipio}`, 110, 79);
      doc.text(`Fecha Vacunación: ${params.applicationDate}`, 20, 86);

      // Vaccine data
      doc.setFillColor(230, 245, 230);
      doc.rect(14, 105, 182, 50, 'F');
      doc.setDrawColor(26, 92, 46);
      doc.rect(14, 105, 182, 50, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('DATOS DE VACUNACIÓN', 20, 115);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Vacuna: ${params.vaccineName}`, 20, 123);
      doc.text(`Fecha: ${params.applicationDate}`, 110, 123);
      doc.text(`Dosis: ${params.dose}`, 20, 130);
      doc.text(`Lote: ${params.lot}`, 110, 130);
      doc.text(`Aplicado por: ${params.veterinarian}`, 20, 137);
      doc.text(`Próxima aplicación: Según protocolo ICA`, 110, 137);
      doc.text(`Municipio: ${params.municipio}`, 20, 144);

      // Signatures
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.line(20, 190, 90, 190);
      doc.line(120, 190, 190, 190);
      doc.text('Firma / Sello del Médico Veterinario', 20, 196);
      doc.text('Firma del Propietario', 120, 196);
      doc.text(`${params.veterinarian}`, 20, 200);

      // Footer
      doc.setFillColor(240, 240, 240);
      doc.rect(0, 285, 210, 12, 'F');
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(7);
      doc.text(`Generado por AgroData el ${new Date().toLocaleDateString('es-ES')}`, 105, 292, { align: 'center' });

      doc.save(`Cert_Vacunacion_${params.animal.tag_id}_${params.applicationDate.replace(/-/g, '')}.pdf`);
      toast({ title: 'Certificado generado', description: `${params.vaccineName} — ${params.animal.tag_id}` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  return { generateMovementGuide, generateVaccinationCertificate, generating };
};
