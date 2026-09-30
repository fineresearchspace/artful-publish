# Finish layout, typography, and article previews

## What will change
- Keep the interactive heatmap on the homepage and remove its duplicate from Market Pulse.
- Standardize headings, labels, controls, spacing, and narrow-screen layouts across Market Pulse, news, article, search, CFA Exam, and publishing previews.
- Repair article image previews by using stable public image links for new uploads and normalizing existing stored image links when articles are read.
- Preserve signed-in-only image uploads and edits; public visitors receive read-only image access.

## Technical details
- Remove `IndexHeatmap` only from `/Market-Pulse` and update that page’s description accordingly.
- Replace inconsistent hardcoded colors and typography with the existing editorial design tokens.
- Make search and timeline layouts safer on short and narrow screens.
- Change editor uploads from expiring signed links to stable public object links.
- Add a shared image URL normalizer so previously published signed image URLs continue to display without manual article edits.
- Verify homepage, Market Pulse, published articles, and the writing preview on desktop and mobile, then confirm the latest build is clean.
