import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

interface IdentificationEditConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function IdentificationEditConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
}: IdentificationEditConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-full">
              <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <AlertDialogTitle>¿Estás seguro que quieres editar?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            Los datos de identificación son críticos para la trazabilidad del animal. 
            Cambiar esta información puede afectar reportes históricos y registros oficiales.
            <br /><br />
            <strong>Solo procede si estás seguro de que los datos actuales son incorrectos.</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-amber-600 hover:bg-amber-700">
            Sí, quiero editar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
