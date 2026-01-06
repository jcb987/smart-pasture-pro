-- Create financial transactions table for incomes and expenses
CREATE TABLE public.financial_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('ingreso', 'egreso')),
  category TEXT NOT NULL,
  subcategory TEXT,
  amount NUMERIC NOT NULL,
  description TEXT,
  animal_id UUID REFERENCES public.animals(id) ON DELETE SET NULL,
  lot_name TEXT,
  payment_method TEXT,
  reference_number TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view financial transactions in their organization"
ON public.financial_transactions FOR SELECT
USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert financial transactions in their organization"
ON public.financial_transactions FOR INSERT
WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update financial transactions in their organization"
ON public.financial_transactions FOR UPDATE
USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete financial transactions in their organization"
ON public.financial_transactions FOR DELETE
USING (organization_id = get_user_organization_id());

-- Create trigger for updated_at
CREATE TRIGGER update_financial_transactions_updated_at
BEFORE UPDATE ON public.financial_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create financial budgets table for projections
CREATE TABLE public.financial_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  category TEXT NOT NULL,
  budgeted_amount NUMERIC NOT NULL,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financial_budgets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view budgets in their organization"
ON public.financial_budgets FOR SELECT
USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage budgets in their organization"
ON public.financial_budgets FOR ALL
USING (organization_id = get_user_organization_id());