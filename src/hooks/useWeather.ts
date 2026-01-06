import { useState, useEffect, useCallback } from 'react';

export interface WeatherData {
  temperature: number;
  humidity: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'cold';
  windSpeed: number;
  alert?: {
    type: 'heat' | 'cold' | 'storm' | 'drought';
    message: string;
    severity: 'low' | 'medium' | 'high';
  };
  forecast: {
    day: string;
    tempMax: number;
    tempMin: number;
    condition: string;
  }[];
}

// Simulated weather API - in production would connect to real weather service
export const useWeather = (location?: { lat: number; lng: number }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate realistic weather data
      const temp = Math.round(18 + Math.random() * 15);
      const humidity = Math.round(40 + Math.random() * 40);
      
      const conditions: WeatherData['condition'][] = ['sunny', 'cloudy', 'rainy', 'stormy', 'cold'];
      const condition = conditions[Math.floor(Math.random() * conditions.length)];
      
      let alert: WeatherData['alert'] | undefined;
      
      if (temp > 32) {
        alert = {
          type: 'heat',
          message: 'Alerta de calor extremo. Asegure agua suficiente para el ganado.',
          severity: 'high',
        };
      } else if (temp < 5) {
        alert = {
          type: 'cold',
          message: 'Temperaturas bajas. Proteja a los animales jóvenes.',
          severity: 'medium',
        };
      } else if (condition === 'stormy') {
        alert = {
          type: 'storm',
          message: 'Tormenta pronosticada. Resguarde el ganado.',
          severity: 'high',
        };
      }

      const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
      const today = new Date().getDay();
      
      const forecast = Array.from({ length: 5 }, (_, i) => ({
        day: days[(today + i) % 7],
        tempMax: temp + Math.round(Math.random() * 5 - 2),
        tempMin: temp - 5 + Math.round(Math.random() * 3),
        condition: conditions[Math.floor(Math.random() * 3)],
      }));

      setWeather({
        temperature: temp,
        humidity,
        condition,
        windSpeed: Math.round(5 + Math.random() * 20),
        alert,
        forecast,
      });
      setError(null);
    } catch (err) {
      setError('Error al cargar datos del clima');
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => {
    fetchWeather();
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  return { weather, loading, error, refresh: fetchWeather };
};
