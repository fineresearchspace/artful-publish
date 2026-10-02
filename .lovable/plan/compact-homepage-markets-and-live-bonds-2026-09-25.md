# Compact homepage markets and live bonds

## What will change

- Add a compact **Market Pulse** strip directly below the homepage introduction.
- Show a small selection of India and US indices only, with current value and daily movement.
- Make the strip link to the full **Market Pulse** page for all regions, news, and details.
- Remove the separate **Featured Wonder** block from the homepage.
- Put the existing live sovereign bond feature in that space, showing 2Y, 10Y, and 30Y yields for India and major economies.
- Keep the featured article in the top introduction unchanged, so no article or publishing functionality is removed.

## Technical details

- Reuse the existing market data source and `/api/bonds` feed rather than introducing another provider.
- Extract focused homepage market and bond displays into small reusable components.
- Include loading and unavailable states so external data cannot blank or block the homepage.
- Keep the full `/Market-Pulse` experience unchanged.
- Verify desktop and mobile layouts, links, live-data failure states, and the app build.
