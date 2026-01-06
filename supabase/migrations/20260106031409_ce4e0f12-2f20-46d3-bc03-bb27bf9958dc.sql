-- Crear tabla de eventos reproductivos con más detalle
CREATE TABLE public.reproductive_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('celo', 'servicio', 'inseminacion', 'palpacion', 'parto', 'aborto', 'secado')),
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Para servicios e inseminaciones
  bull_id UUID REFERENCES public.animals(id),
  semen_batch TEXT,
  technician TEXT,
  
  -- Para palpaciones
  pregnancy_result TEXT CHECK (pregnancy_result IN ('positivo', 'negativo', 'dudoso')),
  estimated_gestation_days INTEGER,
  
  -- Para partos
  calf_id UUID REFERENCES public.animals(id),
  birth_type TEXT CHECK (birth_type IN ('normal', 'distocico', 'cesarea', 'gemelar')),
  calf_sex TEXT CHECK (calf_sex IN ('macho', 'hembra')),
  calf_weight NUMERIC,
  
  -- Calculado
  expected_birth_date DATE,
  
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.reproductive_events ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view reproductive events in their organization" 
ON public.reproductive_events FOR SELECT 
USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert reproductive events in their organization" 
ON public.reproductive_events FOR INSERT 
WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update reproductive events in their organization" 
ON public.reproductive_events FOR UPDATE 
USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete reproductive events in their organization" 
ON public.reproductive_events FOR DELETE 
USING (organization_id = get_user_organization_id());

-- Índices para rendimiento
CREATE INDEX idx_reproductive_events_org ON public.reproductive_events(organization_id);
CREATE INDEX idx_reproductive_events_animal ON public.reproductive_events(animal_id);
CREATE INDEX idx_reproductive_events_date ON public.reproductive_events(event_date DESC);
CREATE INDEX idx_reproductive_events_type ON public.reproductive_events(event_type);

-- Añadir campos reproductivos a la tabla animals
ALTER TABLE public.animals 
ADD COLUMN IF NOT EXISTS reproductive_status TEXT DEFAULT 'vacia' CHECK (reproductive_status IN ('vacia', 'servida', 'preñada', 'lactando', 'seca')),
ADD COLUMN IF NOT EXISTS last_calving_date DATE,
ADD COLUMN IF NOT EXISTS last_service_date DATE,
ADD COLUMN IF NOT EXISTS expected_calving_date DATE,
ADD COLUMN IF NOT EXISTS total_calvings INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS first_calving_date DATE;