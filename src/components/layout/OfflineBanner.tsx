import { useOffline } from '@/contexts/OfflineContext';
import { WifiOff, Cloud, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export const OfflineBanner = () => {
  const { isOnline, isSyncing, pendingChanges } = useOffline();
  const [dismissed, setDismissed] = useState(false);

  // Only show when offline
  if (isOnline || dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-3 shadow-lg animate-in slide-in-from-bottom-5 duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {isSyncing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <WifiOff className="h-5 w-5" />
          )}
          <div>
            <p className="font-medium">Trabajando sin conexión</p>
            <p className="text-sm text-amber-100">
              {pendingChanges > 0 
                ? `${pendingChanges} cambios pendientes de sincronizar`
                : 'Los cambios se guardarán localmente'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {pendingChanges > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-600 rounded-full text-sm">
              <Cloud className="h-4 w-4" />
              <span>{pendingChanges} pendientes</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-amber-600"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
