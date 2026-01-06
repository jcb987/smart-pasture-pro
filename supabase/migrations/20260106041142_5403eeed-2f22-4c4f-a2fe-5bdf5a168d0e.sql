-- Create supplies inventory table
CREATE TABLE public.supplies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'unidad',
  current_stock NUMERIC NOT NULL DEFAULT 0,
  min_stock NUMERIC NOT NULL DEFAULT 0,
  unit_cost NUMERIC,
  supplier TEXT,
  location TEXT,
  withdrawal_days INTEGER DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create supply lots for batch/expiration tracking
CREATE TABLE public.supply_lots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  supply_id UUID NOT NULL REFERENCES public.supplies(id) ON DELETE CASCADE,
  lot_number TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  expiration_date DATE,
  manufacture_date DATE,
  purchase_date DATE DEFAULT CURRENT_DATE,
  unit_cost NUMERIC,
  supplier TEXT,
  notes TEXT,
  is_depleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create kardex movements table
CREATE TABLE public.supply_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  supply_id UUID NOT NULL REFERENCES public.supplies(id) ON DELETE CASCADE,
  lot_id UUID REFERENCES public.supply_lots(id) ON DELETE SET NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('entrada', 'salida', 'ajuste')),
  quantity NUMERIC NOT NULL,
  unit_cost NUMERIC,
  total_cost NUMERIC,
  reason TEXT,
  reference_number TEXT,
  animal_id UUID REFERENCES public.animals(id) ON DELETE SET NULL,
  lot_name TEXT,
  movement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.supplies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supply_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supply_movements ENABLE ROW LEVEL SECURITY;

-- Supplies policies
CREATE POLICY "Users can view supplies in their organization"
ON public.supplies FOR SELECT
USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage supplies in their organization"
ON public.supplies FOR ALL
USING (organization_id = get_user_organization_id());

-- Supply lots policies
CREATE POLICY "Users can view supply lots in their organization"
ON public.supply_lots FOR SELECT
USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage supply lots in their organization"
ON public.supply_lots FOR ALL
USING (organization_id = get_user_organization_id());

-- Supply movements policies
CREATE POLICY "Users can view supply movements in their organization"
ON public.supply_movements FOR SELECT
USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage supply movements in their organization"
ON public.supply_movements FOR ALL
USING (organization_id = get_user_organization_id());

-- Create trigger for updated_at on supplies
CREATE TRIGGER update_supplies_updated_at
BEFORE UPDATE ON public.supplies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();