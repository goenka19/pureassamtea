# PureAssamTea Website — Claude Instructions

## ALWAYS before finishing any task
- Re-read every item the user asked for in the message before reporting done
- If the user lists 3 things, verify all 3 are done — not just the ones you remember
- Never report complete if any requested change is missing

## Project
- Astro 5 + Tailwind 3. Branch: `feature/homepage-sections` for in-progress work, `main` is production
- Custom breakpoints: `pat` (max 880px), `mob` (max 639px) — always use these, never arbitrary `max-[Xpx]`
- Design tokens: `tea-green` (#006C3F), `cream` (#F9F8F3), `ink`, `ink-2`, `ink-3`, `line`
- After every change: `npm run build` must pass before committing
- After committing: push branch + `wrangler pages deploy dist --project-name pureassamtea-preview --commit-dirty=true`

## Design rules
- Copy design tokens (colors, spacing, type scale) from existing sections — never copy entire component shapes
- No green borders as decorative elements — that is vibe coding
- No icon circles as the primary visual pattern
- Keep sections visually distinct from each other
