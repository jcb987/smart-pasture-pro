-- Eliminar políticas restrictivas anteriores
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage permissions" ON public.user_permissions;

-- Nuevas políticas para que usuarios autenticados puedan gestionar roles
CREATE POLICY "Authenticated users can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update roles"
ON public.user_roles FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete roles"
ON public.user_roles FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Políticas para permisos
CREATE POLICY "Authenticated users can view all permissions"
ON public.user_permissions FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert permissions"
ON public.user_permissions FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update permissions"
ON public.user_permissions FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete permissions"
ON public.user_permissions FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Actualizar políticas de profiles para que usuarios autenticados puedan ver y gestionar
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update all profiles"
ON public.profiles FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Política para ver todos los roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Authenticated users can view all roles"
ON public.user_roles FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Política para ver todos los logs de actividad
DROP POLICY IF EXISTS "Users can view their own activity" ON public.activity_logs;
CREATE POLICY "Authenticated users can view all activity"
ON public.activity_logs FOR SELECT
USING (auth.uid() IS NOT NULL);