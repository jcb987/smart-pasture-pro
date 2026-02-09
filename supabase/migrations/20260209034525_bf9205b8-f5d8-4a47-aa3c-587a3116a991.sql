
-- Table for farm boundaries (the overall farm polygon)
CREATE TABLE public.farm_boundaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Mi Finca',
  boundary_polygon JSONB NOT NULL, -- GeoJSON polygon coordinates
  area_hectares NUMERIC(12,4),
  center_lat NUMERIC(12,8),
  center_lng NUMERIC(12,8),
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.farm_boundaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org farm boundaries"
ON public.farm_boundaries FOR SELECT
TO authenticated
USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can insert own org farm boundaries"
ON public.farm_boundaries FOR INSERT
TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can update own org farm boundaries"
ON public.farm_boundaries FOR UPDATE
TO authenticated
USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can delete own org farm boundaries"
ON public.farm_boundaries FOR DELETE
TO authenticated
USING (organization_id = public.get_user_organization_id());

-- Add polygon data to existing paddocks table
ALTER TABLE public.paddocks 
ADD COLUMN IF NOT EXISTS boundary_polygon JSONB,
ADD COLUMN IF NOT EXISTS center_lat NUMERIC(12,8),
ADD COLUMN IF NOT EXISTS center_lng NUMERIC(12,8),
ADD COLUMN IF NOT EXISTS lot_color TEXT DEFAULT '#3B82F6',
ADD COLUMN IF NOT EXISTS lot_usage TEXT DEFAULT 'pastoreo',
ADD COLUMN IF NOT EXISTS farm_boundary_id UUID REFERENCES public.farm_boundaries(id) ON DELETE SET NULL;

-- Trigger for updated_at on farm_boundaries
CREATE TRIGGER update_farm_boundaries_updated_at
BEFORE UPDATE ON public.farm_boundaries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Founder access policies
CREATE POLICY "Founders can view all farm boundaries"
ON public.farm_boundaries FOR SELECT
TO authenticated
USING (public.is_founder(auth.uid()));
