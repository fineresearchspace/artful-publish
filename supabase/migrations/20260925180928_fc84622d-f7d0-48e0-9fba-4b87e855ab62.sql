REVOKE ALL ON FUNCTION public.subscribe_to_newsletter(text, text) FROM anon, authenticated, service_role;
DROP FUNCTION public.subscribe_to_newsletter(text, text);