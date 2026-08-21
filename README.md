# Wonder Studio

Build: Weekly Wonders — Pixel-Art Publication & Publishing Dashboard

Build a polished personal publishing platform for my newsletter “Weekly Wonders.”

The website should combine:

A public-facing pixel-art gallery of my articles.

A private/admin dashboard where I can write and manage articles.

A publishing workflow designed to send/publish finished articles through my existing Substack channel.

A beautiful archive that makes my writing feel like a collection rather than a traditional blog.

Overall concept

Think:

Pixel-art magazine + personal research archive + writing studio.

The visual identity should feel like an old-school pixel computer interface, but modern, clean, sophisticated and finance-focused, not childish or overly gamified.

Use subtle pixel-art aesthetics rather than turning the entire interface into a retro video game.

1. Public Homepage

Create a homepage for Weekly Wonders.

Hero section:

WEEKLY WONDERS

A short tagline:

Curious ideas about markets, money, business and the world around them.

Add a small pixel-art animated/interactive visual around the title.

Below the hero, show my articles as a gallery/grid of pixel-art cards.

Each article card should contain:

Pixel-art thumbnail/illustration

Article title

Short description

Category

Publication date

Reading time

Small “Read →” button

Example categories:

Market This Week

Back to Basics

Mindset Minute

Deep Dive

Ideas

Finance

Business

Allow category filtering.

2. Pixel Article Gallery

The article archive should be the central visual feature.

Use a responsive grid.

Each article should feel like a collectible card.

Example:

┌─────────────────────────────┐
│ │
│ PIXEL ART IMAGE │
│ │
├─────────────────────────────┤
│ MARKET THIS WEEK │
│ │
│ Why Markets Don't Always │
│ Do What You Expect │
│ │
│ 6 min read · Aug 16, 2026 │
│ │
│ READ ARTICLE → │
└─────────────────────────────┘

Cards should have subtle hover effects:

slight pixel-style movement

image zoom

border animation

shadow

title movement

Do NOT make the animations excessive.

3. Article Page

When someone clicks an article, open a beautiful reading page.

Layout:

Article title

Subtitle/deck

Category

Date

Reading time

Hero pixel illustration

Article content

Related articles at bottom

Make the reading experience extremely clean.

The pixel aesthetic should be mostly around:

headers

borders

illustrations

buttons

navigation

The actual article typography should remain highly readable.

Include:

desktop reading width

mobile optimization

table support

image support

quote blocks

bullet lists

links

headings

bold/italic

embedded charts

4. Admin / Writing Studio

Create a private /admin dashboard.

This should be my personal writing workspace.

Dashboard navigation:

Dashboard

Write

Articles

Drafts

Published

Categories

Settings

The dashboard should show:

Overview

Total articles

Drafts

Published articles

Scheduled articles

Total views if available

Most-read article

Recent articles

5. Writing Editor

Create a proper article editor.

I want to be able to:

Create article

Edit article

Save draft

Preview

Add cover image

Add pixel-art thumbnail

Select category

Add tags

Add excerpt

Add publication date

Add reading time

Save automatically

Editor should support:

H1/H2/H3

bold

italic

links

bullets

numbered lists

quotes

images

tables

code blocks if necessary

horizontal separators

Add a Markdown mode if practical.

Also include a live preview showing exactly how the article will appear on the public website.

6. Substack Publishing Workflow

This is extremely important.

I already have an existing Substack publication/channel.

The goal is:

Write once → publish/manage from my own platform → send through my existing Substack publication.

Investigate whether Substack currently provides an official public publishing API that allows authenticated creation/publication of posts.

DO NOT invent an API endpoint.

If an official API is available:

create a secure Substack integration

use OAuth/API authentication where supported

allow me to connect my Substack account

allow selecting the publication

add a “Publish to Substack” button

send title

subtitle

article content

images

tags/category where supported

publication status

publication date

canonical URL if supported

Publishing flow:

SAVE DRAFT
↓
PREVIEW
↓
PUBLISH TO SUBSTACK
↓
CONFIRM
↓
POST APPEARS ON MY SUBSTACK

If direct publishing is NOT supported by Substack's available APIs:

Do NOT fake the integration.

Instead build the architecture so the publishing integration can be added later and provide a practical fallback:

“Export for Substack”

This should generate/copy the article in a format that can be pasted into Substack with minimal cleanup.

Ideally:

Copy formatted article

Download Markdown

Download HTML

Copy title

Copy subtitle

Copy tags

Copy excerpt

The UI should clearly indicate whether the article was:

Draft

Ready to publish

Published to website

Published to Substack

7. Article Database

Create a database for articles.

Suggested schema:

Article:

id

title

slug

subtitle

excerpt

content

cover_image

pixel_art_image

category

tags

status

created_at

updated_at

published_at

substack_url

substack_post_id

reading_time

featured

view_count

Categories should be editable from the admin panel.

8. Sync With Substack

If Substack provides a supported way to retrieve publication posts:

Add:

SYNC SUBSTACK

This should import existing articles into my website.

Imported articles should include:

title

URL

publication date

content if legally/technically accessible

image

category where possible

If full content cannot be imported, store the metadata and link directly to Substack.

Avoid duplicating content unnecessarily.

9. Navigation

Public navigation:

WEEKLY WONDERS

Home
Articles
Categories
About

Add a prominent:

READ ON SUBSTACK →

button.

Also include:

Newsletter →

which should link to my existing Substack subscription page.

10. About Page

Create a simple About page.

It should explain:

Weekly Wonders

A personal publication exploring:

markets

finance

business

investing

interesting ideas

mental models

things worth understanding

Keep it personal and understated.

11. Search

Add article search.

Search should work across:

title

subtitle

excerpt

tags

categories

article content

Create a clean pixel-style search bar.

12. Featured Article

Allow me to mark an article as:

FEATURED

The homepage should prominently display the featured article above the archive.

Example:

FEATURED WONDER

[large pixel illustration]

The Thing Nobody Tells You About Compounding

6 min read

READ →

13. Visual Design

Color palette:

Primarily:

off-white / warm cream

black

dark charcoal

muted green

subtle yellow accents

Avoid overly bright neon colors.

Typography:

Use a combination of:

pixel-inspired font for small labels, buttons and decorative headings

highly readable modern serif/sans-serif for article content

The website should feel like:

Bloomberg × indie magazine × pixel computer

rather than:

8-bit video game website.

Use subtle CRT/pixel textures where appropriate.

14. Pixel-Art Illustrations

For every article, allow me to upload a custom image.

Also create a system where each article can have a simple pixel-art visual.

Examples:

Market article → pixel stock chart

Economics article → pixel newspaper

Investing article → pixel portfolio

Mindset article → pixel person thinking

Business article → pixel office/building

Keep illustrations consistent so the entire publication develops a recognizable visual language.

15. Responsive Design

The site must work beautifully on:

desktop

laptop

tablet

mobile

On mobile, the article cards should become a single-column feed.

The writing dashboard should also be usable on mobile, although desktop is the primary writing environment.

16. Authentication

The public website is accessible to everyone.

The admin dashboard must be private.

Use secure authentication.

Only I should be able to:

create articles

edit articles

delete articles

publish

connect Substack

modify settings

Do not expose admin APIs publicly.

17. SEO

Implement:

clean URLs

article slugs

metadata

Open Graph images

Twitter/X cards

sitemap

robots.txt

canonical URLs

structured article metadata

Each article should have a shareable URL.

Example:

/articles/why-markets-dont-always-make-sense

18. Analytics

Create basic analytics for my own website:

article views

most viewed articles

views over time

traffic source if available

Do not make analytics the main focus.

The writing and archive are the priority.

19. Architecture

Use a modern production-ready architecture.

Preferred:

Frontend:

React

TypeScript

Tailwind CSS

Backend/database:

Supabase or PostgreSQL

Authentication:

Supabase Auth or equivalent

Storage:

Supabase Storage or equivalent for article images

Use reusable components.

Keep the code modular.

Separate:

UI

database

authentication

article management

publishing integrations

analytics

20. Important Publishing Architecture

Design the system around a generic publishing layer.

For example:

PublishingProvider

with methods conceptually like:

createPost()

updatePost()

publishPost()

getPost()

syncPosts()

Then create:

SubstackProvider

if technically supported.

This means I can eventually add:

Substack

Medium

LinkedIn

personal RSS

other publishing platforms

without rebuilding the entire application.

21. Dashboard Publishing Status

Every article should have a publishing status.

Example:

DRAFT

READY

PUBLISHED TO WEBSITE

PUBLISHED TO SUBSTACK

FAILED

If publishing fails, show the actual error clearly.

Do not tell me “Published successfully” unless the external platform confirms success.

22. Future Expansion

Architect the project so I can eventually add:

newsletter analytics

subscriber analytics

AI writing assistant

AI article summarizer

automatic article tagging

article recommendations

related article engine

RSS feed

email notifications

social media sharing

automatic LinkedIn post generation

automatic Instagram carousel generation

Do NOT build all of these now.

Build the foundation so they can be added later.

23. Homepage Experience

The final homepage should feel like I am entering an archive of ideas.

Something like:

WEEKLY WONDERS
━━━━━━━━━━━━━━━━━━━━

Ideas worth wondering about.

[ FEATURED WONDER ]

━━━━━━━━━━━━━━━━━━━━

LATEST WONDERS

[Card] [Card] [Card]

[Card] [Card] [Card]

━━━━━━━━━━━━━━━━━━━━

EXPLORE BY TOPIC

MARKETS · FINANCE · BUSINESS · MINDSET

━━━━━━━━━━━━━━━━━━━━

Read the latest on Substack →

24. Admin Experience

The admin dashboard should feel like a personal writing operating system, not a generic SaaS dashboard.

The most important action should be:

+ NEW ARTICLE

Then:

WRITE
→ PREVIEW
→ SAVE
→ PUBLISH

Make this extremely simple.

25. Build Order

Do not attempt to build everything simultaneously.

Build in this order:

Phase 1

Public pixel-art homepage + article gallery

Phase 2

Article pages + categories + search

Phase 3

Admin authentication + article database

Phase 4

Writing/editor interface

Phase 5

Image/pixel-art management

Phase 6

Substack integration investigation

Phase 7

Publishing/export workflow

Phase 8

Analytics + SEO + polish

After each phase, ensure the existing application still works.

Critical Instruction

Before implementing the Substack integration, verify what Substack officially supports.

Never fabricate API endpoints, authentication flows, or publishing capabilities.

If direct publishing is unavailable, implement the best possible export/copy workflow and clearly label it.

The finished product should feel like:

My own little publishing company on the internet.

It should be visually distinctive, fast, simple to maintain, and something I would actually want to use every week to write and publish Weekly Wonders.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://artful-publish.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/24ad83af-6b8f-4e87-8ea0-92d3e3a8cd4f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
^ < ! - -  
 t e s t i n g  
 b r a n c h  
 w o r k f l o w  
 - - ^ >  
 
<!-- testing branch workflow -->
