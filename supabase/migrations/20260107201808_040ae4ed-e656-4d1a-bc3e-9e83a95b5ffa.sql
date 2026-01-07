INSERT INTO public.user_roles (user_id, role, organization_id)
VALUES ('c5c4b597-607b-4267-af71-23b1bb53020d', 'founder', NULL)
ON CONFLICT (user_id, role) DO NOTHING;