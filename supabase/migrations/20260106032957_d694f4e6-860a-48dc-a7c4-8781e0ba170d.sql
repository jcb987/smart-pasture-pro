-- Tabla para eventos de salud (tratamientos, vacunas, diagnósticos)
CREATE TABLE public.health_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'tratamiento', 'vacuna', 'diagnostico'
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  diagnosis TEXT, -- mastitis, cojera, retención placenta, etc.
  treatment TEXT, -- descripción del tratamiento
  medication TEXT, -- medicamento usado
  dosage TEXT, -- dosis
  duration_days INTEGER, -- duración del tratamiento
  next_dose_date DATE, -- próxima dosis
  withdrawal_days INTEGER, -- días de retiro
  withdrawal_end_date DATE, -- fecha fin de retiro
  veterinarian TEXT, -- veterinario responsable
  cost NUMERIC(10,2), -- costo del tratamiento
  status TEXT DEFAULT 'activo', -- activo, completado, cancelado
  outcome TEXT, -- resultado: curado, en tratamiento, crónico, fallecido
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para calendario de vacunación
CREATE TABLE public.vaccination_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  animal_id UUID REFERENCES public.animals(id) ON DELETE CASCADE,
  lot_name TEXT, -- puede ser por lote en vez de animal individual
  vaccine_name TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  applied_date DATE,
  next_application_date DATE,
  dose_number INTEGER DEFAULT 1,
  is_applied BOOLEAN DEFAULT false,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.health_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccination_schedule ENABLE ROW LEVEL SECURITY;

-- Políticas para health_events
CREATE POLICY "Users can view health events in their organization"
ON public.health_events FOR SELECT
USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert health events in their organization"
ON public.health_events FOR INSERT
WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update health events in their organization"
ON public.health_events FOR UPDATE
USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete health events in their organization"
ON public.health_events FOR DELETE
USING (organization_id = get_user_organization_id());

-- Políticas para vaccination_schedule
CREATE POLICY "Users can view vaccination schedule in their organization"
ON public.vaccination_schedule FOR SELECT
USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert vaccination schedule in their organization"
ON public.vaccination_schedule FOR INSERT
WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update vaccination schedule in their organization"
ON public.vaccination_schedule FOR UPDATE
USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete vaccination schedule in their organization"
ON public.vaccination_schedule FOR DELETE
USING (organization_id = get_user_organization_id());

-- Índices para mejor rendimiento
CREATE INDEX idx_health_events_animal ON public.health_events(animal_id);
CREATE INDEX idx_health_events_date ON public.health_events(event_date);
CREATE INDEX idx_health_events_type ON public.health_events(event_type);
CREATE INDEX idx_health_events_org ON public.health_events(organization_id);
CREATE INDEX idx_vaccination_animal ON public.vaccination_schedule(animal_id);
CREATE INDEX idx_vaccination_date ON public.vaccination_schedule(scheduled_date);
CREATE INDEX idx_vaccination_org ON public.vaccination_schedule(organization_id);