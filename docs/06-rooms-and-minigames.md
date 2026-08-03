# Rooms and minigames

## Rooms

Entering a storefront door transitions to an interior scene. Same movement
model, same controls, smaller space. Interiors are side-view with the same
shallow depth band as the street.

A room contains, at minimum:

- An exit door back to the street, placed where the player entered.
- **A content interactable** — the thing that surfaces the actual site content
  for that domain (projects, posts, recipes, build logs).
- **An NPC** for flavour and information.
- Optionally, **a minigame object.**

### Room budget

Rooms are cheaper than they look if kept to one screen. A room that does not
scroll needs one background, a floor, and a handful of props. Resist scrolling
interiors in v1.

### Critical path rule

The content interactable must be immediately visible on entering the room. It
must not be behind an NPC conversation, a minigame, or any discovery. Someone
who walked into the tech shop to see the portfolio sees the portfolio.

NPCs and minigames are the optional layer on top.

## NPCs

One per room, static or lightly idle-animated. Purpose is tone and orientation —
explaining what this place is, pointing at the minigame, being funny.

Dialogue is a simple sequential text box advanced with Interact. No branching
trees in v1; branching multiplies writing and state for very little return.
A short linear script with a couple of randomised idle lines gets 90% of the
effect.

Dialogue text should live in data files, not in code, so it can be edited
without a rebuild of game logic — and so it can be reused in static mode.

## Minigames

Each minigame is an interactable object in a room, not a gate on the room.

Design constraints:

- **Optional.** Skippable, exitable at any time, never required to reach content.
- **One screen.** No minigame gets its own level structure.
- **Reuses existing input.** Move plus Interact where possible.
- **Fails softly.** Losing gives a lesser reward, never a blocker or a retry wall.

### Reward: hats

Completing a minigame grants an equippable hat. Performance determines which
variant — doing better gives a better hat.

This is a good reward system for this project because hats are small, static,
single-sprite, and instantly readable. They give replay motivation at close to
the lowest possible art cost.

**Technical requirement, must be designed in from the start:** every frame of
every player animation needs a defined head anchor — x, y, and ideally rotation.
Hats render at that anchor with a per-frame offset. If the character sheet is
produced without anchors, retrofitting them means redoing the sheet. Bake this
into the art pipeline before any character art is generated. See
[07-art-pipeline.md](07-art-pipeline.md).

### Planned minigames

| Room | Minigame | Reward | Notes |
| --- | --- | --- | --- |
| Bakery | Follow a recipe — measure ingredients by weight | Chef's hat, tier by accuracy to target grams | **Best first candidate.** UI-driven, almost no new art, strong personality, scoring is trivially objective |
| Garage | Motorcycle race | Helmet; a better helmet for first place | Highest art and systems cost of the set — needs a second movement mode entirely |
| Tech shop | IT / debugging game | Hat TBD | Undefined. Needs a concrete mechanic before it can be estimated |
| Tech shop | Detective game | Hat TBD | Worth merging with the IT game — debugging *is* detective work, and that pun is the site's whole cross-pollination thesis in one object |
| Arcade | LitRPG / roguelite cabinet | Hat TBD | The parked roguelite, scaled down into an arcade cabinet. Good home for it |

### Sequencing

Do not build these in parallel. Each minigame is effectively a small separate
game, and five minigames is five games.

Recommended order:

1. **Hub first, zero minigames.** Street, one room, content interactable, NPC.
   Prove the movement and the room transition feel right.
2. **Bakery recipe game.** Lowest art cost, highest personality-per-hour. Also
   proves the hat pipeline end to end — anchors, equipping, persistence.
3. **Reassess.** The true cost of a minigame will only be known after one is
   finished. Estimate the rest from that number, not from enthusiasm.

The race is the most tempting and the most expensive. Do not make it first.

## Persistence

Hats earned, minigame best scores, and settings persist across visits in local
storage. No accounts, no backend.

State must degrade gracefully: a visitor with storage disabled should be able to
play, earn a hat for the session, and lose it on close without anything breaking.

## Open questions

- Where are hats equipped — a pause-menu inventory, or a wardrobe object in a
  room?
- Is there a visible collection screen showing unearned hat silhouettes? Good
  motivation, small extra art cost.
- Do the IT and detective concepts merge into one game?
- Does the NPC in each room have a name and recurring character, or are they
  generic?
