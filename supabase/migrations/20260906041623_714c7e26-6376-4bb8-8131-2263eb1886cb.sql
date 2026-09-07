CREATE TABLE IF NOT EXISTS public.subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid(),
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscribers TO authenticated;
GRANT ALL ON public.subscribers TO service_role;

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage subscribers" ON public.subscribers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.newsletter_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid REFERENCES public.articles(id) ON DELETE SET NULL,
  subject text NOT NULL,
  recipient_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  sent_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.newsletter_sends TO authenticated;
GRANT ALL ON public.newsletter_sends TO service_role;

ALTER TABLE public.newsletter_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read newsletter sends" ON public.newsletter_sends FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));