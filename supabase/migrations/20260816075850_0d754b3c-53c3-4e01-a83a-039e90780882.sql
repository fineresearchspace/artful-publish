
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- The first account created becomes the site owner/admin.
CREATE OR REPLACE FUNCTION public.grant_first_user_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created_grant_role
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.grant_first_user_admin();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are public" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Untitled',
  slug text NOT NULL UNIQUE,
  subtitle text NOT NULL DEFAULT '',
  excerpt text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  cover_image text,
  pixel_art_image text NOT NULL DEFAULT 'chart',
  category text NOT NULL DEFAULT 'Ideas',
  tags text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','ready','published_web','published_substack','failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  substack_url text,
  substack_post_id text,
  reading_time integer NOT NULL DEFAULT 5,
  featured boolean NOT NULL DEFAULT false,
  view_count integer NOT NULL DEFAULT 0
);
CREATE INDEX articles_status_idx ON public.articles (status);
CREATE INDEX articles_published_at_idx ON public.articles (published_at DESC);
GRANT SELECT ON public.articles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.articles TO authenticated;
GRANT ALL ON public.articles TO service_role;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published articles are public" ON public.articles FOR SELECT
  USING (status IN ('published_web','published_substack'));
CREATE POLICY "Admins read all articles" ON public.articles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage articles" ON public.articles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER articles_updated_at BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.increment_article_view(_slug text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.articles SET view_count = view_count + 1
  WHERE slug = _slug AND status IN ('published_web','published_substack');
$$;
GRANT EXECUTE ON FUNCTION public.increment_article_view(text) TO anon, authenticated;

INSERT INTO public.categories (name, slug, description, sort_order) VALUES
  ('Market This Week','market-this-week','What moved, and what it might mean.',1),
  ('Back to Basics','back-to-basics','Foundations worth revisiting.',2),
  ('Mindset Minute','mindset-minute','Short notes on thinking clearly.',3),
  ('Deep Dive','deep-dive','Longer investigations.',4),
  ('Ideas','ideas','Loose threads worth pulling.',5),
  ('Finance','finance','Money, rates, and plumbing.',6),
  ('Business','business','How companies actually work.',7);

INSERT INTO public.articles (title, slug, subtitle, excerpt, content, pixel_art_image, category, tags, status, published_at, reading_time, featured, view_count) VALUES
('The Thing Nobody Tells You About Compounding','the-thing-nobody-tells-you-about-compounding','Why the boring middle years decide everything','Compounding is not a curve you ride. It is a queue you wait in, and almost nobody waits long enough.',
'## The boring middle

Everyone has seen the chart. A line that crawls along the bottom for a decade and then goes vertical. What the chart hides is what the crawl *feels* like.

For the first ten years, compounding looks like a rounding error. You add money, the number moves a little, and nothing about your life changes. That is the actual product being sold: a decade of nothing in exchange for a decade of everything.

> Most people do not fail at compounding because the maths is hard. They fail because the maths is slow.

### What actually breaks

- A job change that pauses contributions for two years
- A market drop in year six that feels personal
- A better idea in year eight

Each one is reasonable in isolation. Together they cut the tail off the curve.

### The practical version

1. Automate the contribution so it is not a decision.
2. Make the account boring and hard to check.
3. Judge yourself on contributions, not returns.

None of this is clever. That is rather the point.','chart','Mindset Minute','{"compounding","patience","investing"}','published_web', now() - interval '2 days', 6, true, 412),

('Why Markets Don''t Always Do What You Expect','why-markets-dont-always-do-what-you-expect','Good news, falling prices, and the gap in between','Markets price expectations, not events. Once you internalise that, half the confusing headlines stop being confusing.',
'## Expectations are the real asset

A company reports record profits and the stock falls nine percent. The headline calls this irrational. It is nothing of the sort.

The price already contained a forecast. The report was measured against that forecast, not against zero.

### Three habits that help

- Ask what was already expected before asking what happened
- Watch the change in expectations, not the level of the news
- Treat surprise, not quality, as the driver of short-term moves

| Event | Naive read | Market read |
| --- | --- | --- |
| Record profit | Bullish | Below whisper number |
| Rate cut | Bullish | Growth is deteriorating |
| Layoffs | Bearish | Margin discipline |

None of these are rules. They are reminders that the market is a second-order machine.','newspaper','Market This Week','{"markets","expectations"}','published_substack', now() - interval '9 days', 5, false, 288),

('What Interest Rates Actually Are','what-interest-rates-actually-are','A price, not a policy','Rates get discussed as a lever a committee pulls. It is more useful to think of them as the price of patience.',
'## The price of time

An interest rate is what someone charges you for having money now instead of later. Everything else — central banks, curves, spreads — is commentary on that single idea.

### Why it matters everywhere

When the price of time changes, the value of every future thing changes with it. A company whose profits arrive in 2035 is worth much less when patience gets expensive.

- Long-dated assets move most
- Debt-heavy businesses move next
- Cash-generating boring businesses move least

That is the whole transmission mechanism in three lines.','portfolio','Back to Basics','{"rates","macro","basics"}','published_web', now() - interval '16 days', 7, false, 173),

('The Quiet Economics of a Coffee Shop','the-quiet-economics-of-a-coffee-shop','Unit economics you can see from the queue','You can learn more about business from twenty minutes in a cafe than from most annual reports.',
'## Count the cups

Stand in a cafe and count. Cups per hour, average ticket, staff on shift, rent implied by the street. Within twenty minutes you have a rough profit and loss account.

### The three levers

1. **Traffic** — how many people come in
2. **Ticket** — what they spend
3. **Throughput** — how fast you serve them

Almost every cafe improvement is one of these three wearing a costume. A new pastry case is a ticket play. A second till is throughput.

> Businesses are simpler than their language suggests, and harder than their spreadsheets suggest.','office','Business','{"business","unit economics"}','published_web', now() - interval '23 days', 6, false, 141),

('Reading a Balance Sheet Like a Suspicious Person','reading-a-balance-sheet-like-a-suspicious-person','Where the interesting things hide','A balance sheet is a snapshot taken by someone who chose the angle. Read it accordingly.',
'## Start at the bottom

Most people read top down and get tired. Start at the bottom, where the awkward items live: deferred revenue, provisions, related-party balances.

### A short checklist

- Does cash move like profit says it should?
- Are receivables growing faster than sales?
- What changed in the footnotes since last year?

Nothing here requires an accounting degree. It requires reading the same document twice, once for the story and once for the seams.','portfolio','Deep Dive','{"accounting","analysis"}','published_web', now() - interval '31 days', 9, false, 96),

('On Changing Your Mind in Public','on-changing-your-mind-in-public','The cheapest edge left','Being wrong quickly is a competitive advantage that almost nobody wants.',
'## Cheap updates

The cost of holding a bad view is not the view. It is the months of decisions made downstream of it.

### How to make it cheaper

- Write down what would change your mind, in advance
- Date your opinions
- Say "I was wrong about X" out loud once a quarter

It stings for an afternoon and saves years.','thinking','Ideas','{"mental models","thinking"}','published_web', now() - interval '38 days', 4, false, 205);
