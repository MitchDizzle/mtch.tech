# Landing page

## Purpose

Name the site, set tone, and hand the visitor a mode choice. It carries no
content of its own. It should be small, fast, and fully rendered without
JavaScript.

## Form - settled

Three layers, back to front:

1. **Background.** A slowly transitioning dark gradient. Placeholder for
   background art later, so it must be a swappable layer, not baked into the
   page background.
2. **Title card.** "Mitchtopia", sitting **outside and above the panel**, like a
   game's title screen. It is not panel content.
3. **Panel.** Centred, contains a brief summary of the site and two buttons -
   **Static site** and **Play game**. Both equally weighted, neither default.

**No tabs on the landing page.** Tabs belong to the static hub and interior
pages. The landing panel is a prompt with two choices and nothing else.

The panel component is shared with the game options screen and the static site -
see [08-static-site.md](08-static-site.md).

## Sequence

1. **Background** is present from the start, gradient already animating.
2. **Title card** appears. Timing and entrance TBD, but it resolves before the
   panel so the name is read first.
3. **Panel opens** with the LitRPG animation - horizontal line expands from
   centre, then extends vertically. Summary and buttons are already inside and
   are revealed by the clip, not faded in separately.

Leaving the panel plays the animation in reverse before navigating.

## Background gradient

- Dark, slow, continuous transition. Long cycle - this is ambience, not an
  effect to be noticed.
- Implement as its own element or pseudo-element so background art can replace
  it without touching layout.
- Animate colour stops or a moving gradient position. Avoid animating
  `background-image` itself, which cannot be composited and will jank on mobile.
- Under `prefers-reduced-motion: reduce`, hold a single static gradient.

## Motion and reduced motion

`prefers-reduced-motion: reduce` collapses the entire sequence to the final
state - title in position, buttons visible, no slide, no idle bounce, no fade.
Not a shortened animation; no animation.

Implementation constraints:

- Build the reduced-motion state as the base CSS, then layer animation on top
  inside `@media (prefers-reduced-motion: no-preference)`. Doing it the other
  way round tends to leave elements stuck at `opacity: 0` when a query fails.
- Animate `transform` and `opacity` only. No animating layout properties.
- Nothing on this page should depend on JavaScript to become visible. If the
  bundle fails, the landing page must still be usable.

## The mode choice

Requirements:

- Each button needs a one-line description so the choice is informed. A visitor
  should know that "play game" means loading assets before they commit,
  especially on mobile data.
- The static side must be reachable at a plain URL that can be linked and shared
  directly, so a résumé link never routes anyone through the landing panel.

### Play game

Goes to the game options screen (first visit only), then the game.
**The game itself is a no-op for now** - the options screen is built, accepted
settings are stored, and the game route is a placeholder. This lets the entire
landing and options flow be finished and shipped before any game work starts.

### Static site

Goes to the static hub panel. See [08-static-site.md](08-static-site.md).

## Naming

**Mitchtopia** on the landing panel. Once inside the static side, the site
presents as **Mitch Gardner** - personality at the front door, credibility where
someone is actually reading about your work. Mitchtopia also remains the name of
the game world.

## Layout

Designed at mobile width and scaled up. At desktop widths the composition should
gain space rather than gain elements - no extra columns, no revealed sidebar.

The panel must not exceed the viewport on small screens. Its contents scroll
inside the frame rather than the frame growing off-screen.

## Open questions

- Exact summary copy.
- Whether the mode choice is remembered on return visits.
- Whether there is a third, quieter link for people who want to skip straight to
  a specific page.
