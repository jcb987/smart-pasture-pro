import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter 
} from '@/components/ui/dialog';
import { QrCode, Scan, Camera, Search, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ScanResult {
  type: 'rfid' | 'barcode' | 'manual';
  code: string;
  timestamp: Date;
}

interface AnimalScannerProps {
  onAnimalFound?: (tagId: string) => void;
  className?: string;
}

export const AnimalScanner = ({ onAnimalFound, className }: AnimalScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);

  // Simulated RFID/Barcode scanning
  const startScan = useCallback(async () => {
    setIsScanning(true);
    setScanDialogOpen(true);

    // Simulate scan delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulated scan result
    const mockCodes = ['VAC-0234', 'VAC-0189', 'VAC-0156', 'TOR-0012', 'NOV-0089'];
    const scannedCode = mockCodes[Math.floor(Math.random() * mockCodes.length)];

    setLastScan({
      type: 'rfid',
      code: scannedCode,
      timestamp: new Date(),
    });

    setIsScanning(false);
    toast.success(`Animal identificado: ${scannedCode}`);
    onAnimalFound?.(scannedCode);
  }, [onAnimalFound]);

  const handleManualSearch = useCallback(() => {
    if (!manualInput.trim()) return;

    setLastScan({
      type: 'manual',
      code: manualInput.trim().toUpperCase(),
      timestamp: new Date(),
    });

    toast.success(`Buscando: ${manualInput.trim().toUpperCase()}`);
    onAnimalFound?.(manualInput.trim().toUpperCase());
    setManualInput('');
    setScanDialogOpen(false);
  }, [manualInput, onAnimalFound]);

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Scan className="h-4 w-4 text-primary" />
            Identificación Rápida
          </CardTitle>
          <CardDescription className="text-xs">
            Escanea RFID o ingresa el código manualmente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button 
              onClick={() => setScanDialogOpen(true)} 
              className="flex-1"
              variant="outline"
            >
              <QrCode className="mr-2 h-4 w-4" />
              Escanear
            </Button>
            <Button 
              onClick={startScan}
              className="flex-1"
            >
              <Camera className="mr-2 h-4 w-4" />
              RFID
            </Button>
          </div>

          {lastScan && (
            <div className="p-2 bg-muted rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">{lastScan.code}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {lastScan.timestamp.toLocaleTimeString()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={scanDialogOpen} onOpenChange={setScanDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5 text-primary" />
              Identificar Animal
            </DialogTitle>
            <DialogDescription>
              Escanea el código RFID o ingresa el número de arete manualmente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Scan area */}
            <div className="relative aspect-video bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
              {isScanning ? (
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-3 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-muted-foreground">Escaneando...</p>
                  <p className="text-xs text-muted-foreground">Acerca el lector RFID al arete</p>
                </div>
              ) : (
                <div className="text-center">
                  <QrCode className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">Área de escaneo</p>
                </div>
              )}
            </div>

            {/* Manual input */}
            <div className="space-y-2">
              <Label htmlFor="manual-code">O ingresa manualmente:</Label>
              <div className="flex gap-2">
                <Input
                  id="manual-code"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Ej: VAC-0234"
                  className="flex-1"
                />
                <Button onClick={handleManualSearch} disabled={!manualInput.trim()}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Instructions */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-xs space-y-1">
              <div className="flex items-center gap-2 font-medium text-blue-700 dark:text-blue-300">
                <AlertCircle className="h-3 w-3" />
                Instrucciones
              </div>
              <ul className="text-blue-600 dark:text-blue-400 space-y-1 pl-5 list-disc">
                <li>Para escaneo RFID, conecta el lector USB o Bluetooth</li>
                <li>Acerca el lector al arete del animal</li>
                <li>El código se detectará automáticamente</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setScanDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={startScan} disabled={isScanning}>
              {isScanning ? 'Escaneando...' : 'Iniciar Escaneo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
