import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWeather, type WeatherData } from '@/hooks/useWeather';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { LocationConfigDialog } from './LocationConfigDialog';
import { 
  Sun, Cloud, CloudRain, CloudLightning, Snowflake, 
  Thermometer, Droplets, Wind, AlertTriangle, RefreshCw,
  MapPin, Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

const getWeatherIcon = (condition: WeatherData['condition']) => {
  switch (condition) {
    case 'sunny': return Sun;
    case 'cloudy': return Cloud;
    case 'rainy': return CloudRain;
    case 'stormy': return CloudLightning;
    case 'cold': return Snowflake;
    default: return Sun;
  }
};

const getConditionText = (condition: WeatherData['condition']) => {
  switch (condition) {
    case 'sunny': return 'Soleado';
    case 'cloudy': return 'Nublado';
    case 'rainy': return 'Lluvioso';
    case 'stormy': return 'Tormentoso';
    case 'cold': return 'Frío';
    default: return condition;
  }
};

export const WeatherWidget = ({ className }: { className?: string }) => {
  const { location, hasLocation } = useOrganizationSettings();
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const { weather, loading, error, refresh } = useWeather(
    hasLocation && location?.latitude && location?.longitude
      ? { lat: location.latitude, lng: location.longitude }
      : undefined
  );

  if (loading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader className="pb-2">
          <div className="h-4 bg-muted rounded w-24" />
        </CardHeader>
        <CardContent>
          <div className="h-12 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  // Show location setup if not configured
  if (!hasLocation) {
    return (
      <>
        <Card className={cn("overflow-hidden", className)}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-orange-500" />
              Clima
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center py-4">
              <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                Configura tu ubicación para ver el clima
              </p>
              <Button 
                size="sm" 
                onClick={() => setShowLocationDialog(true)}
                className="w-full max-w-[200px]"
              >
                <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">Configurar Ubicación</span>
              </Button>
            </div>
          </CardContent>
        </Card>
        <LocationConfigDialog 
          open={showLocationDialog} 
          onOpenChange={setShowLocationDialog} 
        />
      </>
    );
  }

  if (error || !weather) {
    return (
      <Card className={className}>
        <CardContent className="pt-6 text-center text-muted-foreground text-sm">
          {error || 'Sin datos del clima'}
        </CardContent>
      </Card>
    );
  }

  const WeatherIcon = getWeatherIcon(weather.condition);

  return (
    <>
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 min-w-0">
              <Thermometer className="h-4 w-4 text-orange-500 flex-shrink-0" />
              <span className="truncate">{location?.location_name || 'Clima'}</span>
            </CardTitle>
            <div className="flex gap-1 flex-shrink-0">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowLocationDialog(true)}>
                <Settings className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={refresh}>
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Current weather - temperature only */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <WeatherIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-xl sm:text-2xl font-bold">{weather.temperature}°C</div>
              <div className="text-xs sm:text-sm text-muted-foreground truncate">{getConditionText(weather.condition)}</div>
            </div>
          </div>

          {/* Alert */}
          {weather.alert && (
            <div className={cn(
              "p-2 rounded-lg flex items-start gap-2 text-xs mt-3",
              weather.alert.severity === 'high' ? 'bg-destructive/10 text-destructive' :
              weather.alert.severity === 'medium' ? 'bg-amber-500/10 text-amber-700' :
              'bg-blue-500/10 text-blue-700'
            )}>
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span className="line-clamp-2">{weather.alert.message}</span>
            </div>
          )}
        </CardContent>
      </Card>
      <LocationConfigDialog 
        open={showLocationDialog} 
        onOpenChange={setShowLocationDialog} 
      />
    </>
  );
};
