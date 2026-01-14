import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Eye, Stethoscope, AlertTriangle, CheckCircle2, Brain } from 'lucide-react';
import { PalpationRecord, OVARY_FINDINGS, UTERUS_FINDINGS, REPRODUCTIVE_CONDITIONS } from '@/hooks/usePalpationRecords';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

interface PalpationRecordsTableProps {
  records: PalpationRecord[];
  onDelete: (id: string) => void;
}

interface AnimalInfo {
  id: string;
  tag_id: string;
  name: string | null;
}

export const PalpationRecordsTable = ({ records, onDelete }: PalpationRecordsTableProps) => {
  const [selectedRecord, setSelectedRecord] = useState<PalpationRecord | null>(null);
  const [animals, setAnimals] = useState<Record<string, AnimalInfo>>({});

  useEffect(() => {
    const fetchAnimals = async () => {
      const animalIds = [...new Set(records.map(r => r.animal_id))];
      if (animalIds.length === 0) return;
      
      const { data } = await supabase
        .from('animals')
        .select('id, tag_id, name')
        .in('id', animalIds);
      
      if (data) {
        const animalsMap: Record<string, AnimalInfo> = {};
        data.forEach(a => { animalsMap[a.id] = a; });
        setAnimals(animalsMap);
      }
    };
    fetchAnimals();
  }, [records]);

  const getAnimalLabel = (animalId: string) => {
    const animal = animals[animalId];
    if (!animal) return animalId.slice(0, 8);
    return `${animal.tag_id}${animal.name ? ` - ${animal.name}` : ''}`;
  };

  const getAlertBadge = (level?: string) => {
    switch (level) {
      case 'urgent':
        return <Badge variant="destructive">🔴 Urgente</Badge>;
      case 'warning':
        return <Badge className="bg-amber-500">🟡 Atención</Badge>;
      default:
        return <Badge variant="outline" className="text-green-600">✓ Normal</Badge>;
    }
  };

  const getOvaryFindingLabel = (id: string) => {
    const allFindings = [...OVARY_FINDINGS.normal, ...OVARY_FINDINGS.inactive, ...OVARY_FINDINGS.alterations];
    return allFindings.find(f => f.id === id)?.label || id;
  };

  const getUterusFindingLabel = (id: string) => {
    const allFindings = [...UTERUS_FINDINGS.normal, ...UTERUS_FINDINGS.alterations];
    return allFindings.find(f => f.id === id)?.label || id;
  };

  const getConditionLabel = (id?: string) => {
    if (!id) return 'N/A';
    return REPRODUCTIVE_CONDITIONS.find(c => c.id === id)?.label || id;
  };

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Sin registros de palpación</p>
            <p className="text-sm">Registre su primera palpación reproductiva</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Historial de Palpaciones
          </CardTitle>
          <CardDescription>
            Registros detallados de palpaciones reproductivas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Animal</TableHead>
                  <TableHead>Especie</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead>BCS</TableHead>
                  <TableHead>Diagnóstico IA</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      {format(parseISO(record.palpation_date), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="font-medium">
                      {getAnimalLabel(record.animal_id)}
                    </TableCell>
                    <TableCell>
                      {record.species === 'bovino' ? '🐄' : '🐃'} {record.species}
                    </TableCell>
                    <TableCell>
                      {record.is_pregnant ? (
                        <Badge className="bg-green-600">
                          Preñada {record.gestation_days && `(${record.gestation_days}d)`}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Vacía</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.body_condition_score ? (
                        <Badge 
                          variant="outline"
                          className={
                            record.body_condition_score < 2.75 
                              ? 'text-destructive border-destructive' 
                              : record.body_condition_score > 4 
                                ? 'text-amber-600 border-amber-600'
                                : 'text-green-600 border-green-600'
                          }
                        >
                          {record.body_condition_score}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getAlertBadge(record.ai_alert_level)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedRecord(record)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => onDelete(record.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Detalle de Palpación
            </DialogTitle>
            <DialogDescription>
              {selectedRecord && getAnimalLabel(selectedRecord.animal_id)} - {selectedRecord && format(parseISO(selectedRecord.palpation_date), 'dd MMMM yyyy', { locale: es })}
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-4 pr-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Especie</p>
                    <p className="font-medium">{selectedRecord.species === 'bovino' ? '🐄 Bovino' : '🐃 Bufalino'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Resultado</p>
                    <p className="font-medium">
                      {selectedRecord.is_pregnant ? `Preñada (${selectedRecord.gestation_days || 'N/D'} días)` : 'Vacía'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Condición Corporal</p>
                    <p className="font-medium">{selectedRecord.body_condition_score || 'N/D'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Veterinario</p>
                    <p className="font-medium">{selectedRecord.veterinarian || 'No especificado'}</p>
                  </div>
                </div>

                {/* Ovary Findings */}
                {selectedRecord.ovary_findings.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Hallazgos de Ovarios</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedRecord.ovary_findings.map((finding) => (
                          <Badge key={finding} variant="outline">
                            {getOvaryFindingLabel(finding)}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Uterus Findings */}
                {selectedRecord.uterus_findings.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Hallazgos de Útero</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedRecord.uterus_findings.map((finding) => (
                          <Badge key={finding} variant="outline">
                            {getUterusFindingLabel(finding)}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Reproductive Condition */}
                {selectedRecord.reproductive_condition && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Condición Reproductiva</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge>{getConditionLabel(selectedRecord.reproductive_condition)}</Badge>
                    </CardContent>
                  </Card>
                )}

                {/* AI Diagnosis */}
                {selectedRecord.ai_diagnosis && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Brain className="h-4 w-4 text-primary" />
                        Diagnóstico IA
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start gap-2">
                        {selectedRecord.ai_alert_level === 'urgent' ? (
                          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                        ) : selectedRecord.ai_alert_level === 'warning' ? (
                          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                        )}
                        <p>{selectedRecord.ai_diagnosis}</p>
                      </div>

                      {selectedRecord.ai_recommendations && selectedRecord.ai_recommendations.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Recomendaciones:</p>
                          <ul className="text-sm space-y-1">
                            {selectedRecord.ai_recommendations.map((rec, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Notes */}
                {selectedRecord.notes && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Notas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{selectedRecord.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
