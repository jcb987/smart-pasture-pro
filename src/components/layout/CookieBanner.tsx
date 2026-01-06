import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Cookie, X, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const CookieBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Small delay for better UX
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      essential: true,
      functional: true,
      analytics: true,
      timestamp: new Date().toISOString()
    }));
    setShowBanner(false);
  };

  const acceptEssential = () => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      essential: true,
      functional: false,
      analytics: false,
      timestamp: new Date().toISOString()
    }));
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <Card className="max-w-4xl mx-auto shadow-2xl border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Cookie className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h3 className="font-semibold text-foreground">Uso de Cookies</h3>
                <button 
                  onClick={acceptEssential}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Usamos cookies para mejorar tu experiencia. Las esenciales son necesarias para el funcionamiento. 
                Las demás nos ayudan a entender cómo usas el sistema.{' '}
                <Link to="/cookies" className="text-primary hover:underline">
                  Más información
                </Link>
              </p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={acceptAll} size="sm">
                  Aceptar todas
                </Button>
                <Button onClick={acceptEssential} variant="outline" size="sm">
                  Solo esenciales
                </Button>
                <Button 
                  onClick={() => setShowSettings(!showSettings)} 
                  variant="ghost" 
                  size="sm"
                  className="text-muted-foreground"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar
                </Button>
              </div>

              {showSettings && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Cookies Esenciales</p>
                      <p className="text-xs text-muted-foreground">Necesarias para el funcionamiento</p>
                    </div>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Siempre activas</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Cookies Funcionales</p>
                      <p className="text-xs text-muted-foreground">Mejoran tu experiencia</p>
                    </div>
                    <span className="text-xs text-muted-foreground">Opcionales</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Cookies Analíticas</p>
                      <p className="text-xs text-muted-foreground">Estadísticas de uso anónimas</p>
                    </div>
                    <span className="text-xs text-muted-foreground">Opcionales</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CookieBanner;
