# Homepage heatmap and published image previews

## What will change
- Remove the compact India + US Market Pulse strip from the homepage.
- Put the completed interactive index heatmap in that same homepage position.
- Keep the full Market Pulse page available without changing its broader market and news views.
- Restore cover-image previews on published article cards across the homepage, archive, related articles, and search results.
- Verify the homepage and a published article flow on desktop and mobile.

## Technical details
- Reuse the existing `IndexHeatmap` and article `cover_image` data.
- Render cover images with a stable 16:9 frame and a graceful fallback if an image cannot load.
- Preserve the existing article body image renderer and publishing workflow.
