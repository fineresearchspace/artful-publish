# Sole-owner administration and index heatmap

## What will change

- Keep the current owner account as the only administrator and enforce that only one administrator role can exist.
- Keep all other and future accounts read-only, without access to writing, publishing, subscriber, category, or settings changes.
- Add an editorial market heatmap to **Market Pulse**, showing widely followed India, US, Japan, and European indices sized consistently and colored by daily performance.
- Make each available heatmap tile selectable.
- Add a historical line chart for the selected index with simple ranges such as 1 month, 3 months, 1 year, and 5 years.
- Show trading volume below the price line when the source supplies volume; clearly mark it unavailable for indices that do not publish it.
- Preserve the existing region cards, bonds, currency data, and market news.

## Technical details

- The database now enforces a single administrator role and serializes first-owner assignment, preventing two signups from both becoming administrators.
- Add a same-origin market-history endpoint with validated index symbols, request timeouts, caching, and safe failure responses.
- Use the existing market feed for daily heatmap values and a free historical market feed for adjusted-close and volume series.
- Build the chart with the existing chart library and project color tokens, including loading, empty, and unavailable states.
- Improve the Market Pulse page metadata while touching that route.
- Verify sole-admin data, unauthorized access controls, desktop/mobile layouts, index selection, ranges, price history, optional volume, and build health.
