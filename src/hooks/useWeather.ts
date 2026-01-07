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

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
  };
}

// Map WMO weather codes to our condition types
const mapWeatherCode = (code: number): WeatherData['condition'] => {
  if (code === 0 || code === 1) return 'sunny';
  if (code >= 2 && code <= 3) return 'cloudy';
  if (code >= 51 && code <= 67) return 'rainy';
  if (code >= 80 && code <= 82) return 'rainy';
  if (code >= 95 && code <= 99) return 'stormy';
  if (code >= 71 && code <= 77) return 'cold';
  if (code >= 85 && code <= 86) return 'cold';
  return 'cloudy';
};

const getDayName = (dateStr: string): string => {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const date = new Date(dateStr);
  return days[date.getDay()];
};

export const useWeather = (location?: { lat: number; lng: number }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    if (!location) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Use Open-Meteo API (free, no API key required)
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=5`
      );

      if (!response.ok) {
        throw new Error('Error al obtener datos del clima');
      }

      const data: OpenMeteoResponse = await response.json();
      
      const temp = Math.round(data.current.temperature_2m);
      const humidity = Math.round(data.current.relative_humidity_2m);
      const windSpeed = Math.round(data.current.wind_speed_10m);
      const condition = mapWeatherCode(data.current.weather_code);
      
      // Generate alerts based on real conditions
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
      } else if (humidity < 30 && temp > 28) {
        alert = {
          type: 'drought',
          message: 'Condiciones secas. Revise el suministro de agua.',
          severity: 'medium',
        };
      }

      const forecast = data.daily.time.map((date, i) => ({
        day: getDayName(date),
        tempMax: Math.round(data.daily.temperature_2m_max[i]),
        tempMin: Math.round(data.daily.temperature_2m_min[i]),
        condition: mapWeatherCode(data.daily.weather_code[i]),
      }));

      setWeather({
        temperature: temp,
        humidity,
        condition,
        windSpeed,
        alert,
        forecast,
      });
      setError(null);
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError('Error al cargar datos del clima');
    } finally {
      setLoading(false);
    }
  }, [location?.lat, location?.lng]);

  useEffect(() => {
    fetchWeather();
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  return { weather, loading, error, refresh: fetchWeather };
};