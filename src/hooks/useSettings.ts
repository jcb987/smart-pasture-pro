import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SystemSettings {
  // Unidades y formatos
  weightUnit: 'kg' | 'lb';
  volumeUnit: 'lt' | 'gal';
  areaUnit: 'ha' | 'acres';
  currency: string;
  currencySymbol: string;
  dateFormat: 'dd/mm/yyyy' | 'mm/dd/yyyy' | 'yyyy-mm-dd';
  // Alertas
  lowStockAlert: boolean;
  lowStockThreshold: number;
  expirationAlertDays: number;
  weightAlertDays: number;
  reproductionAlerts: boolean;
  healthAlerts: boolean;
  vaccinationAlerts: boolean;
  // Backup
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  lastBackupDate?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'es' | 'en';
  notifications: {
    email: boolean;
    push: boolean;
    whatsapp: boolean;
  };
  dashboardLayout: 'default' | 'compact';
}

const DEFAULT_SETTINGS: SystemSettings = {
  weightUnit: 'kg',
  volumeUnit: 'lt',
  areaUnit: 'ha',
  currency: 'COP',
  currencySymbol: '$',
  dateFormat: 'dd/mm/yyyy',
  lowStockAlert: true,
  lowStockThreshold: 10,
  expirationAlertDays: 30,
  weightAlertDays: 30,
  reproductionAlerts: true,
  healthAlerts: true,
  vaccinationAlerts: true,
  autoBackup: true,
  backupFrequency: 'daily',
};

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  language: 'es',
  notifications: {
    email: true,
    push: true,
    whatsapp: false,
  },
  dashboardLayout: 'default',
};

export const useSettings = () => {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Apply theme to document
  const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    const root = document.documentElement;
    
    if (theme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', systemPrefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  };

  // Apply language (for future i18n integration)
  const applyLanguage = (language: 'es' | 'en') => {
    document.documentElement.lang = language;
    // Store for potential i18n library integration
    localStorage.setItem('app_language', language);
  };

  // Cargar configuración del localStorage
  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem('system_settings');
      const savedPreferences = localStorage.getItem('user_preferences');

      if (savedSettings) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
      }
      if (savedPreferences) {
        const prefs = { ...DEFAULT_PREFERENCES, ...JSON.parse(savedPreferences) };
        setPreferences(prefs);
        // Apply theme and language on load
        applyTheme(prefs.theme);
        applyLanguage(prefs.language);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    setLoading(false);
  };

  // Guardar configuración
  const saveSettings = (newSettings: Partial<SystemSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('system_settings', JSON.stringify(updated));
    toast({
      title: 'Configuración guardada',
      description: 'Los cambios se han aplicado correctamente',
    });
  };

  // Guardar preferencias
  const savePreferences = (newPreferences: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);
    localStorage.setItem('user_preferences', JSON.stringify(updated));
    
    // Apply theme and language immediately
    if (newPreferences.theme) {
      applyTheme(newPreferences.theme);
    }
    if (newPreferences.language) {
      applyLanguage(newPreferences.language);
    }
    
    toast({
      title: 'Preferencias actualizadas',
      description: 'Tus preferencias se han guardado',
    });
  };

  // Exportar datos (backup)
  const exportData = async () => {
    try {
      // Export data from key tables
      const { data: animalsData } = await supabase.from('animals').select('*');
      const { data: eventsData } = await supabase.from('animal_events').select('*');
      const { data: weightsData } = await supabase.from('weight_records').select('*');
      const { data: healthData } = await supabase.from('health_events').select('*');
      const { data: reproData } = await supabase.from('reproductive_events').select('*');
      const { data: milkData } = await supabase.from('milk_production').select('*');
      const { data: suppliesData } = await supabase.from('supplies').select('*');
      const { data: movementsData } = await supabase.from('supply_movements').select('*');
      const { data: feedData } = await supabase.from('feed_inventory').select('*');
      const { data: paddocksData } = await supabase.from('paddocks').select('*');
      const { data: transactionsData } = await supabase.from('financial_transactions').select('*');

      const backup = {
        animals: animalsData || [],
        animal_events: eventsData || [],
        weight_records: weightsData || [],
        health_events: healthData || [],
        reproductive_events: reproData || [],
        milk_production: milkData || [],
        supplies: suppliesData || [],
        supply_movements: movementsData || [],
        feed_inventory: feedData || [],
        paddocks: paddocksData || [],
        financial_transactions: transactionsData || [],
      };

      const backupData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        settings,
        data: backup,
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_ganadero_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      // Actualizar fecha de último backup
      saveSettings({ lastBackupDate: new Date().toISOString() });

      toast({
        title: 'Backup completado',
        description: 'Se ha descargado el archivo de respaldo',
      });

      return true;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear el backup',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Resetear configuración
  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem('system_settings', JSON.stringify(DEFAULT_SETTINGS));
    toast({
      title: 'Configuración restablecida',
      description: 'Se han restaurado los valores por defecto',
    });
  };

  // Formatear valores según configuración
  const formatWeight = (value: number) => {
    if (settings.weightUnit === 'lb') {
      return `${(value * 2.20462).toFixed(1)} lb`;
    }
    return `${value.toFixed(1)} kg`;
  };

  const formatArea = (value: number) => {
    if (settings.areaUnit === 'acres') {
      return `${(value * 2.47105).toFixed(2)} acres`;
    }
    return `${value.toFixed(2)} ha`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: settings.currency,
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    switch (settings.dateFormat) {
      case 'mm/dd/yyyy':
        return date.toLocaleDateString('en-US');
      case 'yyyy-mm-dd':
        return date.toISOString().split('T')[0];
      default:
        return date.toLocaleDateString('es-ES');
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return {
    settings,
    preferences,
    loading,
    saveSettings,
    savePreferences,
    exportData,
    resetSettings,
    formatWeight,
    formatArea,
    formatCurrency,
    formatDate,
  };
};
