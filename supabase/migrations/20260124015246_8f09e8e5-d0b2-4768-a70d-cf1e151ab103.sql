-- ============================================
-- MÓDULO 1: SIMULADOR DE VENTAS IA
-- ============================================
CREATE TABLE public.sale_simulations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  simulation_name TEXT NOT NULL,
  simulation_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  lot_name TEXT,
  animal_ids UUID[] DEFAULT '{}',
  current_avg_weight NUMERIC DEFAULT 0,
  target_weight NUMERIC DEFAULT 0,
  projected_sale_date DATE,
  market_price_per_kg NUMERIC DEFAULT 0,
  total_animals INTEGER DEFAULT 0,
  projected_revenue NUMERIC DEFAULT 0,
  projected_costs NUMERIC DEFAULT 0,
  projected_profit NUMERIC DEFAULT 0,
  profit_margin_percentage NUMERIC DEFAULT 0,
  ai_recommendations TEXT,
  optimal_sale_date DATE,
  optimal_sale_reason TEXT,
  created_by UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.sale_simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org simulations" ON public.sale_simulations
  FOR SELECT USING (organization_id = get_user_organization_id() OR public.is_founder(auth.uid()));

CREATE POLICY "Users can create simulations" ON public.sale_simulations
  FOR INSERT WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update own simulations" ON public.sale_simulations
  FOR UPDATE USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete own simulations" ON public.sale_simulations
  FOR DELETE USING (organization_id = get_user_organization_id());

-- ============================================
-- MÓDULO 2: COSTO POR ABSORCIÓN
-- ============================================
CREATE TABLE public.production_cost_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  analysis_period_start DATE NOT NULL,
  analysis_period_end DATE NOT NULL,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('milk', 'meat')),
  -- Costos directos
  feed_costs NUMERIC DEFAULT 0,
  health_costs NUMERIC DEFAULT 0,
  labor_costs NUMERIC DEFAULT 0,
  -- Costos indirectos
  utilities_costs NUMERIC DEFAULT 0,
  maintenance_costs NUMERIC DEFAULT 0,
  depreciation_costs NUMERIC DEFAULT 0,
  other_indirect_costs NUMERIC DEFAULT 0,
  -- Producción
  total_liters_produced NUMERIC DEFAULT 0,
  total_kg_produced NUMERIC DEFAULT 0,
  -- Resultados
  total_direct_costs NUMERIC DEFAULT 0,
  total_indirect_costs NUMERIC DEFAULT 0,
  total_absorbed_cost NUMERIC DEFAULT 0,
  cost_per_liter NUMERIC DEFAULT 0,
  cost_per_kg NUMERIC DEFAULT 0,
  -- Comparativas
  industry_benchmark_cost NUMERIC,
  efficiency_score NUMERIC,
  ai_insights TEXT,
  created_by UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.production_cost_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org cost analysis" ON public.production_cost_analysis
  FOR SELECT USING (organization_id = get_user_organization_id() OR public.is_founder(auth.uid()));

CREATE POLICY "Users can create cost analysis" ON public.production_cost_analysis
  FOR INSERT WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update own cost analysis" ON public.production_cost_analysis
  FOR UPDATE USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete own cost analysis" ON public.production_cost_analysis
  FOR DELETE USING (organization_id = get_user_organization_id());

-- ============================================
-- MÓDULO 3: NÓMINA DE EMPLEADOS
-- ============================================
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  document_id TEXT,
  position TEXT NOT NULL,
  department TEXT,
  hire_date DATE NOT NULL,
  termination_date DATE,
  base_salary NUMERIC NOT NULL DEFAULT 0,
  payment_frequency TEXT DEFAULT 'monthly' CHECK (payment_frequency IN ('weekly', 'biweekly', 'monthly')),
  bank_name TEXT,
  bank_account TEXT,
  phone TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org employees" ON public.employees
  FOR SELECT USING (organization_id = get_user_organization_id() OR public.is_founder(auth.uid()));

CREATE POLICY "Users can manage employees" ON public.employees
  FOR ALL USING (organization_id = get_user_organization_id());

CREATE TABLE public.payroll_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  base_salary NUMERIC NOT NULL DEFAULT 0,
  overtime_hours NUMERIC DEFAULT 0,
  overtime_pay NUMERIC DEFAULT 0,
  bonuses NUMERIC DEFAULT 0,
  bonus_description TEXT,
  deductions NUMERIC DEFAULT 0,
  deduction_description TEXT,
  health_insurance NUMERIC DEFAULT 0,
  pension_contribution NUMERIC DEFAULT 0,
  tax_withholding NUMERIC DEFAULT 0,
  other_deductions NUMERIC DEFAULT 0,
  gross_pay NUMERIC DEFAULT 0,
  net_pay NUMERIC DEFAULT 0,
  payment_date DATE,
  payment_method TEXT,
  payment_reference TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org payroll" ON public.payroll_records
  FOR SELECT USING (organization_id = get_user_organization_id() OR public.is_founder(auth.uid()));

CREATE POLICY "Users can manage payroll" ON public.payroll_records
  FOR ALL USING (organization_id = get_user_organization_id());

-- ============================================
-- MÓDULO 4: FOTOS EN EVENTOS DE SALUD
-- ============================================
ALTER TABLE public.health_events 
ADD COLUMN IF NOT EXISTS photo_urls TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS necropsy_findings TEXT,
ADD COLUMN IF NOT EXISTS cause_of_death TEXT;

-- ============================================
-- MÓDULO 5: BENCHMARKING REGIONAL
-- ============================================
CREATE TABLE public.regional_benchmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  region TEXT NOT NULL,
  country TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_category TEXT NOT NULL CHECK (metric_category IN ('production', 'reproduction', 'health', 'financial')),
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT,
  sample_size INTEGER,
  data_period TEXT,
  source TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insertar benchmarks iniciales para Colombia
INSERT INTO public.regional_benchmarks (region, country, metric_name, metric_category, metric_value, metric_unit, sample_size, data_period, source) VALUES
('Antioquia', 'Colombia', 'avg_milk_liters_day', 'production', 18.5, 'litros/día', 500, '2024', 'FEDEGAN'),
('Antioquia', 'Colombia', 'avg_calving_interval', 'reproduction', 420, 'días', 500, '2024', 'FEDEGAN'),
('Antioquia', 'Colombia', 'avg_daily_weight_gain', 'production', 0.65, 'kg/día', 500, '2024', 'FEDEGAN'),
('Antioquia', 'Colombia', 'mortality_rate', 'health', 3.2, '%', 500, '2024', 'FEDEGAN'),
('Antioquia', 'Colombia', 'conception_rate', 'reproduction', 52, '%', 500, '2024', 'FEDEGAN'),
('Cundinamarca', 'Colombia', 'avg_milk_liters_day', 'production', 16.8, 'litros/día', 450, '2024', 'FEDEGAN'),
('Cundinamarca', 'Colombia', 'avg_calving_interval', 'reproduction', 435, 'días', 450, '2024', 'FEDEGAN'),
('Córdoba', 'Colombia', 'avg_daily_weight_gain', 'production', 0.72, 'kg/día', 600, '2024', 'FEDEGAN'),
('Meta', 'Colombia', 'avg_daily_weight_gain', 'production', 0.68, 'kg/día', 400, '2024', 'FEDEGAN'),
('Nacional', 'Colombia', 'avg_milk_liters_day', 'production', 15.2, 'litros/día', 5000, '2024', 'FEDEGAN'),
('Nacional', 'Colombia', 'avg_calving_interval', 'reproduction', 450, 'días', 5000, '2024', 'FEDEGAN'),
('Nacional', 'Colombia', 'conception_rate', 'reproduction', 48, '%', 5000, '2024', 'FEDEGAN'),
('Nacional', 'Colombia', 'mortality_rate', 'health', 3.8, '%', 5000, '2024', 'FEDEGAN'),
('Nacional', 'Colombia', 'cost_per_liter_milk', 'financial', 850, 'COP', 3000, '2024', 'FEDEGAN'),
('Nacional', 'Colombia', 'cost_per_kg_meat', 'financial', 4200, 'COP', 2000, '2024', 'FEDEGAN');

ALTER TABLE public.regional_benchmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view benchmarks" ON public.regional_benchmarks
  FOR SELECT USING (true);

-- ============================================
-- MÓDULO 6: DASHBOARD DE KPIs CON ALERTAS
-- ============================================
CREATE TABLE public.kpi_thresholds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  kpi_name TEXT NOT NULL,
  kpi_category TEXT NOT NULL CHECK (kpi_category IN ('production', 'reproduction', 'health', 'financial', 'inventory')),
  warning_threshold NUMERIC,
  critical_threshold NUMERIC,
  comparison_operator TEXT DEFAULT 'below' CHECK (comparison_operator IN ('below', 'above')),
  is_active BOOLEAN DEFAULT true,
  notification_channels TEXT[] DEFAULT '{app}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(organization_id, kpi_name)
);

ALTER TABLE public.kpi_thresholds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org thresholds" ON public.kpi_thresholds
  FOR SELECT USING (organization_id = get_user_organization_id() OR public.is_founder(auth.uid()));

CREATE POLICY "Users can manage thresholds" ON public.kpi_thresholds
  FOR ALL USING (organization_id = get_user_organization_id());

-- Insertar KPIs predeterminados para nuevas organizaciones
CREATE OR REPLACE FUNCTION public.create_default_kpi_thresholds()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.kpi_thresholds (organization_id, kpi_name, kpi_category, warning_threshold, critical_threshold, comparison_operator) VALUES
    (NEW.id, 'milk_production_avg', 'production', 12, 8, 'below'),
    (NEW.id, 'daily_weight_gain', 'production', 0.5, 0.3, 'below'),
    (NEW.id, 'calving_interval', 'reproduction', 420, 480, 'above'),
    (NEW.id, 'conception_rate', 'reproduction', 45, 35, 'below'),
    (NEW.id, 'mortality_rate', 'health', 4, 6, 'above'),
    (NEW.id, 'open_days_avg', 'reproduction', 120, 150, 'above'),
    (NEW.id, 'profit_margin', 'financial', 15, 5, 'below'),
    (NEW.id, 'feed_stock_days', 'inventory', 14, 7, 'below');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_organization_created_kpis
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_kpi_thresholds();

-- ============================================
-- MÓDULO 7: AUDITORÍA DE MEDICAMENTOS
-- ============================================
CREATE TABLE public.medication_audit_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  report_name TEXT NOT NULL,
  report_period_start DATE NOT NULL,
  report_period_end DATE NOT NULL,
  certification_standard TEXT, -- 'Bord Bia', 'Global GAP', 'USDA Organic', etc.
  total_treatments INTEGER DEFAULT 0,
  total_animals_treated INTEGER DEFAULT 0,
  total_medications_used INTEGER DEFAULT 0,
  withdrawal_violations INTEGER DEFAULT 0,
  animals_in_withdrawal INTEGER DEFAULT 0,
  report_data JSONB,
  generated_by UUID REFERENCES public.profiles(user_id),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'submitted'))
);

ALTER TABLE public.medication_audit_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org audit reports" ON public.medication_audit_reports
  FOR SELECT USING (organization_id = get_user_organization_id() OR public.is_founder(auth.uid()));

CREATE POLICY "Users can manage audit reports" ON public.medication_audit_reports
  FOR ALL USING (organization_id = get_user_organization_id());

-- ============================================
-- MÓDULO 8: INTEGRACIÓN BÁSCULAS (Metadata)
-- ============================================
CREATE TABLE public.scale_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  scale_brand TEXT NOT NULL,
  scale_model TEXT,
  connection_type TEXT DEFAULT 'bluetooth' CHECK (connection_type IN ('bluetooth', 'usb', 'wifi', 'serial')),
  device_id TEXT,
  last_connected_at TIMESTAMP WITH TIME ZONE,
  calibration_date DATE,
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.scale_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org scales" ON public.scale_integrations
  FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage scales" ON public.scale_integrations
  FOR ALL USING (organization_id = get_user_organization_id());

-- Triggers para updated_at
CREATE TRIGGER update_production_cost_analysis_updated_at
  BEFORE UPDATE ON public.production_cost_analysis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payroll_records_updated_at
  BEFORE UPDATE ON public.payroll_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kpi_thresholds_updated_at
  BEFORE UPDATE ON public.kpi_thresholds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();