<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Newsletter subscriptions enter through a validated server function using privileged access; the subscriber table stays unreadable to public visitors to protect email addresses.
- Public appearance preference is stored under `the-context-theme` and applied before rendering to prevent a light/dark flash.
- Market heatmaps, historical charts, and sovereign bond yields belong exclusively on Market Pulse; the homepage stays focused on editorial content.
- The Bonds tab reuses the sovereign yield table and its existing feed; a pure helper calculates US-relative spreads without inventing missing yields.
- CFA Exam editorial content uses the `CFA Exam` article category and is surfaced separately at `/cfa-exam`.
- The writing studio is single-owner: the database permits only one `admin` role, while every other account remains a regular user.
- Historical index charts use the allowlisted same-origin `/api/market-history` route so third-party failures remain isolated from Market Pulse.
- Market Pulse uses a categorized delayed-data performance board for indices, commodities, and currencies, with selectable price history and reported volume.
- The homepage and full headlines route reuse one timeline; a shared chronological selector limits headlines and topic-matches the Market Pulse related-news row without unrelated fallbacks.
