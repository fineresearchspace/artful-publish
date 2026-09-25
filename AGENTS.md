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
- Homepage market summaries live in `HomeMarketSnapshot.tsx` and degrade independently so third-party quote failures never block editorial content.
