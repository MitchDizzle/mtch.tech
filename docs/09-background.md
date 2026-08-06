# Background — galaxy / sunset sky

**Status:** planned, not started. Current implementation is three drifting
radial-gradient blobs in `landing.css`.

## Direction

Move from abstract glows toward a night sky over a sunset — the last band of
warm light at the horizon, deep sky above it, stars, and nebula structure.
Reference given: the Forge of Heavens from *The Land*.

**Needs input.** The Forge of Heavens reference has not been described in
enough detail to design against — is it a forge-lit sky, a structure in the
sky, a colour palette, a sense of scale? A few sentences, or a couple of
images to work from, before any of this gets built.

## Complexity tiers

Different surfaces show different amounts of the background, so they should
not pay the same cost.

| Tier | Surface | Treatment |
| --- | --- | --- |
| A — full | Landing page | Everything: sky gradient, star field with slow parallax, nebula layers, occasional drift. The background is most of what is on screen here, so it earns the budget |
| B — reduced | Static site pages | Defocused and inert. Static sky gradient, a pre-rendered star layer, no animation, no canvas. It sits behind content that is being read |
| C — minimal | `prefers-reduced-motion`, and a low-power fallback | A single static gradient. No stars, no drift |

Tier B is described as "out of focus". Worth noting an actual blur is the
expensive way to achieve that — see the constraints below. A lower-contrast,
lower-detail, pre-rendered layer reads the same and costs nothing.

## Layer stack

Back to front, all in a fixed container behind content:

1. **Sky gradient** — vertical, warm at the horizon into deep blue/violet
   above. Static. Cheap.
2. **Star field** — many small points, varying brightness and size. The
   expensive layer if done naively.
3. **Nebula** — the existing drifting radial gradients, retinted. Already
   built and already cheap.
4. **Horizon glow** — a soft warm band anchored to the bottom edge, sold as
   the light source the sky is reacting to.
5. **Foreground silhouette** *(optional)* — a dark skyline or terrain edge
   along the bottom. Grounds the composition and hides the gradient's end.

Keeping these as separate layers means tier B can drop layers 2 and 3 rather
than needing a different implementation.

## Technique options

### CSS only

Stars as `box-shadow` on a single element, or a repeating background. No
scripting, works with JS disabled, no rAF loop.

Limits: a few hundred shadows on one element is a large paint, and per-star
twinkle is not practical. Good enough for tier B, probably not tier A.

### Canvas 2D

Full control. Stars drawn once to an offscreen canvas, then that bitmap is
translated for parallax rather than redrawing every star every frame. Twinkle
via a small subset redrawn per frame, not the whole field.

Best fit for tier A, and the same technique the game will need. Costs a rAF
loop and needs to stop when the tab is hidden.

### Pre-rendered image

A single well-made star/nebula image, positioned and slowly translated.
Cheapest at runtime and the best-looking per unit effort, but it is an art
task and a payload — needs to be small enough for mobile data.

Likely the right answer for tier B, and possibly for tier A composited with a
live layer on top.

### WebGL shader

Best looking, heaviest, and a dependency. Not proportionate for a background
behind a menu. Not recommended.

## Performance constraints

These are settled from the session where the current background was built and
then had to be fixed. Do not relearn them:

- **No `filter: blur()` on anything animated.** A blurred layer that also
  animates `scale()` re-rasterises every frame. A radial gradient is already
  soft; the blur bought nothing and cost the frame rate.
- **`transform` and `opacity` only.** Both are composited. Animating
  `background-position` or any layout property will jank on mobile.
- **No `backdrop-filter` over an animated backdrop.** It re-samples and
  re-blurs the backdrop on every frame the backdrop changes.
- **Cap work by viewport area, not by a fixed number.** Star count should
  scale down on small screens rather than drawing a desktop field on a phone.
- **Pause on `visibilitychange`.** A background animating in a hidden tab is
  pure battery drain.
- **Measure with the FPS meter** (`?fps` or Ctrl+Shift+F) on a real phone, not
  a desktop emulator, before calling any of this done.

## Interaction

"Less interactive" on tier B implies tier A has some interactivity. Candidates,
cheapest first:

- Parallax on pointer position — a few pixels of counter-movement per layer.
  Cheap, effective, and must be disabled under reduced motion.
- Parallax on device orientation for mobile. Requires a permission prompt on
  iOS, which is a poor trade for a background effect. Probably not worth it.
- Stars brightening near the cursor. Cute, and the kind of thing that quietly
  costs a full-field redraw per frame. Only with the offscreen-canvas
  approach.

None of this may block reading content or interacting with panels.

## Open questions

- The Forge of Heavens reference — needs describing.
- Palette. The panel tones and the accent colour were chosen against the
  current dark blue. A warm sunset horizon may want them re-checked,
  especially body-text contrast over the brightest part of the sky.
- Does the game's night street share this sky, or have its own? Sharing would
  tie the two modes together nicely and halve the art.
- Is there a foreground silhouette, and if so does it hint at the game's
  street before you ever press Interactive?
