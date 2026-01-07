-- Asignar rol founder a Jeronimo Corcho
INSERT INTO public.user_roles (user_id, role, organization_id)
VALUES ('b5693fdd-6ccb-4579-b2be-b1b9f0f85d00', 'founder', NULL)
ON CONFLICT (user_id, role) DO NOTHING;

-- Asignar rol founder a Tomas Hoyos
INSERT INTO public.user_roles (user_id, role, organization_id)
VALUES ('6683bb66-4280-445c-a6fe-7d1d8ee55cc3', 'founder', NULL)
ON CONFLICT (user_id, role) DO NOTHING;