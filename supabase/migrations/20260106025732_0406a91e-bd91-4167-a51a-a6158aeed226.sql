-- Crear tabla de organizaciones/fincas
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Agregar organization_id a profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Agregar organization_id a user_roles
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Agregar organization_id a user_permissions
ALTER TABLE public.user_permissions 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Agregar organization_id a activity_logs
ALTER TABLE public.activity_logs 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Habilitar RLS en organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Función para obtener la organización del usuario actual
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
$$;

-- Políticas para organizations - solo el dueño puede ver su organización
CREATE POLICY "Users can view their own organization"
ON public.organizations FOR SELECT
USING (owner_id = auth.uid() OR id = public.get_user_organization_id());

CREATE POLICY "Users can create their own organization"
ON public.organizations FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their organization"
ON public.organizations FOR UPDATE
USING (owner_id = auth.uid());

-- Eliminar políticas anteriores de profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can update all profiles" ON public.profiles;

-- Nuevas políticas para profiles - solo ver usuarios de mi organización
CREATE POLICY "Users can view profiles in their organization"
ON public.profiles FOR SELECT
USING (
  organization_id = public.get_user_organization_id() 
  OR user_id = auth.uid()
  OR organization_id IS NULL AND user_id = auth.uid()
);

CREATE POLICY "Users can insert profiles in their organization"
ON public.profiles FOR INSERT
WITH CHECK (
  organization_id = public.get_user_organization_id()
  OR user_id = auth.uid()
);

CREATE POLICY "Users can update profiles in their organization"
ON public.profiles FOR UPDATE
USING (
  organization_id = public.get_user_organization_id()
  OR user_id = auth.uid()
);

-- Eliminar políticas anteriores de user_roles
DROP POLICY IF EXISTS "Authenticated users can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can delete roles" ON public.user_roles;

-- Nuevas políticas para user_roles - solo mi organización
CREATE POLICY "Users can view roles in their organization"
ON public.user_roles FOR SELECT
USING (organization_id = public.get_user_organization_id() OR user_id = auth.uid());

CREATE POLICY "Users can insert roles in their organization"
ON public.user_roles FOR INSERT
WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can update roles in their organization"
ON public.user_roles FOR UPDATE
USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can delete roles in their organization"
ON public.user_roles FOR DELETE
USING (organization_id = public.get_user_organization_id());

-- Eliminar políticas anteriores de user_permissions
DROP POLICY IF EXISTS "Authenticated users can view all permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Authenticated users can insert permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Authenticated users can update permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Authenticated users can delete permissions" ON public.user_permissions;

-- Nuevas políticas para user_permissions - solo mi organización
CREATE POLICY "Users can view permissions in their organization"
ON public.user_permissions FOR SELECT
USING (organization_id = public.get_user_organization_id() OR user_id = auth.uid());

CREATE POLICY "Users can manage permissions in their organization"
ON public.user_permissions FOR ALL
USING (organization_id = public.get_user_organization_id());

-- Eliminar políticas anteriores de activity_logs
DROP POLICY IF EXISTS "Authenticated users can view all activity" ON public.activity_logs;
DROP POLICY IF EXISTS "Authenticated users can insert activity logs" ON public.activity_logs;

-- Nuevas políticas para activity_logs - solo mi organización
CREATE POLICY "Users can view activity in their organization"
ON public.activity_logs FOR SELECT
USING (organization_id = public.get_user_organization_id() OR user_id = auth.uid());

CREATE POLICY "Users can insert activity in their organization"
ON public.activity_logs FOR INSERT
WITH CHECK (organization_id = public.get_user_organization_id() OR user_id = auth.uid());

-- Actualizar trigger para crear organización automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Crear organización para el nuevo usuario
  INSERT INTO public.organizations (name, owner_id)
  VALUES (COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Mi Finca'), NEW.id)
  RETURNING id INTO new_org_id;
  
  -- Crear perfil con la organización
  INSERT INTO public.profiles (user_id, full_name, organization_id)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', new_org_id);
  
  RETURN NEW;
END;
$$;

-- Actualizar trigger de roles para incluir organization_id
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id UUID;
BEGIN
  -- Obtener organization_id del perfil
  SELECT organization_id INTO org_id FROM public.profiles WHERE user_id = NEW.id;
  
  -- Asignar rol de admin (dueño) al creador de la cuenta
  INSERT INTO public.user_roles (user_id, role, organization_id)
  VALUES (NEW.id, 'admin', org_id);
  
  RETURN NEW;
END;
$$;