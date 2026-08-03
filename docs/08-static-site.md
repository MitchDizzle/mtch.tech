# Static site

Supersedes the "static mode is plain" framing in
[03-static-mode.md](03-static-mode.md). The static side is themed, not plain —
but the accessibility and linkability requirements in that document still stand
in full.

## Decided

- **Fantasy UI throughout.** Kenney fantasy borders frame every page, not just
  the entry screens.
- **Mitchtopia** on the landing panel; **Mitch Gardner** inside.

## The panel component

One component, reused everywhere. This is the site's signature idiom.

Implementation:

- `src/_includes/components/panel.njk` — Nunjucks macro, called with
  `{% call panel({...}) %}` so the body is arbitrary markup
- `src/assets/css/panel.css` — variants and animation
- `src/assets/js/panel.js` — open/close, tabs, transitions, toasts

### Variants

| Variant | Used for |
| --- | --- |
| `prompt` | Landing screen, short confirmations. Narrow, no tabs |
| `dialog` | Game options, pause menu, anything with form controls |
| `page` | Static page frames. Wide, grows to content |
| `dialogue` | In-game NPC dialogue box. Wide and short |
| `toast` | Transient LitRPG system notification — "Hat acquired" |

### Game UI lives in the DOM

The game's menus, dialogue, and notifications are DOM elements overlaid on the
canvas, not drawn inside it. The panel is therefore literally the same component
in the game as on the site, not a visual lookalike that has to be kept in sync.

This also gives text rendering, keyboard focus handling, and screen reader
support for free — none of which exist inside a canvas.

**Exception:** anything that tracks a world position must be canvas-drawn. The
interaction prompt floating above a door moves with the camera, so it is not a
panel. Menus and notifications are panels.

### Transparency

Panels are slightly transparent, like a game overlay. Two constraints:

- Alpha stays at or above ~0.88. Body text must keep its contrast ratio against
  the darkest backdrop a panel can sit on — including the animated landing
  gradient and the game's night street. Re-check contrast before lowering it.
- `backdrop-filter` blur is applied only above the mobile breakpoint and behind
  an `@supports` guard. It is expensive on low-end devices and is decoration,
  not structure.

### Open animation — LitRPG prompt

Blank screen, then a horizontal line expands from centre, then extends
vertically into the full panel. Closing reverses it.

**The panel is a clipping mask, not a scaling box.** `transform: scaleY()` would
stretch and squash the text as it grows. `clip-path: inset()` keeps content at
final size and opens the clip over it, so the text is already in place and is
revealed rather than animated.

```
inset(50% 50% 50% 50%)  ->  inset(50% 0 50% 0)  ->  inset(0 0 0 0)
      nothing                horizontal line          full panel
```

A decorative leading-edge line fades out as the vertical phase begins.

Rules:

- Progressive enhancement. Default state is open and readable. No JS, no CSS
  animation support, or a failed bundle must all still leave a usable page.
- `prefers-reduced-motion: reduce` skips both phases entirely — panel simply
  present, no edge line.
- Tabs swap content **in place**. The panel does not close and reopen on tab
  change; watching the animation on every click gets old by the third time.
  Only mode transitions (landing to static, landing to game) play close/open.

### Mobile

The panel grows to content height and the **page** scrolls. Never a fixed panel
with an internal scroll container — nested scrolling on mobile is hostile and the
frame would clip long content.

### Border swap-in

`--panel-border-width` is a CSS custom property from day one. Building with a
plain 2px border now means adding the ornate `border-image` later is a variable
change plus a source, with zero layout reflow. Hardcoding the width anywhere
means every panel reflows when the real border arrives.

The swap-in block is already written and commented out at the bottom of
`panel.css`.



| Screen | Contents |
| --- | --- |
| Landing | Title, summary, Static site / Play game |
| Game options | Cookie consent, music slider, SFX slider, Accept / Cancel |
| Static hub | Section links — About me, Projects, Writing, and the hobby domains |

Same border, same open animation, same layout rules. Building it once and
configuring it three ways is most of the front end.

### Game options screen

Shown on first play only; reachable afterwards from the game's pause menu.

- Cookie / local storage consent
- Music volume — defaults to off or very low, never full
- SFX volume — separate control
- Accept and continue, or Cancel and go back

Accepted settings persist to local storage. The game route itself is a
placeholder until game work begins.

## Fantasy UI implementation

### Use `border-image`, do not slice the sheet

CSS `border-image` with `border-image-slice` performs proper 9-slice: corners
stay fixed, edges stretch or repeat. Uniform scaling of a whole border SVG
would squash the corner ornaments.

```
border-style: solid;
border-width: <corner size>;
border-image-source: url(fantasy-ui-borders.svg#fragment);
border-image-slice: <top right bottom left> fill;
border-image-repeat: round;   /* or stretch, per border */
```

`round` generally reads better than `stretch` on ornamental borders because it
preserves the repeat rhythm of the pattern.

### Tall content is the real risk

A decorative frame around a long article is where this design gets hard. The
edge pattern repeats down a very tall box and can look mechanical, and the frame
adds horizontal padding that eats reading width on mobile.

Mitigations:

- Frame the **page container**, not every content block. One frame per page.
- Set a comfortable `max-width` on body copy inside the frame — the frame is the
  page edge, not the text edge.
- Reduce border width at small breakpoints, or drop to a simple two-colour rule
  under a threshold. The theme survives; the reading does not have to suffer.
- Keep body text on a plain background. Do not tile a parchment texture behind
  paragraphs.

### Asset prep

The SVG is a 1080×1080 sheet of ~220 vector paths grouped into symbols with
generic IDs (`Symbol_N_0_Layer0_0_FILL`). It contains no embedded rasters, which
is good — it scales freely and stays small.

One-time work needed:

- [ ] Visually identify which symbol is which border style
- [ ] Record the mapping in `docs/assets/ui-border-map.md`
- [ ] Extract the two or three borders actually being used into standalone SVGs
      with their own viewBoxes, rather than shipping the whole 134 KB sheet
- [ ] Confirm licence attribution requirements and add them to the site footer

## Sections

Hub links, to be finalised:

- About me
- Projects
- Writing / blog
- The hobby domains — games, motorcycles, baking
- Contact

The existing Eleventy `posts` and `projects` collections cover most of this. The
content model still wants a `domain` field so an item can declare which
interest it belongs to, and so the game and the static site can share one
navigation manifest later.

## Non-negotiables carried over

- Every piece of content has a stable URL.
- No JavaScript required to read anything. The panel animation is progressive
  enhancement; the panel must be open and readable without it.
- `prefers-reduced-motion: reduce` disables the open animation entirely.
- Reachable directly without passing through the landing panel.
- The fantasy border is decorative — `aria-hidden`, and never the only thing
  conveying structure.

## Open questions

- Which specific borders from the pack, for which surface.
- Typeface. A fantasy display face for headings with a clean body face is the
  usual answer; a fantasy face for body copy is not.
- Colour palette for the static side — does it match the game's palette or
  diverge deliberately?
- Do the hobby domains get their own accent treatment within the shared frame?
