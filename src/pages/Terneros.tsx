import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Baby, AlertTriangle, TrendingUp, Milk, Scale, Activity } from 'lucide-react';
import { useTerneros } from '@/hooks/useTerneros';

const Terneros = () => {
  const {
    terneros,
    colostrumAlerts,
    weaningAlerts,
    getCalfGrowthRate,
    getDaysOfLife,
    avgGDP,
    addHealthEvent,
    addWeightRecord,
    loading,
  } = useTerneros();

  const totalAlerts = colostrumAlerts.length + weaningAlerts.length;

  const handleRegisterColostrum = async (animalId: string) => {
    await addHealthEvent({
      animal_id: animalId,
      event_type: 'tratamiento',
      event_date: new Date().toISOString().split('T')[0],
      notes: 'Calostro suministrado',
    });
  };

  const handleRegisterWeaning = async (animalId: string, currentWeight: number | null) => {
    if (!currentWeight) return;
    await addWeightRecord({
      animal_id: animalId,
      weight_date: new Date().toISOString().split('T')[0],
      weight_kg: currentWeight,
      weight_type: 'destete',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Baby className="h-8 w-8 text-purple-500" />
            Gestión de Terneros
          </h1>
          <p className="text-muted-foreground">Monitoreo de calostro, crecimiento y destete</p>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Baby className="h-4 w-4 text-purple-500" />
                Total Terneros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{terneros.length}</div>
              <p className="text-xs text-muted-foreground">Activos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-600">
                <Milk className="h-4 w-4" />
                Alertas Calostro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${colostrumAlerts.length > 0 ? 'text-amber-600' : ''}`}>
                {colostrumAlerts.length}
              </div>
              <p className="text-xs text-muted-foreground">Sin calostro registrado (≤3 días)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-600">
                <Scale className="h-4 w-4" />
                Próximos a Destetar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${weaningAlerts.length > 0 ? 'text-blue-600' : ''}`}>
                {weaningAlerts.length}
              </div>
              <p className="text-xs text-muted-foreground">60-120 días sin destete</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                GDP Promedio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${avgGDP && avgGDP > 500 ? 'text-green-600' : ''}`}>
                {avgGDP ? `${avgGDP.toFixed(0)} g/día` : '--'}
              </div>
              <p className="text-xs text-muted-foreground">Ganancia diaria de peso</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue={totalAlerts > 0 ? 'alerts' : 'todos'} className="space-y-4">
          <TabsList>
            <TabsTrigger value="todos">
              <Baby className="mr-1 h-4 w-4" />
              Todos ({terneros.length})
            </TabsTrigger>
            <TabsTrigger value="alerts" className="relative">
              <AlertTriangle className="mr-1 h-4 w-4" />
              Alertas
              {totalAlerts > 0 && (
                <Badge className="ml-1 h-4 px-1 text-xs bg-red-500 text-white">{totalAlerts}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="crecimiento">
              <Activity className="mr-1 h-4 w-4" />
              Crecimiento
            </TabsTrigger>
          </TabsList>

          <TabsContent value="todos">
            <Card>
              <CardHeader>
                <CardTitle>Inventario de Terneros</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Cargando...</div>
                ) : terneros.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Baby className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay terneros activos registrados</p>
                    <p className="text-sm mt-1">Registra animales con categoría ternero/a o becerro/a</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Arete</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Sexo</TableHead>
                        <TableHead>Fecha Nac.</TableHead>
                        <TableHead className="text-right">Días de Vida</TableHead>
                        <TableHead className="text-right">Peso Actual</TableHead>
                        <TableHead className="text-right">GDP</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {terneros.map(t => {
                        const dol = getDaysOfLife(t.birth_date);
                        const gdp = getCalfGrowthRate(t.id);
                        const hasColostrumAlert = colostrumAlerts.some(a => a.id === t.id);
                        const hasWeaningAlert = weaningAlerts.some(a => a.id === t.id);
                        return (
                          <TableRow key={t.id}>
                            <TableCell className="font-medium">{t.tag_id}</TableCell>
                            <TableCell>{t.name || '-'}</TableCell>
                            <TableCell>{t.sex === 'hembra' ? 'H' : 'M'}</TableCell>
                            <TableCell>{t.birth_date || '-'}</TableCell>
                            <TableCell className="text-right">{dol !== null ? `${dol}d` : '-'}</TableCell>
                            <TableCell className="text-right">{t.current_weight ? `${t.current_weight} kg` : '-'}</TableCell>
                            <TableCell className="text-right">
                              {gdp !== null ? (
                                <span className={gdp >= 500 ? 'text-green-600' : 'text-amber-600'}>
                                  {gdp.toFixed(0)} g/d
                                </span>
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              {hasColostrumAlert && <Badge className="bg-amber-500 text-white text-xs mr-1">Calostro</Badge>}
                              {hasWeaningAlert && <Badge className="bg-blue-500 text-white text-xs">Destete</Badge>}
                              {!hasColostrumAlert && !hasWeaningAlert && <Badge variant="outline" className="text-xs">OK</Badge>}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts">
            <div className="space-y-4">
              {/* Colostrum alerts */}
              {colostrumAlerts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base text-amber-600 flex items-center gap-2">
                      <Milk className="h-4 w-4" />
                      Calostro Pendiente ({colostrumAlerts.length})
                    </CardTitle>
                    <CardDescription>
                      Terneros ≤3 días de vida sin registro de suministro de calostro
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {colostrumAlerts.map(t => (
                        <div key={t.id} className="flex items-center justify-between p-3 border border-amber-200 rounded-lg bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
                          <div>
                            <span className="font-semibold">{t.tag_id}</span>
                            {t.name && <span className="text-muted-foreground ml-2">({t.name})</span>}
                            <p className="text-xs text-muted-foreground">
                              Nacido: {t.birth_date} — {getDaysOfLife(t.birth_date)} días de vida
                            </p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => handleRegisterColostrum(t.id)}>
                            Registrar Calostro
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Weaning alerts */}
              {weaningAlerts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base text-blue-600 flex items-center gap-2">
                      <Scale className="h-4 w-4" />
                      Destete Pendiente ({weaningAlerts.length})
                    </CardTitle>
                    <CardDescription>
                      Terneros entre 60-120 días sin registro de peso al destete
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {weaningAlerts.map(t => (
                        <div key={t.id} className="flex items-center justify-between p-3 border border-blue-200 rounded-lg bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                          <div>
                            <span className="font-semibold">{t.tag_id}</span>
                            {t.name && <span className="text-muted-foreground ml-2">({t.name})</span>}
                            <p className="text-xs text-muted-foreground">
                              {getDaysOfLife(t.birth_date)} días — Peso actual: {t.current_weight ? `${t.current_weight} kg` : 'no registrado'}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRegisterWeaning(t.id, t.current_weight)}
                            disabled={!t.current_weight}
                          >
                            Registrar Destete
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {totalAlerts === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Baby className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
                    <p className="text-lg font-medium text-green-600">¡Sin alertas pendientes!</p>
                    <p className="text-muted-foreground mt-1">Todos los terneros están al día</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="crecimiento">
            <Card>
              <CardHeader>
                <CardTitle>Curvas de Crecimiento</CardTitle>
                <CardDescription>Ganancia diaria de peso por ternero</CardDescription>
              </CardHeader>
              <CardContent>
                {terneros.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No hay terneros registrados</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Arete</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead className="text-right">Días de Vida</TableHead>
                        <TableHead className="text-right">Peso Actual</TableHead>
                        <TableHead className="text-right">GDP (g/día)</TableHead>
                        <TableHead>Desempeño</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {terneros
                        .map(t => ({ t, gdp: getCalfGrowthRate(t.id) }))
                        .sort((a, b) => (b.gdp || 0) - (a.gdp || 0))
                        .map(({ t, gdp }) => (
                          <TableRow key={t.id}>
                            <TableCell className="font-medium">{t.tag_id}</TableCell>
                            <TableCell>{t.name || '-'}</TableCell>
                            <TableCell className="text-right">{getDaysOfLife(t.birth_date) ?? '-'}</TableCell>
                            <TableCell className="text-right">{t.current_weight ? `${t.current_weight} kg` : '-'}</TableCell>
                            <TableCell className="text-right font-medium">
                              {gdp !== null ? gdp.toFixed(0) : '-'}
                            </TableCell>
                            <TableCell>
                              {gdp === null ? (
                                <Badge variant="outline" className="text-xs">Sin datos</Badge>
                              ) : gdp >= 700 ? (
                                <Badge className="bg-green-500 text-white text-xs">Excelente</Badge>
                              ) : gdp >= 500 ? (
                                <Badge className="bg-blue-500 text-white text-xs">Bueno</Badge>
                              ) : gdp >= 300 ? (
                                <Badge className="bg-amber-500 text-white text-xs">Regular</Badge>
                              ) : (
                                <Badge className="bg-red-500 text-white text-xs">Bajo</Badge>
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
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Terneros;
