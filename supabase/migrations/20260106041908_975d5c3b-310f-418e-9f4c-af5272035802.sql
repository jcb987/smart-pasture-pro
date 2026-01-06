
-- Tabla para evaluaciones genéticas de animales
CREATE TABLE public.genetic_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  evaluator TEXT,
  -- Indicadores de producción
  milk_production_index NUMERIC,
  meat_production_index NUMERIC,
  growth_rate_index NUMERIC,
  -- Indicadores reproductivos
  fertility_index NUMERIC,
  calving_ease_index NUMERIC,
  maternal_ability_index NUMERIC,
  -- Indicadores de conformación
  body_conformation_score NUMERIC,
  udder_score NUMERIC,
  legs_feet_score NUMERIC,
  -- Indicadores de salud
  disease_resistance_index NUMERIC,
  longevity_index NUMERIC,
  -- Valor genético general
  overall_genetic_value NUMERIC,
  reliability_percentage NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Tabla para sugerencias de apareamiento
CREATE TABLE public.breeding_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  female_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  male_id UUID REFERENCES public.animals(id) ON DELETE SET NULL,
  semen_code TEXT,
  bull_name TEXT,
  suggested_date DATE,
  priority INTEGER DEFAULT 1,
  expected_improvement JSONB,
  inbreeding_coefficient NUMERIC,
  compatibility_score NUMERIC,
  status TEXT DEFAULT 'pendiente',
  executed_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Tabla para registros de trazabilidad/exportación
CREATE TABLE public.traceability_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL, -- 'export', 'import', 'transfer', 'audit'
  record_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source_organization TEXT,
  destination_organization TEXT,
  export_data JSONB,
  document_hash TEXT,
  verification_code TEXT,
  notes TEXT,
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.genetic_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breeding_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traceability_records ENABLE ROW LEVEL SECURITY;

-- Policies for genetic_evaluations
CREATE POLICY "Users can view genetic evaluations in their organization"
ON public.genetic_evaluations FOR SELECT
USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage genetic evaluations in their organization"
ON public.genetic_evaluations FOR ALL
USING (organization_id = get_user_organization_id());

-- Policies for breeding_suggestions
CREATE POLICY "Users can view breeding suggestions in their organization"
ON public.breeding_suggestions FOR SELECT
USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage breeding suggestions in their organization"
ON public.breeding_suggestions FOR ALL
USING (organization_id = get_user_organization_id());

-- Policies for traceability_records
CREATE POLICY "Users can view traceability records in their organization"
ON public.traceability_records FOR SELECT
USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage traceability records in their organization"
ON public.traceability_records FOR ALL
USING (organization_id = get_user_organization_id());
