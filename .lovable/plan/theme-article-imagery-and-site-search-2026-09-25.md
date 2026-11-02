# Theme, article imagery, and site search

## Build

- Add a persistent daylight/dark toggle in the public header, with system preference as the first-visit default and no page flash.
- Show each article’s cover image between its heading and body when an image is available; keep the existing layout unchanged when it is not.
- Add a search control to the public header that opens an accessible search panel, searches all published article titles, summaries, categories, and tags, and links directly to matching articles.
- Make the search and theme controls work in both desktop and mobile navigation.

## Technical details

- Reuse the existing semantic light/dark color tokens and article listing function.
- Load published article summaries only when search opens, with graceful empty and unavailable states.
- Use the existing Button component for new controls and preserve the current editorial visual language.
- Verify the homepage and an article page at desktop and mobile sizes, then check the latest app build status.