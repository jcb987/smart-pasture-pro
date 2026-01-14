-- Tabla para palpaciones reproductivas detalladas (bovinos y bufalinos)
CREATE TABLE IF NOT EXISTS public.palpation_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  reproductive_event_id UUID REFERENCES public.reproductive_events(id) ON DELETE SET NULL,
  
  -- Información básica
  palpation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  veterinarian TEXT,
  species TEXT DEFAULT 'bovino' CHECK (species IN ('bovino', 'bufalino')),
  is_pregnant BOOLEAN NOT NULL DEFAULT FALSE,
  gestation_days INTEGER,
  
  -- Condición corporal (BCS 1.0-5.0)
  body_condition_score NUMERIC(2,1) CHECK (body_condition_score >= 1.0 AND body_condition_score <= 5.0),
  
  -- Hallazgos de ovarios (array para selección múltiple)
  ovary_findings TEXT[] DEFAULT '{}',
  
  -- Hallazgos de útero (array para selección múltiple)
  uterus_findings TEXT[] DEFAULT '{}',
  
  -- Condición reproductiva general
  reproductive_condition TEXT,
  
  -- Diagnóstico y recomendaciones IA
  ai_diagnosis TEXT,
  ai_recommendations TEXT[],
  ai_alert_level TEXT CHECK (ai_alert_level IN ('normal', 'warning', 'urgent')),
  
  -- Notas y observaciones
  notes TEXT,
  
  -- Metadatos
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_palpation_records_organization ON public.palpation_records(organization_id);
CREATE INDEX idx_palpation_records_animal ON public.palpation_records(animal_id);
CREATE INDEX idx_palpation_records_date ON public.palpation_records(palpation_date);
CREATE INDEX idx_palpation_records_alert ON public.palpation_records(ai_alert_level);

-- RLS
ALTER TABLE public.palpation_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view palpation records in their organization"
  ON public.palpation_records
  FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert palpation records in their organization"
  ON public.palpation_records
  FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update palpation records in their organization"
  ON public.palpation_records
  FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete palpation records in their organization"
  ON public.palpation_records
  FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

-- Tabla para configuración de alertas de parto retrasado
CREATE TABLE IF NOT EXISTS public.birth_delay_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Días después de fecha probable para alerta de advertencia
  warning_days INTEGER NOT NULL DEFAULT 10,
  
  -- Días después de fecha probable para alerta urgente
  urgent_days INTEGER NOT NULL DEFAULT 15,
  
  -- Especie-específico
  bovine_gestation_days INTEGER NOT NULL DEFAULT 283,
  buffalo_gestation_days INTEGER NOT NULL DEFAULT 310,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS para configuración
ALTER TABLE public.birth_delay_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view birth delay config in their organization"
  ON public.birth_delay_config
  FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage birth delay config in their organization"
  ON public.birth_delay_config
  FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

-- Trigger para updated_at
CREATE TRIGGER update_palpation_records_updated_at
  BEFORE UPDATE ON public.palpation_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_birth_delay_config_updated_at
  BEFORE UPDATE ON public.birth_delay_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();