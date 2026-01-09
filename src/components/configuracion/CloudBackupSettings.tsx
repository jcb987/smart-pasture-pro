import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Cloud, 
  Download, 
  Upload, 
  Trash2, 
  Clock, 
  HardDrive,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useCloudBackup } from '@/hooks/useCloudBackup';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const CloudBackupSettings = () => {
  const {
    isBackingUp,
    isRestoring,
    backupInfo,
    availableBackups,
    createBackup,
    restoreBackup,
    deleteBackup,
    toggleAutoBackup,
    setBackupInterval,
    loadAvailableBackups,
  } = useCloudBackup();

  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);

  const handleRestore = async (backupName: string) => {
    await restoreBackup(backupName);
    setSelectedBackup(null);
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-primary" />
            Respaldo en la Nube
          </CardTitle>
          <CardDescription>
            Mantén tus datos seguros con respaldos automáticos en la nube
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Last Backup Status */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              {backupInfo.lastBackup ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              <div>
                <p className="font-medium">Último respaldo</p>
                <p className="text-sm text-muted-foreground">
                  {backupInfo.lastBackup
                    ? formatDistanceToNow(new Date(backupInfo.lastBackup), {
                        addSuffix: true,
                        locale: es,
                      })
                    : 'Nunca'}
                </p>
              </div>
            </div>
            <Button 
              onClick={createBackup} 
              disabled={isBackingUp}
              className="gap-2"
            >
              {isBackingUp ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isBackingUp ? 'Respaldando...' : 'Respaldar ahora'}
            </Button>
          </div>

          <Separator />

          {/* Auto Backup Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-backup" className="font-medium">
                  Respaldo automático
                </Label>
                <p className="text-sm text-muted-foreground">
                  Respaldar datos automáticamente según el intervalo configurado
                </p>
              </div>
              <Switch
                id="auto-backup"
                checked={backupInfo.isAutoBackupEnabled}
                onCheckedChange={toggleAutoBackup}
              />
            </div>

            {backupInfo.isAutoBackupEnabled && (
              <div className="flex items-center gap-4 pl-4 border-l-2 border-primary/20">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="interval" className="text-sm">
                  Frecuencia:
                </Label>
                <Select
                  value={backupInfo.backupInterval.toString()}
                  onValueChange={(value) => setBackupInterval(parseInt(value))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Cada hora</SelectItem>
                    <SelectItem value="6">Cada 6 horas</SelectItem>
                    <SelectItem value="12">Cada 12 horas</SelectItem>
                    <SelectItem value="24">Cada día</SelectItem>
                    <SelectItem value="168">Cada semana</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available Backups */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Respaldos disponibles
              </CardTitle>
              <CardDescription>
                {availableBackups.length} respaldo{availableBackups.length !== 1 ? 's' : ''} en la nube
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadAvailableBackups}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {availableBackups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Cloud className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay respaldos disponibles</p>
              <p className="text-sm">Crea tu primer respaldo para proteger tus datos</p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableBackups.map((backup) => (
                <div
                  key={backup.name}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Cloud className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {backup.created_at
                          ? format(new Date(backup.created_at), "d 'de' MMMM, yyyy - HH:mm", { locale: es })
                          : backup.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {formatBytes(backup.size)}
                        </Badge>
                        {backup.created_at && (
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(backup.created_at), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={isRestoring}
                          className="gap-1"
                        >
                          <Download className="h-4 w-4" />
                          Restaurar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Restaurar este respaldo?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esto reemplazará todos los datos locales actuales con los del respaldo.
                            Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRestore(backup.name)}>
                            Restaurar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar este respaldo?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción eliminará permanentemente el respaldo de la nube.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteBackup(backup.name)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
