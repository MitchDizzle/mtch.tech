# World map

## Shape

A single horizontal street. The player spawns at the left end and walks right.
Each domain of the site is a storefront on that street. There is no vertical
level structure and no jumping - movement is walking on a ground plane with a
shallow depth band (see [05-controls.md](05-controls.md)).

Order left to right, nearest to spawn first:

| Order | Storefront | Domain | Ambient animation |
| --- | --- | --- | --- |
| 1 | Tech shop | Software work | Neon sign flicker |
| 2 | Bakery | Baking | Steam from a vent |
| 3 | Garage | Motorcycles | Garage door opens on approach |
| 4 | Arcade | Games | CRT glow / marquee |
| 5+ | Unnamed buildings | - | None |

Order is deliberate: the two highest-effort storefronts sit closest to spawn
where every visitor will see them.

## Diegetic level of detail

Detail falls off with distance from spawn. This is presented as a property of
the world, not as a technical compromise - the far end of the street is less
*rendered*, and that is the setup for the map edge.

| Tier | Range | Art standard | Enterable |
| --- | --- | --- | --- |
| 1 | Spawn, tech shop, bakery | Full detail, full palette, ambient animation, lit windows | Yes |
| 2 | Garage, arcade | Reduced shading, fewer props, one ambient animation each | Yes |
| 3 | Next few buildings | Flat silhouettes, one or two palette stops, no animation | No |
| 4 | Final buildings | Outlines only, background colour fill | No |
| - | Past the last building | Nothing. Ground ends. | - |

**This is the project's most important cost control.** It makes reduced-fidelity
art canonical rather than unfinished, so the asset budget can be spent unevenly
without the result looking incomplete. Tier 3 and 4 buildings are minutes of
work each and can be produced in bulk.

Practical rule: if an asset is getting expensive, ask whether it can move one
tier further down the street instead.

## Map edge

Walking past the last building means walking off the world. The player falls.
This is the transition into a fantasy setting with forest creatures and goblins.

**Parked.** This is a second game, not a feature of the first one. It is
recorded here so the street is built with the edge in mind - the ground plane
must actually terminate, and the fall must be reachable - but nothing beyond the
fall itself is in scope for v1. A placeholder that catches the player and
returns them to the street with a "not built yet" beat is acceptable and
arguably funnier than nothing.

## Background composition

**Do not author the street as one large image.** Reasons:

1. A street-width image at usable resolution is multiple megabytes, which fails
   the mobile-first, cellular-data target.
2. A flattened image cannot animate. The neon sign, the steam, and the garage
   door all require their elements to be separately addressable.
3. Any change to one storefront means regenerating the whole image.

Compose at runtime from layers:

- **Sky / far parallax** - a small tileable strip, scrolls slowest.
- **Mid parallax** - distant skyline silhouettes, tileable, cheap.
- **Building layer** - discrete storefront sprites positioned from a manifest.
- **Ground / pavement** - tileable strip.
- **Foreground parallax** - occasional props (a bin, a lamp post, a parked bike)
  that scroll fastest and sell the depth.

### Build-time scripting

There is a legitimate role for a build step, but it is generating a **layout
manifest**, not baking pixels. An Eleventy data file can emit the street layout
as JSON - storefront order, x positions, detail tier, which site section each
door maps to, which sprite each uses - and the game reads it at runtime.

That keeps the street data-driven: reordering the street or adding a building is
a manifest edit, not an art task, and the same manifest can drive static mode's
navigation so the two stay in sync.

## Open questions

- Time of day. A single fixed time is much cheaper than a day cycle, and night
  makes the neon and CRT glow do more work for free. Leaning night or dusk.
- Does the street scroll continuously, or snap between storefront "rooms" as the
  player moves? Continuous is better; snapping is cheaper on asset width.
- How wide is a storefront in pixels, and therefore how long is the street?
  Needs to be pinned before art is generated.
- Weather or ambient particles as a cheap atmosphere win?
