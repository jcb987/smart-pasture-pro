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
              <Button size="sm" onClick={() => setShowLocationDialog(true)}>
                <MapPin className="h-4 w-4 mr-2" />
                Configurar Ubicación
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-orange-500" />
              {location?.location_name || 'Clima'}
            </CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowLocationDialog(true)}>
                <Settings className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={refresh}>
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
      <CardContent className="space-y-3">
        {/* Current weather */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <WeatherIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{weather.temperature}°C</div>
              <div className="text-sm text-muted-foreground">{getConditionText(weather.condition)}</div>
            </div>
          </div>
          <div className="text-right text-sm text-muted-foreground space-y-1">
            <div className="flex items-center gap-1 justify-end">
              <Droplets className="h-3 w-3" />
              {weather.humidity}%
            </div>
            <div className="flex items-center gap-1 justify-end">
              <Wind className="h-3 w-3" />
              {weather.windSpeed} km/h
            </div>
          </div>
        </div>

        {/* Alert */}
        {weather.alert && (
          <div className={cn(
            "p-2 rounded-lg flex items-start gap-2 text-xs",
            weather.alert.severity === 'high' ? 'bg-destructive/10 text-destructive' :
            weather.alert.severity === 'medium' ? 'bg-amber-500/10 text-amber-700' :
            'bg-blue-500/10 text-blue-700'
          )}>
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{weather.alert.message}</span>
          </div>
        )}

        {/* Forecast */}
        <div className="flex gap-2 overflow-x-auto pt-2 border-t">
          {weather.forecast.map((day) => (
            <div key={day.day} className="flex-shrink-0 text-center p-2 rounded-lg bg-muted/50 min-w-[50px]">
              <div className="text-xs font-medium">{day.day}</div>
              <div className="text-xs text-muted-foreground">
                {day.tempMax}° / {day.tempMin}°
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
    <LocationConfigDialog 
      open={showLocationDialog} 
      onOpenChange={setShowLocationDialog} 
    />
  </>
  );
};
