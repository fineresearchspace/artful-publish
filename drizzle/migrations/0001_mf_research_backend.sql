
CREATE TABLE public.mf_managers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  bio text NOT NULL DEFAULT '',
  experience_years numeric,
  qualifications text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.mf_scheme_managers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scheme_code integer NOT NULL REFERENCES public.mf_schemes(scheme_code) ON DELETE CASCADE,
  manager_id uuid NOT NULL REFERENCES public.mf_managers(id) ON DELETE CASCADE,
  start_date date,
  end_date date,
  role text NOT NULL DEFAULT 'Fund Manager',
  UNIQUE (scheme_code, manager_id, start_date)
);
CREATE TABLE public.mf_factsheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scheme_code integer NOT NULL REFERENCES public.mf_schemes(scheme_code) ON DELETE CASCADE,
  as_of date NOT NULL,
  aum_cr numeric, expense_ratio numeric, exit_load text, benchmark text,
  inception_date date, min_investment numeric, turnover_ratio numeric,
  std_dev numeric, beta numeric, sharpe numeric, pe numeric, pb numeric,
  ytm numeric, modified_duration numeric, macaulay_duration numeric, avg_maturity_yrs numeric,
  equity_pct numeric, debt_pct numeric, cash_pct numeric, other_pct numeric,
  large_cap_pct numeric, mid_cap_pct numeric, small_cap_pct numeric,
  rating_mix jsonb NOT NULL DEFAULT '{}'::jsonb,
  source text NOT NULL DEFAULT 'manual',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scheme_code, as_of)
);
CREATE TABLE public.mf_holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scheme_code integer NOT NULL REFERENCES public.mf_schemes(scheme_code) ON DELETE CASCADE,
  as_of date NOT NULL,
  instrument text NOT NULL,
  isin text, sector text, asset_type text, rating text,
  weight_pct numeric NOT NULL DEFAULT 0,
  market_value_cr numeric, quantity numeric
);
CREATE INDEX mf_holdings_scheme_date ON public.mf_holdings (scheme_code, as_of);
CREATE TABLE public.mf_sector_allocation (
  scheme_code integer NOT NULL REFERENCES public.mf_schemes(scheme_code) ON DELETE CASCADE,
  as_of date NOT NULL,
  sector text NOT NULL,
  weight_pct numeric NOT NULL DEFAULT 0,
  PRIMARY KEY (scheme_code, as_of, sector)
);
CREATE TABLE public.mf_return_metrics (
  scheme_code integer PRIMARY KEY REFERENCES public.mf_schemes(scheme_code) ON DELETE CASCADE,
  as_of date NOT NULL,
  r_1m numeric, r_3m numeric, r_6m numeric, r_1y numeric, r_3y numeric, r_5y numeric, r_10y numeric, r_since numeric,
  rolling_1y_avg numeric, rolling_1y_min numeric, rolling_1y_max numeric, rolling_1y_pos_pct numeric,
  rolling_3y_avg numeric, rolling_3y_min numeric, rolling_3y_max numeric,
  volatility_1y numeric, max_drawdown numeric, sharpe_3y numeric, sortino_3y numeric,
  computed_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.mf_news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scheme_code integer REFERENCES public.mf_schemes(scheme_code) ON DELETE CASCADE,
  fund_house text,
  source_type text NOT NULL CHECK (source_type IN ('news','reddit','twitter')),
  source_name text NOT NULL DEFAULT '',
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  url text NOT NULL,
  author text,
  published_at timestamptz,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (url)
);
CREATE INDEX mf_news_scheme ON public.mf_news (scheme_code, published_at DESC);

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['mf_managers','mf_scheme_managers','mf_factsheets','mf_holdings','mf_sector_allocation','mf_return_metrics','mf_news'] LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Admin reads %s" ON public.%I FOR SELECT TO authenticated USING (public.has_role(auth.uid(), ''admin''::app_role))', t, t);
  END LOOP;
END $$;
