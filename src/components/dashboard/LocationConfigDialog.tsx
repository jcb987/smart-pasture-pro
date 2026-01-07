import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, Loader2 } from 'lucide-react';
import { useOrganizationSettings, type OrganizationLocation } from '@/hooks/useOrganizationSettings';

interface LocationConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Latin American countries commonly used
const COUNTRIES = [
  { code: 'CO', name: 'Colombia' },
  { code: 'MX', name: 'México' },
  { code: 'AR', name: 'Argentina' },
  { code: 'BR', name: 'Brasil' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'PE', name: 'Perú' },
  { code: 'CL', name: 'Chile' },
  { code: 'BO', name: 'Bolivia' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'PA', name: 'Panamá' },
  { code: 'GT', name: 'Guatemala' },
  { code: 'HN', name: 'Honduras' },
  { code: 'NI', name: 'Nicaragua' },
  { code: 'SV', name: 'El Salvador' },
  { code: 'DO', name: 'República Dominicana' },
  { code: 'CU', name: 'Cuba' },
  { code: 'PR', name: 'Puerto Rico' },
];

// Example regions for Colombia (expandable)
const REGIONS: Record<string, string[]> = {
  'CO': ['Antioquia', 'Cundinamarca', 'Valle del Cauca', 'Santander', 'Atlántico', 'Bolívar', 'Boyacá', 'Caldas', 'Cauca', 'Cesar', 'Córdoba', 'Huila', 'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Quindío', 'Risaralda', 'Sucre', 'Tolima'],
  'MX': ['Jalisco', 'Veracruz', 'Chiapas', 'Oaxaca', 'Chihuahua', 'Sonora', 'Durango', 'Coahuila', 'Tamaulipas', 'Nuevo León'],
  'AR': ['Buenos Aires', 'Córdoba', 'Santa Fe', 'Mendoza', 'Entre Ríos', 'Salta', 'Tucumán', 'Chaco', 'Misiones', 'La Pampa'],
  'BR': ['São Paulo', 'Minas Gerais', 'Rio de Janeiro', 'Bahia', 'Rio Grande do Sul', 'Paraná', 'Goiás', 'Mato Grosso', 'Mato Grosso do Sul', 'Santa Catarina'],
};

export const LocationConfigDialog = ({ open, onOpenChange }: LocationConfigDialogProps) => {
  const { location, saveLocation, loading: settingsLoading } = useOrganizationSettings();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    country: '',
    region: '',
    municipality: '',
    latitude: '',
    longitude: '',
    location_name: '',
  });

  useEffect(() => {
    if (location) {
      setFormData({
        country: location.country || '',
        region: location.region || '',
        municipality: location.municipality || '',
        latitude: location.latitude?.toString() || '',
        longitude: location.longitude?.toString() || '',
        location_name: location.location_name || '',
      });
    }
  }, [location]);

  const handleSave = async () => {
    setSaving(true);
    const success = await saveLocation({
      country: formData.country || null,
      region: formData.region || null,
      municipality: formData.municipality || null,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      location_name: formData.location_name || null,
    });
    setSaving(false);
    if (success) {
      onOpenChange(false);
    }
  };

  const getAvailableRegions = () => {
    return REGIONS[formData.country] || [];
  };

  const handleGetCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6),
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Configurar Ubicación
          </DialogTitle>
          <DialogDescription>
            Ingresa la ubicación de tu finca para obtener información climática precisa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre de la Ubicación</Label>
            <Input
              placeholder="Ej: Finca La Esperanza"
              value={formData.location_name}
              onChange={(e) => setFormData(prev => ({ ...prev, location_name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>País</Label>
            <Select
              value={formData.country}
              onValueChange={(value) => setFormData(prev => ({ ...prev, country: value, region: '' }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un país" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Región / Departamento</Label>
            {getAvailableRegions().length > 0 ? (
              <Select
                value={formData.region}
                onValueChange={(value) => setFormData(prev => ({ ...prev, region: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una región" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableRegions().map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder="Ingresa la región"
                value={formData.region}
                onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>Municipio</Label>
            <Input
              placeholder="Ingresa el municipio"
              value={formData.municipality}
              onChange={(e) => setFormData(prev => ({ ...prev, municipality: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Coordenadas (opcional)</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleGetCurrentLocation}
              >
                <MapPin className="h-4 w-4 mr-1" />
                Usar ubicación actual
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Input
                  placeholder="Latitud"
                  type="number"
                  step="0.000001"
                  value={formData.latitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                />
              </div>
              <div>
                <Input
                  placeholder="Longitud"
                  type="number"
                  step="0.000001"
                  value={formData.longitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !formData.country}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar Ubicación'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
