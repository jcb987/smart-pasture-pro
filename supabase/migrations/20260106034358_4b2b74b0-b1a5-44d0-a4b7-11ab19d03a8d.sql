-- Tabla para potreros/praderas
CREATE TABLE public.paddocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  area_hectares NUMERIC(10,2), -- área en hectáreas
  grass_type TEXT, -- tipo de pasto (kikuyo, ryegrass, brachiaria, etc.)
  soil_type TEXT, -- tipo de suelo
  irrigation BOOLEAN DEFAULT false, -- tiene riego?
  current_status TEXT DEFAULT 'disponible', -- disponible, ocupado, en_descanso, en_recuperacion
  current_animals INTEGER DEFAULT 0, -- animales actuales
  max_capacity INTEGER, -- capacidad máxima de animales
  last_occupation_date DATE,
  last_rest_start DATE,
  recommended_rest_days INTEGER DEFAULT 30,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para historial de uso/rotación de potreros
CREATE TABLE public.paddock_rotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  paddock_id UUID NOT NULL REFERENCES public.paddocks(id) ON DELETE CASCADE,
  lot_name TEXT, -- lote de animales
  animals_count INTEGER,
  entry_date DATE NOT NULL,
  exit_date DATE,
  days_occupied INTEGER,
  entry_forage_kg NUMERIC(10,2), -- kg pasto al entrar
  exit_forage_kg NUMERIC(10,2), -- kg pasto al salir
  forage_consumed_kg NUMERIC(10,2), -- consumo total
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para aforos (medición de forraje)
CREATE TABLE public.forage_measurements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  paddock_id UUID NOT NULL REFERENCES public.paddocks(id) ON DELETE CASCADE,
  measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  measurement_type TEXT DEFAULT 'manual', -- manual, estimado
  grass_height_cm NUMERIC(6,2), -- altura del pasto
  forage_kg_per_ha NUMERIC(10,2), -- kg de forraje por hectárea
  total_forage_kg NUMERIC(12,2), -- total kg disponible
  dry_matter_percentage NUMERIC(5,2), -- % materia seca
  quality_score INTEGER, -- 1-5 calidad visual
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.paddocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paddock_rotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forage_measurements ENABLE ROW LEVEL SECURITY;

-- Políticas para paddocks
CREATE POLICY "Users can view paddocks in their organization"
ON public.paddocks FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage paddocks in their organization"
ON public.paddocks FOR ALL USING (organization_id = get_user_organization_id());

-- Políticas para paddock_rotations
CREATE POLICY "Users can view rotations in their organization"
ON public.paddock_rotations FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage rotations in their organization"
ON public.paddock_rotations FOR ALL USING (organization_id = get_user_organization_id());

-- Políticas para forage_measurements
CREATE POLICY "Users can view measurements in their organization"
ON public.forage_measurements FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage measurements in their organization"
ON public.forage_measurements FOR ALL USING (organization_id = get_user_organization_id());

-- Índices
CREATE INDEX idx_paddocks_org ON public.paddocks(organization_id);
CREATE INDEX idx_paddock_rotations_paddock ON public.paddock_rotations(paddock_id);
CREATE INDEX idx_paddock_rotations_org ON public.paddock_rotations(organization_id);
CREATE INDEX idx_forage_measurements_paddock ON public.forage_measurements(paddock_id);
CREATE INDEX idx_forage_measurements_org ON public.forage_measurements(organization_id);