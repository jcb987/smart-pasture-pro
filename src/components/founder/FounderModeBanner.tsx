import { Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFounder } from '@/contexts/FounderContext';

export function FounderModeBanner() {
  const { isFounderMode, targetOrganizationName, exitFounderMode } = useFounder();

  if (!isFounderMode) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-amber-950 py-2 px-4 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5" />
        <span className="font-semibold">Modo Founder Activo</span>
        <span className="text-sm opacity-80">
          — Viendo cuenta: {targetOrganizationName || 'Desconocida'}
        </span>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={exitFounderMode}
        className="bg-amber-600 border-amber-700 text-white hover:bg-amber-700"
      >
        <X className="h-4 w-4 mr-1" />
        Salir del Modo Founder
      </Button>
    </div>
  );
}
