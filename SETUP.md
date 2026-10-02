# Newsletter route — setup steps

## 1. Install the one new dependency
```bash
npm install react-markdown
```
(`react-router-dom` should already be in your project since Lovable sets it up by default — check `package.json` to confirm.)

## 2. Place the content files
Move the 37 converted `.md` files from `newsletter-content.zip` into:
```
src/content/newsletter/
```
(create the folder if it doesn't exist). The `lib/newsletter.ts` glob path assumes this exact location — if you put it somewhere else, update the path in `import.meta.glob("../content/newsletter/*.md", ...)`.

## 3. Add the two new files
- `src/lib/newsletter.ts`
- `src/pages/Newsletter.tsx`
- `src/pages/NewsletterPost.tsx`

## 4. Wire up the routes
In your `App.tsx` (or wherever your `<Routes>` live), add:
```tsx
import Newsletter from "@/pages/Newsletter";
import NewsletterPost from "@/pages/NewsletterPost";

// inside <Routes>
<Route path="/newsletter" element={<Newsletter />} />
<Route path="/newsletter/:slug" element={<NewsletterPost />} />
```

## 5. Optional but recommended: Tailwind typography plugin
The detail page uses `prose` classes for readable article styling. If you don't already have it:
```bash
npm install -D @tailwindcss/typography
```
Then add `require("@tailwindcss/typography")` to the `plugins` array in `tailwind.config.ts`. If you'd rather hand-style the article body, delete the `prose` classes and style `NewsletterPost.tsx` directly.

## 6. Restyling to match your site
Both pages are intentionally plain — swap `text-muted-foreground`, `border-border` etc. for your actual design tokens, and drop in your site's header/nav where the `TODO` comment is in `Newsletter.tsx`.

## What's NOT handled yet
- No "next/previous issue" navigation on the detail page
- No tag/category filtering (all 37 sit under one flat `/newsletter` list — matches your "keep it in newsletter section" call)
- No RSS feed
- Images still point to Substack's S3 URLs (per your earlier call) — no local image handling needed for now
