DELETE FROM public.articles;

INSERT INTO public.articles (slug, title, subtitle, excerpt, content, category, tags, status, featured, pixel_art_image, reading_time, published_at, substack_url)
VALUES (
  'private-credit-crisis',
  'Private Credit Crisis',
  'The $3.5 trillion crack hiding in plain sight',
  'A slow-motion financial stress is unfolding in a corner of the market most people have never heard of. Here is everything you need to understand it.',
  $md$**The $3.5 trillion crack**: what is the private credit crisis and why should you care?

Imagine a mid-sized company needs ₹500 crore (or roughly $60 million) to expand. It has two usual options: borrow from a bank, or issue bonds that thousands of investors can buy publicly. But what if the bank says no? Or the company is too small for a public bond?

That is where private credit comes in. Private credit is simply a loan made directly between a non-bank fund and a company — no bank, no public market, just a private deal.

The lenders are big asset management funds — names like Apollo, Blackstone, Blue Owl, Ares, and KKR. They raise money from pension funds, insurance companies, and wealthy individuals, then lend it out at high interest rates (typically 8–12% per year).

## Why is it a crisis?

**Problem 1: The liquidity trap**

Investors put money into these funds expecting to be able to take it out every quarter. But the funds lend that money out for 5–7 years at a time. That money is locked away. Illiquidity means you **cannot quickly convert an asset into cash**. They are forced to block withdrawals. This is called **gating**.

> *Gating: when a fund tells investors "sorry, you can only take out 5% of your money right now, not all of it."*

**Problem 2: Rising defaults**

A default happens when a borrower cannot repay a loan. In 2025, according to Fitch Ratings, 9.2% of private credit borrowers defaulted.

**Problem 3: Nobody really knows what these loans are worth**

In a public stock market, prices update every second. Everyone can see them. But private loans have no public price. The fund itself decides what its loans are worth using its own internal calculations. This is called **mark-to-model valuation**.

> *Mark-to-model: pricing an asset using your own mathematical model instead of a real market price. The risk? You might be overstating how healthy your loans are — until reality catches up, suddenly.*

## Why this reaches you

You might be thinking: "I do not own any of these funds, so why does this affect me?" Here is the part most people do not realise.

```
Retail investors & pension funds
↓ invest in
Life insurance companies (Athene, Prudential etc.)
↓ capital goes to
Private credit funds (Apollo, Blackstone, Blue Owl)
↓ make loans to
PE-backed companies (software, tech, mid-market)
↓ some loans packaged into
CLOs / structured credit (new form of MBS)
↓ sold to
Banks, global pension funds, other insurers
```

**Apollo Global Management** owns an insurance company called Athene. KKR owns Global Atlantic. Blackstone manages the portfolios of multiple insurers. Your insurance premiums are being invested in the same private credit loans that are now under stress.

In August 2025, the US government also passed an executive order allowing retirement savings accounts (401k plans) to invest in private credit. In the first half of 2025 alone, retail and high-net-worth investors put $50 billion into private credit funds.

For anyone interested in more stats, here is a link to an interactive dashboard: [click here](https://claude.ai/public/artifacts/13c32045-5b09-4576-a39c-9364e46c9ab7)

---

## Life Update

So... I passed CFA Level 1! Feels good to finally get that out of the way. 😅

But honestly, I am not slowing down — I have been working on something pretty cool: a live market dashboard to help decode what markets are actually telling us. I am playing around with the content, figuring out what makes sense and what is genuinely useful.

The plan is to keep building it out and hopefully take it live on May 01, 2026.

Will keep you all posted as I add more to it. Exciting times ahead 🚀📈$md$,
  'deep-dive',
  ARRAY['private credit','markets','risk','credit'],
  'published_substack',
  true,
  'chart',
  7,
  '2026-04-19T00:00:00Z',
  'https://survivingthe20s.substack.com/p/private-credit-crisis'
);