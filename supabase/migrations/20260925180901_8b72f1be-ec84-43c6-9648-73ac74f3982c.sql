CREATE OR REPLACE FUNCTION public.subscribe_to_newsletter(_email text, _source text DEFAULT 'website')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_email text := lower(trim(_email));
BEGIN
  IF normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' OR length(normalized_email) > 254 THEN
    RAISE EXCEPTION 'Invalid email address';
  END IF;

  INSERT INTO public.subscribers (email, status, source)
  VALUES (normalized_email, 'active', left(coalesce(nullif(trim(_source), ''), 'website'), 80))
  ON CONFLICT (email) DO UPDATE
    SET status = 'active',
        source = CASE
          WHEN public.subscribers.status = 'unsubscribed' THEN EXCLUDED.source
          ELSE public.subscribers.source
        END;
END;
$$;

REVOKE ALL ON FUNCTION public.subscribe_to_newsletter(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.subscribe_to_newsletter(text, text) TO anon, authenticated, service_role;