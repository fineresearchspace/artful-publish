# Market Pulse historical charts

## What will change
- Make every available Market Pulse heatmap tile selectable.
- Show a historical line chart below the active category for the selected index, commodity, or currency.
- Match the homepage chart controls with 1 month, 3 months, 1 year, and 5 year ranges.
- Show reported volume below the price chart, or a clear unavailable note when the source does not report volume.
- Keep delayed quotes and market news unchanged.

## Technical details
- Expand the existing validated same-origin history endpoint to an explicit allowlist covering every Market Pulse symbol.
- Reuse the homepage chart presentation in a focused shared chart component.
- Cancel stale quote and history requests when the user changes tabs, tiles, or ranges.
- Verify indices, commodities, and currencies in the browser on desktop and mobile, then confirm app health.
