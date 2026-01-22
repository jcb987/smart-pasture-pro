-- =============================================
-- 1. TAREAS DE CAMPO (Field Tasks)
-- =============================================
CREATE TABLE public.field_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES public.profiles(user_id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'health', 'feeding', 'reproduction', 'maintenance', 'other')),
  related_animal_id UUID REFERENCES public.animals(id) ON DELETE SET NULL,
  related_paddock_id UUID REFERENCES public.paddocks(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.field_tasks ENABLE ROW LEVEL SECURITY;

-- Policies for field_tasks
CREATE POLICY "Users can view tasks from their organization" 
  ON public.field_tasks FOR SELECT 
  USING (organization_id = public.get_user_organization_id() OR public.is_founder(auth.uid()));

CREATE POLICY "Users can create tasks in their organization" 
  ON public.field_tasks FOR INSERT 
  WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can update tasks in their organization" 
  ON public.field_tasks FOR UPDATE 
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can delete tasks in their organization" 
  ON public.field_tasks FOR DELETE 
  USING (organization_id = public.get_user_organization_id());

-- =============================================
-- 2. SCORES PERSONALIZADOS (Custom Scores)
-- =============================================
CREATE TABLE public.custom_score_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  score_type TEXT NOT NULL DEFAULT 'numeric' CHECK (score_type IN ('numeric', 'scale', 'boolean', 'text')),
  min_value NUMERIC,
  max_value NUMERIC,
  scale_labels JSONB, -- For scale type: {"1": "Malo", "2": "Regular", "3": "Bueno", "4": "Excelente"}
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.animal_custom_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  score_definition_id UUID NOT NULL REFERENCES public.custom_score_definitions(id) ON DELETE CASCADE,
  numeric_value NUMERIC,
  text_value TEXT,
  boolean_value BOOLEAN,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  recorded_by UUID REFERENCES public.profiles(user_id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_score_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animal_custom_scores ENABLE ROW LEVEL SECURITY;

-- Policies for custom_score_definitions
CREATE POLICY "Users can view score definitions from their organization" 
  ON public.custom_score_definitions FOR SELECT 
  USING (organization_id = public.get_user_organization_id() OR public.is_founder(auth.uid()));

CREATE POLICY "Users can create score definitions in their organization" 
  ON public.custom_score_definitions FOR INSERT 
  WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can update score definitions in their organization" 
  ON public.custom_score_definitions FOR UPDATE 
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can delete score definitions in their organization" 
  ON public.custom_score_definitions FOR DELETE 
  USING (organization_id = public.get_user_organization_id());

-- Policies for animal_custom_scores
CREATE POLICY "Users can view scores from their organization" 
  ON public.animal_custom_scores FOR SELECT 
  USING (organization_id = public.get_user_organization_id() OR public.is_founder(auth.uid()));

CREATE POLICY "Users can create scores in their organization" 
  ON public.animal_custom_scores FOR INSERT 
  WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can update scores in their organization" 
  ON public.animal_custom_scores FOR UPDATE 
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can delete scores in their organization" 
  ON public.animal_custom_scores FOR DELETE 
  USING (organization_id = public.get_user_organization_id());

-- =============================================
-- 3. FACTURAS/NOTAS FISCALES
-- =============================================
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invoice_number TEXT,
  invoice_type TEXT NOT NULL DEFAULT 'purchase' CHECK (invoice_type IN ('purchase', 'sale', 'expense', 'other')),
  supplier_name TEXT,
  supplier_id TEXT,
  issue_date DATE,
  due_date DATE,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'COP',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'overdue')),
  file_url TEXT,
  file_name TEXT,
  parsed_data JSONB,
  items JSONB, -- Array of line items
  notes TEXT,
  created_by UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Policies for invoices
CREATE POLICY "Users can view invoices from their organization" 
  ON public.invoices FOR SELECT 
  USING (organization_id = public.get_user_organization_id() OR public.is_founder(auth.uid()));

CREATE POLICY "Users can create invoices in their organization" 
  ON public.invoices FOR INSERT 
  WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can update invoices in their organization" 
  ON public.invoices FOR UPDATE 
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can delete invoices in their organization" 
  ON public.invoices FOR DELETE 
  USING (organization_id = public.get_user_organization_id());

-- =============================================
-- 4. RFID DEVICES & READINGS
-- =============================================
CREATE TABLE public.rfid_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL DEFAULT 'bluetooth' CHECK (device_type IN ('bluetooth', 'usb', 'network')),
  device_id TEXT, -- MAC address or serial
  last_connected_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  settings JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.rfid_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.rfid_devices(id) ON DELETE SET NULL,
  tag_id TEXT NOT NULL,
  animal_id UUID REFERENCES public.animals(id) ON DELETE SET NULL,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  signal_strength INTEGER,
  location TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  action_triggered TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rfid_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfid_readings ENABLE ROW LEVEL SECURITY;

-- Policies for rfid_devices
CREATE POLICY "Users can view RFID devices from their organization" 
  ON public.rfid_devices FOR SELECT 
  USING (organization_id = public.get_user_organization_id() OR public.is_founder(auth.uid()));

CREATE POLICY "Users can create RFID devices in their organization" 
  ON public.rfid_devices FOR INSERT 
  WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can update RFID devices in their organization" 
  ON public.rfid_devices FOR UPDATE 
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can delete RFID devices in their organization" 
  ON public.rfid_devices FOR DELETE 
  USING (organization_id = public.get_user_organization_id());

-- Policies for rfid_readings
CREATE POLICY "Users can view RFID readings from their organization" 
  ON public.rfid_readings FOR SELECT 
  USING (organization_id = public.get_user_organization_id() OR public.is_founder(auth.uid()));

CREATE POLICY "Users can create RFID readings in their organization" 
  ON public.rfid_readings FOR INSERT 
  WITH CHECK (organization_id = public.get_user_organization_id());

-- =============================================
-- 5. API KEYS FOR ERP INTEGRATION
-- =============================================
CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL, -- First 8 chars for identification
  permissions JSONB NOT NULL DEFAULT '["read"]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Policies for api_keys (only admins)
CREATE POLICY "Admins can view API keys from their organization" 
  ON public.api_keys FOR SELECT 
  USING (organization_id = public.get_user_organization_id() AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can create API keys in their organization" 
  ON public.api_keys FOR INSERT 
  WITH CHECK (organization_id = public.get_user_organization_id() AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can update API keys in their organization" 
  ON public.api_keys FOR UPDATE 
  USING (organization_id = public.get_user_organization_id() AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete API keys in their organization" 
  ON public.api_keys FOR DELETE 
  USING (organization_id = public.get_user_organization_id() AND public.is_admin(auth.uid()));

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_field_tasks_org ON public.field_tasks(organization_id);
CREATE INDEX idx_field_tasks_status ON public.field_tasks(status);
CREATE INDEX idx_field_tasks_assigned ON public.field_tasks(assigned_to);
CREATE INDEX idx_field_tasks_due ON public.field_tasks(due_date);

CREATE INDEX idx_custom_scores_org ON public.custom_score_definitions(organization_id);
CREATE INDEX idx_animal_scores_animal ON public.animal_custom_scores(animal_id);
CREATE INDEX idx_animal_scores_definition ON public.animal_custom_scores(score_definition_id);

CREATE INDEX idx_invoices_org ON public.invoices(organization_id);
CREATE INDEX idx_invoices_date ON public.invoices(issue_date);
CREATE INDEX idx_invoices_status ON public.invoices(status);

CREATE INDEX idx_rfid_devices_org ON public.rfid_devices(organization_id);
CREATE INDEX idx_rfid_readings_tag ON public.rfid_readings(tag_id);
CREATE INDEX idx_rfid_readings_animal ON public.rfid_readings(animal_id);
CREATE INDEX idx_rfid_readings_time ON public.rfid_readings(read_at);

CREATE INDEX idx_api_keys_org ON public.api_keys(organization_id);
CREATE INDEX idx_api_keys_prefix ON public.api_keys(key_prefix);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================
CREATE TRIGGER update_field_tasks_updated_at
  BEFORE UPDATE ON public.field_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_score_definitions_updated_at
  BEFORE UPDATE ON public.custom_score_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rfid_devices_updated_at
  BEFORE UPDATE ON public.rfid_devices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();