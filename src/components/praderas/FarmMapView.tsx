import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Pencil, Trash2, Save, Search, Layers,
  Plus, Wand2, Eye, X, Info, MousePointer, CheckCircle
} from 'lucide-react';
import { useFarmMap, calculatePolygonAreaHectares, getPolygonCenter, type MapLot } from '@/hooks/useFarmMap';
import { Skeleton } from '@/components/ui/skeleton';

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const USAGE_OPTIONS = [
  { value: 'pastoreo', label: 'Pastoreo' },
  { value: 'descanso', label: 'Descanso' },
  { value: 'reserva', label: 'Reserva' },
  { value: 'mixto', label: 'Mixto' },
];

const STATUS_LABELS: Record<string, string> = {
  disponible: 'Disponible',
  ocupado: 'Ocupado',
  en_descanso: 'En Descanso',
  en_recuperacion: 'Recuperación',
};

// Small vertex icon
const vertexIcon = new L.DivIcon({
  className: '',
  html: '<div style="width:12px;height:12px;background:white;border:2px solid #3B82F6;border-radius:50%;"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

// Search component
const MapSearch = ({ onSearch }: { onSearch: (query: string) => void }) => {
  const [query, setQuery] = useState('');
  return (
    <div className="absolute top-3 left-3 z-[1000] flex gap-2 max-w-xs w-full">
      <Input
        placeholder="Buscar lugar..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && query.trim() && onSearch(query.trim())}
        className="bg-background/95 backdrop-blur-sm shadow-lg text-sm h-9"
      />
      <Button size="sm" onClick={() => query.trim() && onSearch(query.trim())} className="h-9 w-9 p-0 shrink-0">
        <Search className="h-4 w-4" />
      </Button>
    </div>
  );
};

// Fly to location
const FlyTo = ({ location }: { location: { lat: number; lng: number } | null }) => {
  const map = useMap();
  useEffect(() => {
    if (location) map.flyTo([location.lat, location.lng], 15, { duration: 1.5 });
  }, [location, map]);
  return null;
};

// Click handler for drawing
const ClickHandler = ({
  active,
  onPoint,
}: {
  active: boolean;
  onPoint: (latlng: L.LatLng) => void;
}) => {
  useMapEvents({
    click(e) {
      if (active) onPoint(e.latlng);
    },
  });
  return null;
};

// Lot popup
const LotPopupContent = ({ lot, onDelete }: { lot: MapLot; onDelete: () => void }) => (
  <div className="min-w-[200px] space-y-2 p-1">
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: lot.lot_color }} />
      <span className="font-bold text-sm">{lot.name}</span>
    </div>
    <div className="grid grid-cols-2 gap-1 text-xs">
      <span className="text-muted-foreground">Área:</span>
      <span className="font-medium">{lot.area_hectares?.toFixed(2)} ha</span>
      <span className="text-muted-foreground">Uso:</span>
      <span className="font-medium capitalize">{lot.lot_usage}</span>
      <span className="text-muted-foreground">Estado:</span>
      <span className="font-medium">{STATUS_LABELS[lot.current_status] || lot.current_status}</span>
      <span className="text-muted-foreground">Animales:</span>
      <span className="font-medium">{lot.current_animals}{lot.max_capacity ? ` / ${lot.max_capacity}` : ''}</span>
      {lot.grass_type && (
        <>
          <span className="text-muted-foreground">Pasto:</span>
          <span className="font-medium">{lot.grass_type}</span>
        </>
      )}
    </div>
    <button
      onClick={onDelete}
      className="text-xs text-destructive hover:underline flex items-center gap-1 mt-1"
    >
      <Trash2 className="h-3 w-3" /> Eliminar polígono
    </button>
  </div>
);

// Main component
const FarmMapView = () => {
  const {
    farmBoundary,
    lots,
    loading,
    saveFarmBoundary,
    saveLot,
    deleteLotPolygon,
    LOT_COLORS,
  } = useFarmMap();

  const [drawMode, setDrawMode] = useState<'farm' | 'lot' | null>(null);
  const [drawingPoints, setDrawingPoints] = useState<L.LatLng[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [searchLocation, setSearchLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [satelliteView, setSatelliteView] = useState(true);
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formUsage, setFormUsage] = useState('pastoreo');
  const [formCapacity, setFormCapacity] = useState('');
  const [formGrassType, setFormGrassType] = useState('');
  const [formColor, setFormColor] = useState('#22C55E');

  const defaultCenter: [number, number] = farmBoundary
    ? [Number(farmBoundary.center_lat) || 4.6, Number(farmBoundary.center_lng) || -74.08]
    : [4.6, -74.08];

  const defaultZoom = farmBoundary ? 15 : 6;

  const handleSearch = async (query: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      );
      const results = await response.json();
      if (results.length > 0) {
        setSearchLocation({ lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) });
      }
    } catch { /* silent */ }
  };

  const handleAddPoint = (latlng: L.LatLng) => {
    setDrawingPoints((prev) => [...prev, latlng]);
  };

  const handleFinishDrawing = () => {
    if (drawingPoints.length < 3) return;
    if (drawMode === 'farm') {
      setFormName(farmBoundary?.name || 'Mi Finca');
    } else {
      setFormName(`Lote ${lots.length + 1}`);
      setFormColor(LOT_COLORS[lots.length % LOT_COLORS.length]);
    }
    setShowSaveDialog(true);
  };

  const handleUndoPoint = () => {
    setDrawingPoints((prev) => prev.slice(0, -1));
  };

  const handleCancelDrawing = () => {
    setDrawMode(null);
    setDrawingPoints([]);
  };

  const handleSave = async () => {
    if (drawingPoints.length < 3) return;

    const coords = drawingPoints.map((ll) => ({ lat: ll.lat, lng: ll.lng }));
    const area = calculatePolygonAreaHectares(coords);
    const center = getPolygonCenter(coords);
    const polygon = { type: 'Polygon', coordinates: [coords.map((c) => [c.lng, c.lat])] };

    if (drawMode === 'farm') {
      await saveFarmBoundary({
        name: formName,
        boundary_polygon: polygon,
        area_hectares: Math.round(area * 100) / 100,
        center_lat: center.lat,
        center_lng: center.lng,
      });
    } else {
      await saveLot({
        name: formName,
        boundary_polygon: polygon,
        area_hectares: Math.round(area * 100) / 100,
        center_lat: center.lat,
        center_lng: center.lng,
        lot_color: formColor,
        lot_usage: formUsage,
        max_capacity: formCapacity ? parseInt(formCapacity) : undefined,
        grass_type: formGrassType || undefined,
      });
    }

    setDrawingPoints([]);
    setShowSaveDialog(false);
    setDrawMode(null);
    setFormName('');
    setFormCapacity('');
    setFormGrassType('');
  };

  const pendingArea = useMemo(
    () =>
      drawingPoints.length >= 3
        ? calculatePolygonAreaHectares(drawingPoints.map((ll) => ({ lat: ll.lat, lng: ll.lng })))
        : 0,
    [drawingPoints]
  );

  const farmPositions = farmBoundary?.boundary_polygon?.coordinates?.[0]?.map(
    (c: number[]) => [c[1], c[0]] as [number, number]
  ) || [];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-[500px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        {!drawMode ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setDrawMode('farm'); setDrawingPoints([]); }}
            >
              <Pencil className="h-4 w-4 mr-1" />
              {farmBoundary ? 'Redibujar Finca' : 'Dibujar Finca'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setDrawMode('lot'); setDrawingPoints([]); }}
              disabled={!farmBoundary}
            >
              <Plus className="h-4 w-4 mr-1" />
              Nuevo Lote
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSatelliteView(!satelliteView)}>
              <Layers className="h-4 w-4 mr-1" />
              {satelliteView ? 'Mapa' : 'Satélite'}
            </Button>
            {farmBoundary && (
              <Button variant="outline" size="sm" onClick={() => setShowAISuggestions(true)}>
                <Wand2 className="h-4 w-4 mr-1" />
                Sugerir Lotes (IA)
              </Button>
            )}
          </>
        ) : (
          <>
            <Button
              size="sm"
              onClick={handleFinishDrawing}
              disabled={drawingPoints.length < 3}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Finalizar ({drawingPoints.length} puntos)
            </Button>
            <Button variant="outline" size="sm" onClick={handleUndoPoint} disabled={drawingPoints.length === 0}>
              Deshacer punto
            </Button>
            <Button variant="ghost" size="sm" onClick={handleCancelDrawing}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <span className="text-xs text-muted-foreground ml-2">
              {pendingArea > 0 && `≈ ${pendingArea.toFixed(2)} ha`}
            </span>
          </>
        )}
      </div>

      {/* Draw mode instructions */}
      {drawMode && (
        <Alert className="border-primary/30 bg-primary/5">
          <MousePointer className="h-4 w-4" />
          <AlertDescription>
            {drawMode === 'farm'
              ? 'Toca/haz clic en el mapa para marcar los puntos del contorno de tu finca. Mínimo 3 puntos. Cuando termines, presiona "Finalizar".'
              : 'Toca/haz clic dentro de tu finca para crear un lote. Mínimo 3 puntos. Cuando termines, presiona "Finalizar".'}
          </AlertDescription>
        </Alert>
      )}

      {/* Map */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative h-[500px] md:h-[600px]">
            <MapContainer
              center={defaultCenter}
              zoom={defaultZoom}
              className="h-full w-full z-0"
              scrollWheelZoom
              touchZoom
              dragging
            >
              <MapSearch onSearch={handleSearch} />
              <FlyTo location={searchLocation} />
              <ClickHandler active={!!drawMode} onPoint={handleAddPoint} />

              {satelliteView ? (
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution="&copy; Esri"
                  maxZoom={19}
                />
              ) : (
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap"
                  maxZoom={19}
                />
              )}

              {/* Farm boundary */}
              {farmPositions.length > 0 && (
                <Polygon
                  positions={farmPositions}
                  pathOptions={{ color: '#EF4444', weight: 3, fillOpacity: 0.05, dashArray: '10 5' }}
                >
                  <Popup>
                    <div className="p-1">
                      <p className="font-bold">{farmBoundary?.name}</p>
                      <p className="text-xs">Área total: {farmBoundary?.area_hectares?.toFixed(2)} ha</p>
                    </div>
                  </Popup>
                </Polygon>
              )}

              {/* Lots */}
              {lots.map((lot) => {
                const positions =
                  lot.boundary_polygon?.coordinates?.[0]?.map(
                    (c: number[]) => [c[1], c[0]] as [number, number]
                  ) || [];
                if (positions.length === 0) return null;
                return (
                  <Polygon
                    key={lot.id}
                    positions={positions}
                    pathOptions={{ color: lot.lot_color || '#3B82F6', weight: 2, fillOpacity: 0.3, fillColor: lot.lot_color || '#3B82F6' }}
                  >
                    <Popup>
                      <LotPopupContent lot={lot} onDelete={() => deleteLotPolygon(lot.id)} />
                    </Popup>
                  </Polygon>
                );
              })}

              {/* Drawing preview */}
              {drawingPoints.length >= 2 && (
                <Polyline
                  positions={drawingPoints.map((p) => [p.lat, p.lng] as [number, number])}
                  pathOptions={{ color: drawMode === 'farm' ? '#EF4444' : formColor, weight: 3, dashArray: '6 4' }}
                />
              )}
              {drawingPoints.length >= 3 && (
                <Polygon
                  positions={drawingPoints.map((p) => [p.lat, p.lng] as [number, number])}
                  pathOptions={{
                    color: drawMode === 'farm' ? '#EF4444' : formColor,
                    weight: 2,
                    fillOpacity: 0.15,
                    dashArray: '4 4',
                  }}
                />
              )}
              {drawingPoints.map((p, i) => (
                <Marker key={i} position={[p.lat, p.lng]} icon={vertexIcon} />
              ))}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      {(lots.length > 0 || farmBoundary) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Leyenda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {farmBoundary && (
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-0.5 border border-dashed border-destructive" />
                  <span>Finca ({farmBoundary.area_hectares?.toFixed(1)} ha)</span>
                </div>
              )}
              {lots.map((lot) => (
                <div key={lot.id} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: lot.lot_color }} />
                  <span>{lot.name} ({lot.area_hectares?.toFixed(1)} ha)</span>
                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                    {lot.current_animals} 🐄
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {drawMode === 'farm' ? 'Guardar Límites de Finca' : 'Guardar Nuevo Lote'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder={drawMode === 'farm' ? 'Nombre de la finca' : 'Nombre del lote'} />
            </div>
            <div className="p-3 bg-muted rounded-lg text-sm">
              <span className="text-muted-foreground">Área calculada: </span>
              <span className="font-bold text-lg">{pendingArea.toFixed(2)} ha</span>
            </div>
            {drawMode === 'lot' && (
              <>
                <div>
                  <Label>Tipo de uso</Label>
                  <Select value={formUsage} onValueChange={setFormUsage}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {USAGE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Capacidad máx.</Label>
                    <Input type="number" value={formCapacity} onChange={(e) => setFormCapacity(e.target.value)} placeholder="Animales" />
                  </div>
                  <div>
                    <Label>Tipo de pasto</Label>
                    <Input value={formGrassType} onChange={(e) => setFormGrassType(e.target.value)} placeholder="Ej: Brachiaria" />
                  </div>
                </div>
                <div>
                  <Label>Color del lote</Label>
                  <div className="flex gap-2 mt-1">
                    {LOT_COLORS.map((c) => (
                      <button
                        key={c}
                        className={`w-7 h-7 rounded-full border-2 transition-transform ${formColor === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                        onClick={() => setFormColor(c)}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowSaveDialog(false); setDrawingPoints([]); }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!formName.trim()}>
              <Save className="h-4 w-4 mr-1" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Suggestions */}
      <AILotSuggestionsDialog
        open={showAISuggestions}
        onClose={() => setShowAISuggestions(false)}
        farmArea={Number(farmBoundary?.area_hectares) || 0}
      />
    </div>
  );
};

const AILotSuggestionsDialog = ({ open, onClose, farmArea }: { open: boolean; onClose: () => void; farmArea: number }) => {
  const [animalCount, setAnimalCount] = useState('50');
  const [productionType, setProductionType] = useState('carne');

  const animals = parseInt(animalCount) || 50;
  const cargaIdeal = productionType === 'leche' ? 2.5 : 1.8;
  const lotesOptimos = Math.max(4, Math.min(12, Math.ceil(farmArea / (animals / cargaIdeal / 4))));
  const areaPerLot = farmArea / lotesOptimos;
  const animalsPerLot = Math.ceil(animals / Math.ceil(lotesOptimos * 0.6));
  const restDays = productionType === 'leche' ? 35 : 45;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Sugerencias de División (IA)
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Número de animales</Label>
              <Input type="number" value={animalCount} onChange={(e) => setAnimalCount(e.target.value)} />
            </div>
            <div>
              <Label>Tipo de producción</Label>
              <Select value={productionType} onValueChange={setProductionType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="carne">Carne</SelectItem>
                  <SelectItem value="leche">Leche</SelectItem>
                  <SelectItem value="doble">Doble propósito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4 space-y-3">
              <h4 className="font-semibold text-sm">📊 Recomendación para {farmArea.toFixed(1)} ha</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-background rounded">
                  <p className="text-muted-foreground text-xs">Lotes óptimos</p>
                  <p className="text-xl font-bold text-primary">{lotesOptimos}</p>
                </div>
                <div className="p-2 bg-background rounded">
                  <p className="text-muted-foreground text-xs">Área por lote</p>
                  <p className="text-xl font-bold">{areaPerLot.toFixed(1)} ha</p>
                </div>
                <div className="p-2 bg-background rounded">
                  <p className="text-muted-foreground text-xs">Animales por lote</p>
                  <p className="text-xl font-bold">{animalsPerLot}</p>
                </div>
                <div className="p-2 bg-background rounded">
                  <p className="text-muted-foreground text-xs">Descanso sugerido</p>
                  <p className="text-xl font-bold">{restDays} días</p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Carga animal ideal: {cargaIdeal} cab/ha para {productionType}</p>
                <p>• Se sugiere ~60% de lotes ocupados y 40% en descanso</p>
                <p>• Dibuja manualmente los lotes según la topografía</p>
              </div>
            </CardContent>
          </Card>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Entendido</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FarmMapView;
