import { Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFounder } from '@/contexts/FounderContext';
import { useNavigate } from 'react-router-dom';

export function FounderModeBanner() {
  const { isFounderMode, targetOrganizationName, exitFounderMode } = useFounder();
  const navigate = useNavigate();

  if (!isFounderMode) return null;

  const handleExit = () => {
    exitFounderMode();
    navigate('/founder');
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-amber-500 to-amber-600 text-white py-2 px-4 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5" />
        <span className="font-semibold">Modo Founder Activo</span>
        <span className="text-sm opacity-90">
          — Viendo cuenta: <strong>{targetOrganizationName || 'Desconocida'}</strong>
        </span>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleExit}
        className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
      >
        <X className="h-4 w-4 mr-1" />
        Salir al Panel Founder
      </Button>
    </div>
  );
}
