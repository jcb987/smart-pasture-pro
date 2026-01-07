-- 1. Agregar nuevas categorías de animales (búfala y búfalo)
ALTER TYPE animal_category ADD VALUE IF NOT EXISTS 'bufala';
ALTER TYPE animal_category ADD VALUE IF NOT EXISTS 'bufalo';

-- 2. Crear tabla para almacenar respuestas de onboarding
CREATE TABLE public.user_onboarding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  
  -- Rol principal
  primary_role TEXT NOT NULL CHECK (primary_role IN ('ganadero', 'vaquero', 'veterinario', 'administrador')),
  
  -- Tipo de producción
  production_type TEXT NOT NULL CHECK (production_type IN ('carne', 'leche', 'doble_proposito')),
  
  -- Especies trabajadas (array)
  species TEXT[] NOT NULL DEFAULT '{}',
  
  -- Tamaño del hato
  herd_size TEXT NOT NULL CHECK (herd_size IN ('1-50', '51-100', '101-250', '251-500', '500+')),
  
  -- Principal problema actual
  main_challenge TEXT NOT NULL CHECK (main_challenge IN ('sanidad', 'reproduccion', 'costos', 'organizacion')),
  
  -- Timestamps
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE UNIQUE INDEX user_onboarding_user_id_idx ON public.user_onboarding(user_id);

-- Habilitar RLS
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own onboarding"
ON public.user_onboarding
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding"
ON public.user_onboarding
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding"
ON public.user_onboarding
FOR UPDATE
USING (auth.uid() = user_id);