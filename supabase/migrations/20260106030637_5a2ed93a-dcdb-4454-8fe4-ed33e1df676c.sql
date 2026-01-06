-- Enum para categorías de animales
CREATE TYPE public.animal_category AS ENUM ('vaca', 'toro', 'novilla', 'novillo', 'ternera', 'ternero', 'becerra', 'becerro');

-- Enum para estado del animal
CREATE TYPE public.animal_status AS ENUM ('activo', 'vendido', 'muerto', 'descartado', 'trasladado');

-- Enum para sexo
CREATE TYPE public.animal_sex AS ENUM ('macho', 'hembra');

-- Tabla principal de animales
CREATE TABLE public.animals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  
  -- Identificación
  tag_id TEXT NOT NULL, -- Arete/número de identificación
  name TEXT, -- Nombre opcional
  rfid_tag TEXT, -- Tag RFID opcional
  
  -- Datos básicos
  category animal_category NOT NULL,
  sex animal_sex NOT NULL,
  breed TEXT, -- Raza
  color TEXT, -- Color
  birth_date DATE,
  entry_date DATE DEFAULT CURRENT_DATE, -- Fecha de ingreso al hato
  
  -- Estado
  status animal_status NOT NULL DEFAULT 'activo',
  status_date DATE, -- Fecha del último cambio de estado
  status_reason TEXT, -- Razón del cambio de estado
  
  -- Peso actual (se actualiza con cada pesaje)
  current_weight DECIMAL(10,2),
  last_weight_date DATE,
  
  -- Origen
  origin TEXT, -- Nacido en finca, comprado, etc.
  purchase_price DECIMAL(12,2),
  purchase_date DATE,
  
  -- Ubicación
  lot_name TEXT, -- Lote/potrero actual
  
  -- Genealogía
  mother_id UUID REFERENCES public.animals(id) ON DELETE SET NULL,
  father_id UUID REFERENCES public.animals(id) ON DELETE SET NULL,
  
  -- Notas
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(organization_id, tag_id)
);

-- Tabla de historial de eventos del animal
CREATE TABLE public.animal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID REFERENCES public.animals(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  
  event_type TEXT NOT NULL, -- pesaje, vacunacion, tratamiento, parto, servicio, destete, etc.
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Datos del evento (flexibles según tipo)
  weight DECIMAL(10,2), -- Para pesajes
  details JSONB, -- Detalles adicionales según tipo de evento
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Tabla de lotes/grupos
CREATE TABLE public.animal_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  capacity INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(organization_id, name)
);

-- Habilitar RLS
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animal_lots ENABLE ROW LEVEL SECURITY;

-- Políticas para animals
CREATE POLICY "Users can view animals in their organization"
ON public.animals FOR SELECT
USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can insert animals in their organization"
ON public.animals FOR INSERT
WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can update animals in their organization"
ON public.animals FOR UPDATE
USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can delete animals in their organization"
ON public.animals FOR DELETE
USING (organization_id = public.get_user_organization_id());

-- Políticas para animal_events
CREATE POLICY "Users can view animal events in their organization"
ON public.animal_events FOR SELECT
USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can insert animal events in their organization"
ON public.animal_events FOR INSERT
WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can update animal events in their organization"
ON public.animal_events FOR UPDATE
USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can delete animal events in their organization"
ON public.animal_events FOR DELETE
USING (organization_id = public.get_user_organization_id());

-- Políticas para animal_lots
CREATE POLICY "Users can view lots in their organization"
ON public.animal_lots FOR SELECT
USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can manage lots in their organization"
ON public.animal_lots FOR ALL
USING (organization_id = public.get_user_organization_id());

-- Índices para mejor rendimiento
CREATE INDEX idx_animals_organization ON public.animals(organization_id);
CREATE INDEX idx_animals_category ON public.animals(category);
CREATE INDEX idx_animals_status ON public.animals(status);
CREATE INDEX idx_animals_tag ON public.animals(tag_id);
CREATE INDEX idx_animal_events_animal ON public.animal_events(animal_id);
CREATE INDEX idx_animal_events_date ON public.animal_events(event_date);

-- Trigger para updated_at
CREATE TRIGGER update_animals_updated_at
BEFORE UPDATE ON public.animals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();