import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Settings, Save, User, Bell, Database, Globe, Shield, 
  Download, Upload, RotateCcw, CheckCircle, Loader2, AlertTriangle, Cloud
} from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CloudBackupSettings } from '@/components/configuracion/CloudBackupSettings';

const Configuracion = () => {
  const { settings, preferences, saveSettings, savePreferences, exportData, resetSettings, loading } = useSettings();
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [localSettings, setLocalSettings] = useState(settings);
  const [localPreferences, setLocalPreferences] = useState(preferences);

  const handleSaveSettings = async () => {
    setSaving(true);
    saveSettings(localSettings);
    savePreferences(localPreferences);
    setSaving(false);
  };

  const handleExport = async () => {
    setExporting(true);
    await exportData();
    setExporting(false);
  };

  const handleReset = () => {
    if (confirm('¿Estás seguro de restablecer toda la configuración a valores por defecto?')) {
      resetSettings();
      setLocalSettings(settings);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Configuración General</h1>
            <p className="text-muted-foreground">Ajustes del sistema y preferencias</p>
          </div>
          <Button onClick={handleSaveSettings} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar Cambios
          </Button>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">
              <Globe className="mr-2 h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="alerts">
              <Bell className="mr-2 h-4 w-4" />
              Alertas
            </TabsTrigger>
            <TabsTrigger value="profile">
              <User className="mr-2 h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="backup">
              <Database className="mr-2 h-4 w-4" />
              Backup
            </TabsTrigger>
            <TabsTrigger value="permissions">
              <Shield className="mr-2 h-4 w-4" />
              Permisos
            </TabsTrigger>
          </TabsList>

          {/* General */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Unidades de Medida</CardTitle>
                <CardDescription>
                  Configura las unidades que se usarán en todo el sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Unidad de Peso</Label>
                    <Select
                      value={localSettings.weightUnit}
                      onValueChange={(value: 'kg' | 'lb') => 
                        setLocalSettings({ ...localSettings, weightUnit: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">Kilogramos (kg)</SelectItem>
                        <SelectItem value="lb">Libras (lb)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Unidad de Volumen</Label>
                    <Select
                      value={localSettings.volumeUnit}
                      onValueChange={(value: 'lt' | 'gal') => 
                        setLocalSettings({ ...localSettings, volumeUnit: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lt">Litros (lt)</SelectItem>
                        <SelectItem value="gal">Galones (gal)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Unidad de Área</Label>
                    <Select
                      value={localSettings.areaUnit}
                      onValueChange={(value: 'ha' | 'acres') => 
                        setLocalSettings({ ...localSettings, areaUnit: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ha">Hectáreas (ha)</SelectItem>
                        <SelectItem value="acres">Acres</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Formato de Fecha</Label>
                    <Select
                      value={localSettings.dateFormat}
                      onValueChange={(value: 'dd/mm/yyyy' | 'mm/dd/yyyy' | 'yyyy-mm-dd') => 
                        setLocalSettings({ ...localSettings, dateFormat: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dd/mm/yyyy">DD/MM/AAAA</SelectItem>
                        <SelectItem value="mm/dd/yyyy">MM/DD/AAAA</SelectItem>
                        <SelectItem value="yyyy-mm-dd">AAAA-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Moneda</CardTitle>
                <CardDescription>
                  Configura la moneda para los cálculos financieros
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Moneda</Label>
                    <Select
                      value={localSettings.currency}
                      onValueChange={(value) => {
                        const symbols: Record<string, string> = {
                          COP: '$', USD: '$', EUR: '€', MXN: '$', ARS: '$', PEN: 'S/',
                        };
                        setLocalSettings({ 
                          ...localSettings, 
                          currency: value,
                          currencySymbol: symbols[value] || '$',
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COP">Peso Colombiano (COP)</SelectItem>
                        <SelectItem value="USD">Dólar Estadounidense (USD)</SelectItem>
                        <SelectItem value="EUR">Euro (EUR)</SelectItem>
                        <SelectItem value="MXN">Peso Mexicano (MXN)</SelectItem>
                        <SelectItem value="ARS">Peso Argentino (ARS)</SelectItem>
                        <SelectItem value="PEN">Sol Peruano (PEN)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Símbolo</Label>
                    <Input value={localSettings.currencySymbol} disabled />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preferencias de Interfaz</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Tema de la Aplicación</p>
                    <p className="text-sm text-muted-foreground">Elige entre claro, oscuro o automático</p>
                  </div>
                  <Select
                    value={localPreferences.theme}
                    onValueChange={(value: 'light' | 'dark' | 'system') => 
                      setLocalPreferences({ ...localPreferences, theme: value })}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Claro</SelectItem>
                      <SelectItem value="dark">Oscuro</SelectItem>
                      <SelectItem value="system">Automático</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Idioma</p>
                    <p className="text-sm text-muted-foreground">Idioma de la interfaz</p>
                  </div>
                  <Select
                    value={localPreferences.language}
                    onValueChange={(value: 'es' | 'en') => 
                      setLocalPreferences({ ...localPreferences, language: value })}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alertas */}
          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configuración de Alertas</CardTitle>
                <CardDescription>
                  Personaliza qué alertas quieres recibir y cuándo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Alertas de Inventario</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Alerta de Stock Bajo</p>
                      <p className="text-sm text-muted-foreground">Notificar cuando el inventario esté bajo</p>
                    </div>
                    <Switch
                      checked={localSettings.lowStockAlert}
                      onCheckedChange={(checked) => 
                        setLocalSettings({ ...localSettings, lowStockAlert: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Umbral de Stock Bajo</p>
                      <p className="text-sm text-muted-foreground">Porcentaje mínimo antes de alertar</p>
                    </div>
                    <Input
                      type="number"
                      className="w-24"
                      value={localSettings.lowStockThreshold}
                      onChange={(e) => 
                        setLocalSettings({ ...localSettings, lowStockThreshold: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Días antes de vencimiento</p>
                      <p className="text-sm text-muted-foreground">Alertar antes de que caduquen insumos</p>
                    </div>
                    <Input
                      type="number"
                      className="w-24"
                      value={localSettings.expirationAlertDays}
                      onChange={(e) => 
                        setLocalSettings({ ...localSettings, expirationAlertDays: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Alertas de Animales</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Alertas de Reproducción</p>
                      <p className="text-sm text-muted-foreground">Celos, partos próximos, revisiones</p>
                    </div>
                    <Switch
                      checked={localSettings.reproductionAlerts}
                      onCheckedChange={(checked) => 
                        setLocalSettings({ ...localSettings, reproductionAlerts: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Alertas de Salud</p>
                      <p className="text-sm text-muted-foreground">Tratamientos pendientes, seguimientos</p>
                    </div>
                    <Switch
                      checked={localSettings.healthAlerts}
                      onCheckedChange={(checked) => 
                        setLocalSettings({ ...localSettings, healthAlerts: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Alertas de Vacunación</p>
                      <p className="text-sm text-muted-foreground">Vacunas próximas o vencidas</p>
                    </div>
                    <Switch
                      checked={localSettings.vaccinationAlerts}
                      onCheckedChange={(checked) => 
                        setLocalSettings({ ...localSettings, vaccinationAlerts: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Días sin pesaje</p>
                      <p className="text-sm text-muted-foreground">Alertar si no se pesa en X días</p>
                    </div>
                    <Input
                      type="number"
                      className="w-24"
                      value={localSettings.weightAlertDays}
                      onChange={(e) => 
                        setLocalSettings({ ...localSettings, weightAlertDays: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Canales de Notificación</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">Recibir alertas por correo electrónico</p>
                    </div>
                    <Switch
                      checked={localPreferences.notifications.email}
                      onCheckedChange={(checked) => 
                        setLocalPreferences({ 
                          ...localPreferences, 
                          notifications: { ...localPreferences.notifications, email: checked }
                        })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Notificaciones Push</p>
                      <p className="text-sm text-muted-foreground">Alertas en el navegador y app</p>
                    </div>
                    <Switch
                      checked={localPreferences.notifications.push}
                      onCheckedChange={(checked) => 
                        setLocalPreferences({ 
                          ...localPreferences, 
                          notifications: { ...localPreferences.notifications, push: checked }
                        })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">WhatsApp</p>
                      <p className="text-sm text-muted-foreground">Recibir alertas críticas por WhatsApp</p>
                    </div>
                    <Switch
                      checked={localPreferences.notifications.whatsapp}
                      onCheckedChange={(checked) => 
                        setLocalPreferences({ 
                          ...localPreferences, 
                          notifications: { ...localPreferences.notifications, whatsapp: checked }
                        })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Perfil */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información de la Cuenta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{user?.email || 'Usuario'}</p>
                    <Badge>Administrador</Badge>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Correo Electrónico</Label>
                    <Input value={user?.email || ''} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input placeholder="+57 300 123 4567" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backup */}
          <TabsContent value="backup" className="space-y-4">
            {/* Cloud Backup - New Feature */}
            <CloudBackupSettings />

            <Separator className="my-6" />

            {/* Local Backup Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Exportar Datos Localmente
                </CardTitle>
                <CardDescription>
                  Descarga una copia de tus datos en formato JSON
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.lastBackupDate && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Última exportación local</AlertTitle>
                    <AlertDescription>
                      {new Date(settings.lastBackupDate).toLocaleString()}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-4">
                  <Button onClick={handleExport} disabled={exporting} className="flex-1">
                    {exporting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Descargar Backup Local
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Restablecer Configuración</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Restablecer a valores por defecto
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permisos */}
          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gestión de Permisos</CardTitle>
                <CardDescription>
                  Configura los permisos por rol. Ve a Usuarios para asignar roles.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['Administrador', 'Ganadero', 'Técnico', 'Veterinario'].map((rol) => (
                    <div key={rol} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-primary" />
                          <span className="font-medium">{rol}</span>
                        </div>
                        <Badge variant={rol === 'Administrador' ? 'default' : 'secondary'}>
                          {rol === 'Administrador' ? 'Acceso completo' : 'Acceso limitado'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {rol === 'Administrador' && 'Acceso total a todas las funciones del sistema.'}
                        {rol === 'Ganadero' && 'Puede gestionar animales, producción y ver reportes.'}
                        {rol === 'Técnico' && 'Puede registrar eventos, pesajes y alimentación.'}
                        {rol === 'Veterinario' && 'Puede gestionar salud, reproducción y tratamientos.'}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Configuracion;
