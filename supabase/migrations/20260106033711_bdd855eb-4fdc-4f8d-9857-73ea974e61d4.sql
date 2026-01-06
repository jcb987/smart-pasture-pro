-- Tabla para inventario de alimentos
CREATE TABLE public.feed_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'forraje', 'concentrado', 'suplemento', 'mineral', 'otro'
  unit TEXT NOT NULL DEFAULT 'kg', -- kg, ton, bulto, etc.
  current_stock NUMERIC(12,2) DEFAULT 0,
  min_stock NUMERIC(12,2) DEFAULT 0,
  unit_cost NUMERIC(10,2),
  supplier TEXT,
  -- Valores nutricionales
  protein_percentage NUMERIC(5,2), -- % proteína cruda
  energy_mcal NUMERIC(6,2), -- Mcal/kg
  fdn_percentage NUMERIC(5,2), -- % FDN (fibra detergente neutro)
  dry_matter_percentage NUMERIC(5,2), -- % materia seca
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para dietas/raciones
CREATE TABLE public.feed_diets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  target_group TEXT, -- 'vacas_lactando', 'vacas_secas', 'novillas', 'terneros', etc.
  target_lot TEXT, -- lote específico
  is_active BOOLEAN DEFAULT true,
  -- Objetivos nutricionales
  target_protein NUMERIC(5,2), -- % proteína objetivo
  target_energy NUMERIC(6,2), -- Mcal/día objetivo
  target_fdn NUMERIC(5,2), -- % FDN objetivo
  target_dry_matter NUMERIC(6,2), -- kg materia seca/día
  -- Costos
  daily_cost NUMERIC(10,2), -- costo diario por animal
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para ingredientes de cada dieta
CREATE TABLE public.feed_diet_ingredients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  diet_id UUID NOT NULL REFERENCES public.feed_diets(id) ON DELETE CASCADE,
  feed_id UUID NOT NULL REFERENCES public.feed_inventory(id) ON DELETE CASCADE,
  quantity_kg NUMERIC(8,2) NOT NULL, -- kg por animal/día
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para registros de consumo
CREATE TABLE public.feed_consumption (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  consumption_date DATE NOT NULL DEFAULT CURRENT_DATE,
  feed_id UUID NOT NULL REFERENCES public.feed_inventory(id) ON DELETE CASCADE,
  animal_id UUID REFERENCES public.animals(id) ON DELETE SET NULL,
  lot_name TEXT,
  quantity_kg NUMERIC(10,2) NOT NULL,
  cost NUMERIC(10,2),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.feed_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_diets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_diet_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_consumption ENABLE ROW LEVEL SECURITY;

-- Políticas para feed_inventory
CREATE POLICY "Users can view feed inventory in their organization"
ON public.feed_inventory FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage feed inventory in their organization"
ON public.feed_inventory FOR ALL USING (organization_id = get_user_organization_id());

-- Políticas para feed_diets
CREATE POLICY "Users can view feed diets in their organization"
ON public.feed_diets FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage feed diets in their organization"
ON public.feed_diets FOR ALL USING (organization_id = get_user_organization_id());

-- Políticas para feed_diet_ingredients
CREATE POLICY "Users can view diet ingredients"
ON public.feed_diet_ingredients FOR SELECT
USING (EXISTS (SELECT 1 FROM public.feed_diets WHERE id = diet_id AND organization_id = get_user_organization_id()));

CREATE POLICY "Users can manage diet ingredients"
ON public.feed_diet_ingredients FOR ALL
USING (EXISTS (SELECT 1 FROM public.feed_diets WHERE id = diet_id AND organization_id = get_user_organization_id()));

-- Políticas para feed_consumption
CREATE POLICY "Users can view feed consumption in their organization"
ON public.feed_consumption FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage feed consumption in their organization"
ON public.feed_consumption FOR ALL USING (organization_id = get_user_organization_id());

-- Índices
CREATE INDEX idx_feed_inventory_org ON public.feed_inventory(organization_id);
CREATE INDEX idx_feed_diets_org ON public.feed_diets(organization_id);
CREATE INDEX idx_feed_consumption_date ON public.feed_consumption(consumption_date);
CREATE INDEX idx_feed_consumption_org ON public.feed_consumption(organization_id);