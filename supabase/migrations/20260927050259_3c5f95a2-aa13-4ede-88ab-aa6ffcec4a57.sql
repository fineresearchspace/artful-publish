CREATE UNIQUE INDEX IF NOT EXISTS user_roles_single_admin_idx
ON public.user_roles ((role))
WHERE role = 'admin'::public.app_role;

CREATE OR REPLACE FUNCTION public.grant_first_user_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('the-context-single-owner'));

  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin'::public.app_role) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin'::public.app_role);
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user'::public.app_role);
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_first_user_admin() FROM PUBLIC, anon, authenticated;