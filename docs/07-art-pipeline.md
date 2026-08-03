# Art pipeline

Art is the critical path for this project. Engine choice, level design, and code
are all cheaper and more reversible than a consistent sprite set. This document
exists to make generated art usable rather than to make it beautiful.

## Constraints to pin before generating anything

These cannot be changed later without redoing work. Decide them first.

| Constraint | Why it must be first |
| --- | --- |
| **Palette** — a fixed list of hex values | Every asset gets quantized to it. Assets generated in different sessions will not match without this |
| **Canvas resolution** — e.g. 320×180 or 480×270 logical pixels, integer-scaled | Determines how large every sprite is drawn and how much detail is even visible |
| **Character height in pixels** | Everything else scales relative to the player. Doors, counters, bikes, hats |
| **Head anchor convention** | Hats depend on it. See below |
| **Ground line / horizon height** | Storefronts must share a baseline or the street will not line up |

## Palette locking

AI image generation will not produce consistent colour across sessions. The fix
is not better prompting; it is post-processing.

Define a palette once — 24 to 40 colours is a reasonable range for this style —
then run every generated asset through a quantizer that snaps each pixel to the
nearest palette entry. This is a short script and it is what will make assets
from different generation sessions read as one game.

Practical notes:

- Quantize with nearest-colour matching in a perceptual space, not naive RGB
  distance, or shadows go muddy.
- Keep one dedicated transparent/key colour that is not in the palette.
- Run it as a build step over a source art directory so re-running is free and
  the originals are never destroyed.

## Head anchors

Every frame of every player animation needs a head anchor exported with it:
`{ frame, x, y, rotation }`. Hats render at that point.

Produce this as a JSON sidecar per animation. Aseprite can export slice data
alongside a sprite sheet, which is the natural mechanism — define a slice named
`head` and move it per frame.

**This must exist before the character sheet is considered finished.** Retrofitting
anchors onto a completed sheet means opening every frame again.

## Keeping animation cheap

The instinct that animation is the hard part is correct, but most of the
animation on the street costs no frames at all.

### Free — transform and shader only, zero drawn frames

- **Neon sign** — one sprite, modulate opacity or tint on a noise curve.
- **Steam** — particle emitter. Procedural, no art beyond a single soft puff.
- **Garage door** — one sprite, translate or scale on an ease curve.
- **CRT glow** — one sprite, subtle scale and opacity pulse.
- **Idle bob** — vertical translate plus slight squash. Works on NPCs, props,
  and the title on the landing page.
- **Signs swinging** — rotation around an offset pivot.
- **Parallax** — layer scroll speed. Free depth.

### Costs real frames — spend here, and only here

- **Player walk cycle.** Unavoidable. 4 frames is workable, 6 is comfortable.
  Side-on is the priority; the depth band can reuse the side view rather than
  needing dedicated front and back sets in v1.
- **Player idle.** 2 frames, or transform-only if budget is tight.
- **Player interact.** 1–2 frames, or reuse idle with a transform.

That is the entire mandatory animation budget: one character, three states. Every
other moving thing on the street should be transform-driven.

## Working with generated art

What AI generation is good at here: static props, storefront facades, background
buildings, interior furniture, hats, individual objects. These are the bulk of
the asset list and the bulk of the work.

What it is bad at: the same character rendered consistently across animation
frames, and consistent palette without post-processing.

Mitigations for character frames:

- Generate a single strong reference pose, then produce the remaining frames by
  hand-editing that pose in Aseprite. Editing an existing frame is a much smaller
  skill ask than drawing a character from nothing.
- Keep the character small. Fewer pixels is less to keep consistent, and it is
  genre-appropriate.
- Consider a design that hides the hard parts — a helmet or hood removes facial
  consistency as a problem entirely, and fits a site whose reward system is hats.

## Blank templates

Worth generating alongside the real assets: empty storefront shells, blank
interior rooms with a floor and back wall, and a featureless NPC silhouette.
These let the street and rooms be assembled and playtested before final art
exists, and they become the tier 3 and tier 4 buildings for free.

Build the game against templates first. If the hub is not fun to walk around
with placeholder art, better art will not fix it.

## Open questions

- Final palette.
- Logical resolution and character height.
- Art style: how "pixel" is the pixel art — chunky and limited, or higher
  resolution with more shading?
- Time of day, which affects every facade asset. Decide before generating.
