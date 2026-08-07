# Asset list

Working checklist for art generation. Grouped by phase - do not generate ahead
of the phase, since decisions in earlier phases change what later assets need.

Legend: **Gen** = good AI generation candidate · **Hand** = needs hand work in
Aseprite · **Proc** = procedural, no art file needed · **Template** = blank
placeholder that also becomes a tier 3/4 asset later

---

## Phase 0 - decide before generating

Not assets. Blockers on everything below. See
[../07-art-pipeline.md](../07-art-pipeline.md).

- [ ] Palette (24–40 hex values), committed to the repo
- [ ] Logical canvas resolution
- [ ] Character height in pixels
- [ ] Ground line / horizon height, shared by all facades
- [ ] Time of day (affects every facade)
- [ ] Storefront width in pixels

---

## Phase 1 - templates and greybox

Build and playtest the hub with these. If walking the street is not enjoyable
with placeholders, final art will not rescue it.

- [ ] Blank storefront shell - door, window, sign board - **Template**
- [ ] Blank interior room - floor, back wall, doorway - **Template**
- [ ] Featureless NPC silhouette - **Template**
- [ ] Featureless player, idle + 4-frame walk - **Template / Hand**
- [ ] Flat pavement tile - **Template**
- [ ] Flat sky strip - **Template**

---

## Phase 2 - player character

The single most important asset. Small, consistent, and anchored.

- [ ] Player idle - 2 frames - **Hand**
- [ ] Player walk - 4–6 frames, side view - **Hand**
- [ ] Player interact - 1–2 frames, may reuse idle + transform - **Hand**
- [ ] Head anchor slice data exported per frame - **Hand, mandatory**
- [ ] Player walk, depth-band variant - *deferred; reuse side view in v1*

---

## Phase 3 - street, tier 1

Highest detail. These are what every visitor sees.

### Tech shop
- [ ] Facade - **Gen**
- [ ] Neon sign, single sprite (flicker is transform/tint) - **Gen**
- [ ] Door, closed and open states - **Gen**

### Bakery
- [ ] Facade - **Gen**
- [ ] Window display - bread, pastries - **Gen**
- [ ] Steam vent - emitter plus one soft puff sprite - **Proc + Gen**
- [ ] Door, closed and open states - **Gen**

### Shared street dressing
- [ ] Pavement tile set - **Gen**
- [ ] Road / kerb - **Gen**
- [ ] Lamp post - **Gen**
- [ ] Bin, crates, small props - **Gen**
- [ ] Parked motorcycle (street dressing, side profile) - **Gen**
- [ ] Sky / far parallax strip, tileable - **Gen**
- [ ] Mid parallax skyline silhouette, tileable - **Gen**

---

## Phase 4 - street, tier 2

Reduced detail. Fewer props, one ambient animation each.

### Garage
- [ ] Facade - **Gen**
- [ ] Garage door sprite (opens via transform) - **Gen**
- [ ] Hanging sign - **Gen**

### Arcade
- [ ] Facade - **Gen**
- [ ] Marquee / CRT glow sprite - **Gen**
- [ ] Door - **Gen**

---

## Phase 5 - street, tiers 3 and 4

Cheap, bulk-generated. Reuse the Phase 1 templates.

- [ ] 4–6 flat silhouette buildings, 1–2 palette stops, no detail - **Template**
- [ ] 3–4 outline-only buildings - **Template**
- [ ] Map edge - where the ground terminates - **Gen**

---

## Phase 6 - interiors

One screen each. Floor, back wall, a few props, one content interactable, one NPC.

### Tech shop interior
- [ ] Room background - **Gen**
- [ ] Content interactable (terminal / noticeboard for projects + posts) - **Gen**
- [ ] NPC - **Gen + Hand**
- [ ] Props - desk, shelving, cables - **Gen**

### Bakery interior
- [ ] Room background - **Gen**
- [ ] Content interactable (recipe board) - **Gen**
- [ ] NPC - **Gen + Hand**
- [ ] Minigame object - oven or workbench - **Gen**
- [ ] Props - counter, mixer, shelves, sacks of flour - **Gen**

### Garage interior
- [ ] Room background - **Gen**
- [ ] Content interactable (build log board) - **Gen**
- [ ] NPC - **Gen + Hand**
- [ ] Minigame object - the motorcycle - **Gen**
- [ ] Props - tool bench, tyres, jack, parts - **Gen**

### Arcade interior
- [ ] Room background - **Gen**
- [ ] Content interactable - **Gen**
- [ ] NPC - **Gen + Hand**
- [ ] Minigame object - arcade cabinet - **Gen**
- [ ] Props - more cabinets, stools, carpet - **Gen**

---

## Phase 7 - UI

- [ ] Interaction prompt frame + button glyphs - **Gen**
- [ ] Dialogue box frame - **Gen**
- [ ] Pause / settings panel frame - **Gen**
- [ ] Touch d-pad and action buttons - **Gen**
- [ ] Loading screen - **Gen**
- [ ] Font - bitmap font, or an existing licensed pixel font

---

## Phase 8 - hats

Small, static, single sprite each, aligned to the head anchor. Cheapest
high-value assets in the project. Generate only after the minigame that grants
them is built.

- [ ] Chef's hat - 3 quality tiers - **Gen**
- [ ] Motorcycle helmet - 2+ tiers, best for first place - **Gen**
- [ ] Tech / detective hat - TBD once the minigame is defined - **Gen**
- [ ] Arcade / roguelite hat - TBD - **Gen**
- [ ] Hat collection screen silhouettes - *optional*

---

## Deferred - not in v1

Recorded so they are not forgotten, not to be worked on.

- Isekai fall sequence and fantasy world (separate project - see
  [../04-world-map.md](../04-world-map.md))
- Forest creatures, goblins
- Combat animations for the player
- Race minigame assets - track, opponents, HUD
- Front and back walk cycles for the depth band
- Day/night variants of every facade
- Weather particles
