-- Tabla para registros de producción de leche
CREATE TABLE public.milk_production (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  production_date DATE NOT NULL DEFAULT CURRENT_DATE,
  morning_liters NUMERIC(8,2) DEFAULT 0,
  afternoon_liters NUMERIC(8,2) DEFAULT 0,
  evening_liters NUMERIC(8,2) DEFAULT 0,
  total_liters NUMERIC(8,2) GENERATED ALWAYS AS (COALESCE(morning_liters, 0) + COALESCE(afternoon_liters, 0) + COALESCE(evening_liters, 0)) STORED,
  fat_percentage NUMERIC(4,2),
  protein_percentage NUMERIC(4,2),
  somatic_cell_count INTEGER,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para registros de peso (producción de carne)
CREATE TABLE public.weight_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  weight_date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg NUMERIC(8,2) NOT NULL,
  weight_type TEXT NOT NULL DEFAULT 'manual',
  condition_score NUMERIC(3,1),
  daily_gain NUMERIC(6,2),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.milk_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_records ENABLE ROW LEVEL SECURITY;

-- Políticas para milk_production
CREATE POLICY "Users can view milk production in their organization"
ON public.milk_production FOR SELECT
USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert milk production in their organization"
ON public.milk_production FOR INSERT
WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update milk production in their organization"
ON public.milk_production FOR UPDATE
USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete milk production in their organization"
ON public.milk_production FOR DELETE
USING (organization_id = get_user_organization_id());

-- Políticas para weight_records
CREATE POLICY "Users can view weight records in their organization"
ON public.weight_records FOR SELECT
USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert weight records in their organization"
ON public.weight_records FOR INSERT
WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update weight records in their organization"
ON public.weight_records FOR UPDATE
USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete weight records in their organization"
ON public.weight_records FOR DELETE
USING (organization_id = get_user_organization_id());

-- Índices para mejor rendimiento
CREATE INDEX idx_milk_production_animal ON public.milk_production(animal_id);
CREATE INDEX idx_milk_production_date ON public.milk_production(production_date);
CREATE INDEX idx_milk_production_org ON public.milk_production(organization_id);
CREATE INDEX idx_weight_records_animal ON public.weight_records(animal_id);
CREATE INDEX idx_weight_records_date ON public.weight_records(weight_date);
CREATE INDEX idx_weight_records_org ON public.weight_records(organization_id);