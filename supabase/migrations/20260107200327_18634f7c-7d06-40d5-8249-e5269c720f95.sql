-- Create founder_access_logs table to track all founder actions
CREATE TABLE public.founder_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  founder_user_id UUID NOT NULL,
  target_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  target_user_id UUID,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.founder_access_logs ENABLE ROW LEVEL SECURITY;

-- Only founders can view logs
CREATE POLICY "Founders can view all access logs"
ON public.founder_access_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'founder'));

-- Only founders can insert logs
CREATE POLICY "Founders can insert access logs"
ON public.founder_access_logs
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'founder'));

-- Create function to check if user is founder
CREATE OR REPLACE FUNCTION public.is_founder(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'founder'
  )
$$;

-- Create function to log founder access
CREATE OR REPLACE FUNCTION public.log_founder_access(
  p_target_org_id uuid DEFAULT NULL,
  p_target_user_id uuid DEFAULT NULL,
  p_action text DEFAULT 'view',
  p_details jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF NOT public.is_founder(auth.uid()) THEN
    RAISE EXCEPTION 'Only founders can log access';
  END IF;

  INSERT INTO public.founder_access_logs (
    founder_user_id,
    target_organization_id,
    target_user_id,
    action,
    details
  )
  VALUES (
    auth.uid(),
    p_target_org_id,
    p_target_user_id,
    p_action,
    p_details
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- Founder policies for profiles
CREATE POLICY "Founders can view all profiles"
ON public.profiles FOR SELECT
USING (public.is_founder(auth.uid()));

CREATE POLICY "Founders can update all profiles"
ON public.profiles FOR UPDATE
USING (public.is_founder(auth.uid()));

-- Founder policies for organizations
CREATE POLICY "Founders can view all organizations"
ON public.organizations FOR SELECT
USING (public.is_founder(auth.uid()));

-- Founder policies for user_onboarding
CREATE POLICY "Founders can view all onboarding"
ON public.user_onboarding FOR SELECT
USING (public.is_founder(auth.uid()));

-- Founder policies for animals
CREATE POLICY "Founders can view all animals"
ON public.animals FOR SELECT
USING (public.is_founder(auth.uid()));

CREATE POLICY "Founders can update all animals"
ON public.animals FOR UPDATE
USING (public.is_founder(auth.uid()));

-- Founder policies for activity_logs
CREATE POLICY "Founders can view all activity logs"
ON public.activity_logs FOR SELECT
USING (public.is_founder(auth.uid()));

-- Founder policies for user_roles
CREATE POLICY "Founders can view all user roles"
ON public.user_roles FOR SELECT
USING (public.is_founder(auth.uid()));