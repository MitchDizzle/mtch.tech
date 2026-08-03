# mtch.tech docs

Working notes and specs for the site rebuild. This folder is the durable record of
decisions made in conversation so they survive between sessions and branches.

Current branch: `reimagined`. Main is the old iteration and is being largely scrapped.

## Contents

| File | What it holds |
| --- | --- |
| [00-vision.md](00-vision.md) | What the site is for, who it's for, the two-mode concept |
| [01-landing-page.md](01-landing-page.md) | Landing page behaviour, animation, mode selection |
| [02-interactive-mode.md](02-interactive-mode.md) | The 2D game version: genre, scope, settings gate |
| [03-static-mode.md](03-static-mode.md) | The non-game version — partly superseded by 08 |
| [08-static-site.md](08-static-site.md) | Confirmed static design: panel component, fantasy UI, sections |
| [04-world-map.md](04-world-map.md) | Street layout, detail falloff tiers, background composition |
| [05-controls.md](05-controls.md) | Movement model, verbs, desktop and mobile input |
| [06-rooms-and-minigames.md](06-rooms-and-minigames.md) | Room contents, NPCs, minigames, the hat reward system |
| [07-art-pipeline.md](07-art-pipeline.md) | Palette locking, anchors, keeping animation cheap |
| [assets/asset-list.md](assets/asset-list.md) | Phased generation checklist |
| [decisions/](decisions/) | Architecture decision records |

## Current state

Settled: two-mode fork, side-scrolling street hub with beat-em-up locomotion,
diegetic detail falloff, hats as minigame rewards, fantasy-panel UI throughout
the static site, Mitchtopia on the landing and Mitch Gardner inside.

### Built and working

- `layouts/shell.njk` — head script (adds `.js` before first paint, phase-locks
  the background drift to wall clock), fonts, background layer, toast region
- `components/panel.njk` — the panel macro. Variants: `prompt`, `dialog`,
  `page`, `dialogue`, `toast`. Options include `overlay`, `hidden`, `autoOpen`
- `assets/css/panel.css`, `assets/js/panel.js` — LitRPG open/close, in-flow
  swaps, modal overlays with focus containment and Escape, toasts
- `assets/css/landing.css` — animated background, title card, buttons, forms
- `assets/js/fps.js` — dev FPS meter, `?fps` or Ctrl+Shift+F
- Routes: `/` landing with in-place options popup, `/play/` game placeholder,
  `/site/` static hub placeholder

Verified on desktop and mobile.

### Next session — static site

`/site/` is a placeholder. Needed: the section list, the `domain` field on the
content model, converting `/blog/`, `/projects/`, and `/contact/` off the old
`base.njk` layout onto the panel, and picking which Kenney borders to extract.
See [08-static-site.md](08-static-site.md).

Old templates (`base.njk`, `styles.css`, header/nav/footer partials) are still
live for those three routes and untouched. The previous home page is preserved
at `src/_archive/old-home.njk` with `permalink: false`.

### Hard-won implementation notes

Worth not rediscovering:

- Panel animations use `fill-mode: both`, never `forwards`. With `forwards`,
  nothing applies the 0% keyframe during `animation-delay`, so a delayed panel
  renders open and then snaps shut.
- `open()`/`close()` resolve on `animationend`, not a duration timer — a
  duration-only timer fires while a delayed animation is still queued.
- Never remove and restore an `animation` to hide something. Re-applying an
  animation restarts it from zero. Fade a parent instead; parent opacity
  multiplies down the subtree.
- Backdrop fades declare their `transition` on the active-state rule only, so
  the fade is one-way: animated out, instant back in.
- No `filter: blur()` on the background blobs. A radial gradient is already
  soft, and blurring something that also animates forces a re-raster per frame.
- `backdrop-filter` is off by default (`.panel--frosted` opts in). It re-blurs
  every frame the backdrop changes, which is always, on both the landing and
  the game canvas.

### Open and blocking art work

Palette, logical resolution, character height, time of day. See Phase 0 in the
[asset list](assets/asset-list.md).

Deferred by decision: the isekai fall and fantasy world, the top-down roguelite
(likely returns as an arcade cabinet), combat, the race minigame.

## Conventions

- Decisions live in `decisions/NNNN-slug.md` with a `Status` of Proposed, Accepted,
  or Superseded. Nothing gets silently rewritten; supersede instead.
- Specs describe intent and constraints, not implementation. Implementation lives
  in the code.
- Open questions are tracked inline under an `## Open questions` heading in each
  spec rather than in a separate backlog file.
