CREATE TABLE public.mf_category_guide (
  category_key text PRIMARY KEY,
  asset_class text NOT NULL,
  sebi_definition text NOT NULL DEFAULT '',
  explainer text NOT NULL DEFAULT '',
  equity_min numeric, equity_max numeric, debt_min numeric, debt_max numeric,
  benchmark_name text, benchmark_proxy_query text,
  match_terms text[] NOT NULL DEFAULT '{}'
);
CREATE TABLE public.mf_amfi_monthly (
  month date NOT NULL,
  category text NOT NULL,
  schemes integer, folios bigint,
  funds_mobilized_cr numeric, redemption_cr numeric, net_inflow_cr numeric,
  aum_cr numeric, avg_aum_cr numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (month, category)
);
CREATE TABLE public.mf_amfi_industry_monthly (
  month date PRIMARY KEY,
  sip_contribution_cr numeric, sip_accounts bigint, sip_aum_cr numeric,
  total_aum_cr numeric, total_folios bigint, net_inflow_cr numeric,
  notes text NOT NULL DEFAULT ''
);
CREATE TABLE public.mf_daily_fund_watch (
  as_of date NOT NULL,
  sheet_category text NOT NULL,
  plan text NOT NULL DEFAULT 'Direct',
  scheme_name text NOT NULL,
  scheme_code integer REFERENCES public.mf_schemes(scheme_code) ON DELETE SET NULL,
  launch_date date, aum_cr numeric, nav numeric,
  avg_maturity_yrs numeric, ytm numeric, modified_duration numeric, macaulay_duration numeric,
  returns jsonb NOT NULL DEFAULT '{}'::jsonb,
  source text NOT NULL DEFAULT 'upload',
  PRIMARY KEY (as_of, sheet_category, plan, scheme_name)
);
CREATE INDEX mf_dfw_cat ON public.mf_daily_fund_watch (sheet_category, as_of DESC);

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['mf_category_guide','mf_amfi_monthly','mf_amfi_industry_monthly','mf_daily_fund_watch'] LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Admin reads %s" ON public.%I FOR SELECT TO authenticated USING (public.has_role(auth.uid(), ''admin''::public.app_role))', t, t);
  END LOOP;
END $$;

INSERT INTO public.mf_category_guide (category_key, asset_class, sebi_definition, explainer, equity_min, equity_max, debt_min, debt_max, benchmark_name, benchmark_proxy_query, match_terms) VALUES
('Large Cap','Equity','Min 80% in large caps (top 100 stocks)','Blue-chip exposure; lowest equity volatility, hard to beat the index.',80,100,0,20,'Nifty 100 TRI','Nifty 100 Index Fund Direct','{Large Cap Fund}'),
('Large & Mid Cap','Equity','Min 35% large caps and min 35% mid caps','Blend of stability and growth.',70,100,0,30,'Nifty LargeMidcap 250 TRI','LargeMidcap 250 Index Fund Direct','{Large & Mid Cap}'),
('Mid Cap','Equity','Min 65% in mid caps (101-250)','Higher growth, deeper drawdowns.',65,100,0,35,'Nifty Midcap 150 TRI','Midcap 150 Index Fund Direct','{Mid Cap Fund}'),
('Small Cap','Equity','Min 65% in small caps (251+)','Highest equity risk/reward; liquidity matters.',65,100,0,35,'Nifty Smallcap 250 TRI','Smallcap 250 Index Fund Direct','{Small Cap Fund}'),
('Multi Cap','Equity','Min 25% each in large, mid and small caps','Forced diversification across sizes.',75,100,0,25,'Nifty 500 Multicap 50:25:25 TRI','Nifty 500 Index Fund Direct','{Multi Cap Fund}'),
('Flexi Cap','Equity','Min 65% equity, no market-cap limits','Manager freely moves across sizes.',65,100,0,35,'Nifty 500 TRI','Nifty 500 Index Fund Direct','{Flexi Cap Fund}'),
('Focused','Equity','Max 30 stocks, min 65% equity','Concentrated high-conviction portfolio.',65,100,0,35,'Nifty 500 TRI','Nifty 500 Index Fund Direct','{Focused Fund}'),
('Value / Contra','Equity','Min 65% equity following value or contrarian strategy','Buys out-of-favour or cheap stocks.',65,100,0,35,'Nifty 500 TRI','Nifty 500 Index Fund Direct','{Value Fund,Contra Fund}'),
('Dividend Yield','Equity','Min 65% in dividend-yielding stocks','Income-tilted equity.',65,100,0,35,'Nifty 500 TRI','Nifty 500 Index Fund Direct','{Dividend Yield}'),
('Sectoral / Thematic','Equity','Min 80% in one sector or theme','Concentrated bets; high cyclicality.',80,100,0,20,'Relevant sector TRI',NULL,'{Sectoral,Thematic}'),
('ELSS','Equity','Min 80% equity, 3-year lock-in, tax benefit (old regime)','Tax-saving equity fund.',80,100,0,20,'Nifty 500 TRI','Nifty 500 Index Fund Direct','{ELSS}'),
('Overnight','Debt','Securities maturing in 1 day','Near-zero risk parking.',0,0,100,100,'CRISIL Liquid Overnight Index','Overnight Fund Direct','{Overnight Fund}'),
('Liquid','Debt','Securities up to 91 days maturity','Cash management, T+1 redemption.',0,0,100,100,'CRISIL Liquid Debt A-I Index','Liquid Fund Direct','{Liquid Fund}'),
('Ultra Short Duration','Debt','Macaulay duration 3-6 months','Slightly more yield than liquid.',0,0,100,100,'CRISIL Ultra Short Duration Index',NULL,'{Ultra Short}'),
('Low Duration','Debt','Macaulay duration 6-12 months','Short parking 6-12 months.',0,0,100,100,'CRISIL Low Duration Index',NULL,'{Low Duration,Ultra Short to Short}'),
('Money Market','Debt','Money market instruments up to 1 year','CPs, CDs, T-bills.',0,0,100,100,'CRISIL Money Market Index',NULL,'{Money Market}'),
('Short Duration','Debt','Macaulay duration 1-3 years','Moderate rate sensitivity.',0,0,100,100,'CRISIL Short Duration Debt Index',NULL,'{Short Duration,Short Term Fund}'),
('Medium Duration','Debt','Macaulay duration 3-4 years','Higher duration and credit play.',0,0,100,100,'CRISIL Medium Duration Index',NULL,'{Medium Duration,Medium Term Fund}'),
('Medium to Long Duration','Debt','Macaulay duration 4-7 years','Interest-rate call.',0,0,100,100,'CRISIL Medium to Long Duration Index',NULL,'{Medium to Long}'),
('Long Duration','Debt','Macaulay duration over 7 years','Most sensitive to rate cuts/hikes.',0,0,100,100,'CRISIL Long Duration Index',NULL,'{Long Duration,Long Term Fund}'),
('Dynamic Bond','Debt','Duration managed freely','Manager times rate cycle.',0,0,100,100,'CRISIL Dynamic Bond Index',NULL,'{Dynamic Bond,Dynamic Term}'),
('Corporate Bond','Debt','Min 80% in AA+ and above corporate bonds','High-quality corporate credit.',0,0,100,100,'CRISIL Corporate Bond Index',NULL,'{Corporate Bond}'),
('Credit Risk','Debt','Min 65% in AA and below','Extra yield for credit risk.',0,0,100,100,'CRISIL Credit Risk Index',NULL,'{Credit Risk}'),
('Banking & PSU','Debt','Min 80% in banks, PSUs, PFIs','Quasi-sovereign quality.',0,0,100,100,'CRISIL Banking and PSU Index',NULL,'{Banking and PSU}'),
('Gilt','Debt','Min 80% in government securities','No credit risk, full rate risk.',0,0,100,100,'CRISIL Dynamic Gilt Index',NULL,'{Gilt Fund}'),
('Gilt 10Y Constant Maturity','Debt','Min 80% G-secs, ~10y maturity','Pure 10-year G-sec exposure.',0,0,100,100,'CRISIL 10 Year Gilt Index',NULL,'{10-year Constant,10 years}'),
('Floater','Debt','Min 65% floating-rate instruments','Benefits when rates rise.',0,0,100,100,'CRISIL Short Term Floating Index',NULL,'{Floater,Floating}'),
('Conservative Hybrid','Hybrid','10-25% equity, 75-90% debt','Debt-plus with equity kicker.',10,25,75,90,'CRISIL Hybrid 85+15 Conservative Index',NULL,'{Conservative Hybrid}'),
('Balanced Hybrid','Hybrid','40-60% equity, 40-60% debt, no arbitrage','Even split.',40,60,40,60,'CRISIL Hybrid 50+50 Index',NULL,'{Balanced Hybrid}'),
('Aggressive Hybrid','Hybrid','65-80% equity, 20-35% debt','Equity-taxed hybrid.',65,80,20,35,'CRISIL Hybrid 35+65 Aggressive Index',NULL,'{Aggressive Hybrid}'),
('Balanced Advantage','Hybrid','Equity/debt dynamically managed (0-100%)','Valuation-driven equity allocation, uses hedges.',0,100,0,100,'CRISIL Hybrid 50+50 Index',NULL,'{Balanced Advantage,Dynamic Asset Allocation}'),
('Multi Asset','Hybrid','Min 10% each in 3+ asset classes','Equity, debt and gold/silver.',10,80,10,80,'Custom multi-asset benchmark',NULL,'{Multi Asset}'),
('Arbitrage','Hybrid','Min 65% in equity arbitrage (hedged)','Buys stock in cash market and sells futures; captures the spread, near-debt returns with equity taxation.',65,100,0,35,'Nifty 50 Arbitrage Index','Arbitrage Fund Direct','{Arbitrage}'),
('Equity Savings','Hybrid','Min 65% equity (incl. hedged), min 10% debt','Low net equity, mix of arbitrage and debt.',65,90,10,35,'Nifty Equity Savings Index',NULL,'{Equity Savings}'),
('Index Funds / ETFs','Other','Track an index','Passive, low cost.',NULL,NULL,NULL,NULL,'Underlying index',NULL,'{Index Fund,ETF}'),
('Fund of Funds','Other','Invests in other funds','Domestic or overseas.',NULL,NULL,NULL,NULL,'Underlying',NULL,'{FoF,Fund of Funds}');