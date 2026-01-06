-- Crear enum para roles de usuario
CREATE TYPE public.app_role AS ENUM ('admin', 'ganadero', 'tecnico', 'veterinario');

-- Crear enum para permisos
CREATE TYPE public.permission_type AS ENUM ('read', 'write', 'delete');

-- Tabla de roles de usuario
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'ganadero',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Tabla de permisos por módulo
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  module_name TEXT NOT NULL,
  permission permission_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_name, permission)
);

-- Tabla de registro de actividad (auditoría)
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  module_name TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Agregar campos a profiles para estado de cuenta
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Habilitar RLS en todas las tablas
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Función para verificar si un usuario tiene un rol específico
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Función para verificar si el usuario es admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- Políticas RLS para user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
USING (public.is_admin(auth.uid()));

-- Políticas RLS para user_permissions
CREATE POLICY "Users can view their own permissions"
ON public.user_permissions FOR SELECT
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage permissions"
ON public.user_permissions FOR ALL
USING (public.is_admin(auth.uid()));

-- Políticas RLS para activity_logs
CREATE POLICY "Users can view their own activity"
ON public.activity_logs FOR SELECT
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Authenticated users can insert activity logs"
ON public.activity_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Políticas para que admins puedan ver todos los profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Función para registrar actividad
CREATE OR REPLACE FUNCTION public.log_activity(
  p_action TEXT,
  p_module_name TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.activity_logs (user_id, action, module_name, details)
  VALUES (auth.uid(), p_action, p_module_name, p_details)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- Trigger para asignar rol por defecto al crear usuario
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'ganadero');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();