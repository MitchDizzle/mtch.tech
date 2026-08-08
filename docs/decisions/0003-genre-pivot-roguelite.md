# 0003 - Pivot interactive mode to a room-based hack-and-slash roguelite

- **Status:** Proposed
- **Date:** 2026-08-07
- **Supersedes:** the side-scrolling street hub in
  [../02-interactive-mode.md](../02-interactive-mode.md) and
  [../04-world-map.md](../04-world-map.md)

## Context

The previous design was a side-scrolling street where each storefront was a
section of the site. Navigation and gameplay were the same act.

The proposal is to move to a top-down, room-based structure closer to *The
Binding of Isaac*: a staging area that holds the site content and minigames,
and optional runs through connected rooms with enemies and traps. Combat is
melee hack-and-slash rather than twin-stick shooting.

## Decision

Pivot. The reasoning is mostly about where the cost lands.

## Why this is cheaper

**Art scales with tiles, not with length.** A street needs art proportional to
how far you can walk. A room needs a tileset. Twenty tiles fill unlimited
rooms; unique storefront facades do not tile.

**No camera scrolling.** Single-screen rooms remove parallax layers, tileable
sky strips, mid-ground silhouettes, and the whole diegetic detail-falloff
scheme built to make a long street affordable.

**No jump physics, no depth band.**

**Complete CC0 packs solve consistency in one download.** Kenney's
[Roguelike/RPG pack](https://kenney.nl/assets/roguelike-rpg-pack) is ~1,700
16x16 tiles and [Roguelike Characters](https://kenney.nl/assets/roguelike-characters)
is ~450, both CC0. Taking a whole pack means the character, tiles, and props
match by construction rather than by discipline. This directly removes the
project's largest identified risk - a consistent sprite set - and Kenney is
already credited for the UI borders.

## Why this is more expensive

**Combat becomes load-bearing.** The hub design could have mediocre optional
combat and still work, because the point was navigation. In a roguelite the
combat *is* the game. If it does not feel good, nothing else rescues it.

**Systems the hub never needed:** run state, room graph generation, enemy AI,
damage and knockback, items or upgrades, difficulty balance, and
meta-progression to make repeat runs worth starting.

**Top-down costs more character animation, not less.** Four-directional
movement implies four walk cycles against the side view's one. Mitigation:
ship left/right only and reuse the side view for up and down, which is common
in small roguelites and invisible to most players at 16x16.

**Net:** more code, less art. Given that art is the acknowledged bottleneck,
this is a favourable trade.

## What the pivot improves

The old structure forced the game to carry navigation forever - site content
lived inside storefronts, so the game could never simply be a game.

Staging area plus runs separates the two cleanly:

- **Staging area** - the hub. Site content interactables, NPCs, minigame
  rooms, hat wardrobe. Reachable immediately, no combat, nothing missable.
- **Runs** - entirely optional. Enemies, traps, rooms, loot.

Someone who came for the portfolio never leaves the staging area. Someone who
wants to play has a real game to play. Both are better for the split.

## Do not build procedural room generation

*The Binding of Isaac* does not generate rooms. It hand-authors a large
library of room layouts and procedurally generates the *arrangement* of them.

Hand-draw 8-10 rooms and shuffle their placement. This is dramatically less
work than a room generator, and produces better rooms, because every one was
designed by a person. Revisit generation only if the hand-authored library
becomes the bottleneck, which it will not at this scale.

## Melee, not twin-stick

Isaac is twin-stick: move with one input, aim with another. On a phone that is
two virtual sticks, which is bad on a small screen and worse with thumbs
covering the play area.

Melee - attack in the facing direction, one button - keeps the control set at
"movement plus one button", which is what [../05-controls.md](../05-controls.md)
already specifies and what the touch layout was designed around. Mobile is the
stated priority, so this constraint wins.

## MVP - hard scope limit

A roguelite with three room types and two enemies is a tech demo. Isaac has
hundreds of items. The risk here is not building the wrong thing, it is
building a fraction of the right thing and stalling.

Smallest version that answers "is this fun":

1. Staging area, one screen, with one working content interactable
2. One tileset
3. One weapon
4. One enemy type
5. Eight hand-authored rooms, shuffled into a short run
6. A win state and a lose state, both returning to the staging area

Nothing else. No items, no upgrades, no meta-progression, no second enemy.

If moving and hitting things is not enjoyable at that scale, more content will
not fix it. If it is, everything after is additive and safe.

## Carried over unchanged

- Panels are DOM overlaid on the canvas, shared with the site
- Settings gate before play, audio defaulting low
- Hats as minigame rewards, with per-frame head anchors
- Content parity: anything in the game exists in static mode at a stable URL
- Minigames live in the staging area, bakery recipe game first

## Consequences

[../04-world-map.md](../04-world-map.md) is largely obsolete - the street, the
detail tiers, and the map edge. The isekai fall no longer has anything to fall
from; a roguelite run is arguably what that idea wanted to be anyway.

The asset list in [../assets/asset-list.md](../assets/asset-list.md) needs
rewriting around tilesets and rooms rather than facades and parallax.

Phase 0 decisions change: tile size (16x16 if following Kenney) now drives
everything, replacing character height as the anchor measurement.

## Open questions

- Does the staging area stay side-view for the storefront charm, or go
  top-down to match the runs? Mixing is possible but doubles the art.
- Do hats become run modifiers, or stay purely cosmetic?
- Is there meta-progression across runs, or is each run standalone? Standalone
  is far less work and appropriate at this scale.
- Traps: environmental hazards are cheap content and add variety without enemy
  AI. Worth front-loading over a second enemy type.
