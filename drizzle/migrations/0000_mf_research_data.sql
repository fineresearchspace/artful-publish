CREATE TABLE public.mf_schemes (
  scheme_code integer PRIMARY KEY,
  isin_growth text,
  isin_reinvest text,
  scheme_name text NOT NULL,
  fund_house text,
  scheme_type text,
  category text,
  plan text,
  option_type text,
  latest_nav numeric,
  nav_date date,
  history_synced_at timestamptz,
  history_start date,
  history_points integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX mf_schemes_category_idx ON public.mf_schemes (category);
CREATE INDEX mf_schemes_house_idx ON public.mf_schemes (fund_house);
GRANT SELECT ON public.mf_schemes TO authenticated;
GRANT ALL ON public.mf_schemes TO service_role;
ALTER TABLE public.mf_schemes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin reads schemes" ON public.mf_schemes FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE public.mf_nav_history (
  scheme_code integer NOT NULL REFERENCES public.mf_schemes(scheme_code) ON DELETE CASCADE,
  nav_date date NOT NULL,
  nav numeric NOT NULL,
  PRIMARY KEY (scheme_code, nav_date)
);
GRANT SELECT ON public.mf_nav_history TO authenticated;
GRANT ALL ON public.mf_nav_history TO service_role;
ALTER TABLE public.mf_nav_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin reads nav history" ON public.mf_nav_history FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE public.mf_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  rows_written integer NOT NULL DEFAULT 0,
  detail text NOT NULL DEFAULT '',
  ok boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mf_sync_runs TO authenticated;
GRANT ALL ON public.mf_sync_runs TO service_role;
ALTER TABLE public.mf_sync_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin reads sync runs" ON public.mf_sync_runs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));