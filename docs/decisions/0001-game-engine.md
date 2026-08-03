# 0001 — 2D engine for interactive mode

- **Status:** Proposed. Not decided.
- **Date:** 2026-07-28
- **Unblocked:** genre settled as a side-scrolling hub with beat-em-up
  locomotion — see [../02-interactive-mode.md](../02-interactive-mode.md)

## Context

Interactive mode needs a 2D rendering and game loop layer. It must run inside an
Eleventy-generated static site as a bundle loaded on one route, work on
mid-range phones over cellular, and support touch input, audio with independent
music/SFX buses, and sprite animation.

The genre decision changes what the engine has to provide. Beat-em-up
locomotion — 8-directional movement on a ground plane with Y-sorted draw order —
needs no gravity, no jump arcs, and no tile-based platform collision. Collision
is AABB overlap on a walkable band.

That is a materially lower bar than a platformer. Phaser's arcade physics, one of
its main selling points, is largely unused by this design. The requirements that
actually matter here are sprite/animation handling, draw-order sorting by depth,
an audio system with separate buses, scene management, and solid multi-touch
input.

## Options

### Phaser

The largest 2D web ecosystem and the most documentation, tutorials, and answered
questions. Batteries included: arcade physics, tilemap loading, scene management,
input, audio, particles. Roughly 500 KB, which is the cost of that coverage.

Best fit if the game is a real platformer and the priority is not fighting the
engine.

### Excalibur

TypeScript-first with a clean actor/scene model and an opinionated structure.
Roughly 300 KB. Smaller community than Phaser, so fewer worked examples when
something goes wrong, but strong typing and good docs.

Best fit if the value of a well-typed, structured codebase outweighs ecosystem
size — plausible here, since the site doubles as a portfolio piece.

### Kaplay

Community-maintained continuation of Kaboom.js. Declarative, playful API; very
fast from zero to a moving character; no build step needed. Aimed at jams,
teaching, and prototypes.

Best fit for prototyping the feel of the game cheaply before committing, and
possibly for shipping if the game stays small.

### PixiJS + hand-rolled game layer

Pixi is a renderer, not an engine — fast and small, but collision, physics,
scenes, and input are all yours to write. Maximum control, maximum work.

Only worth it if the "game" turns out to be light enough that an engine is
overhead, or if the hand-rolled loop is itself the portfolio point.

### Plain Canvas 2D

No dependency at all. Entirely viable for a top-down explorer or a very simple
platformer, and the smallest possible bundle. Everything is hand-written.

## Recommendation

Now that the genre is settled, Phaser's main advantage (arcade physics and
tilemap platforming) is mostly irrelevant to this design, and its ~500 KB is
harder to justify against a mobile-first, cellular-data target.

Prototype in Kaplay to prove the feel of the walk-and-depth movement and the
touch controls. That is the cheapest way to find out whether the hub is fun to
move around in, which is the only question that matters before art is
commissioned.

Then decide between:

- **Excalibur** if the prototype shows the project wants structure — TypeScript
  actors and scenes, ~300 KB, and a codebase that reads well as a portfolio
  artifact in its own right.
- **Kaplay shipped as-is** if the hub stays small and the prototype is already
  close to right. Fewer moving parts than migrating for its own sake.
- **Phaser** only if something in the prototype turns out to need the ecosystem —
  a specific plugin, an asset pipeline, or a solved problem nobody else has
  solved.

Excalibur is the current front-runner for the shipped version.

## Consequences

Deferring the final call costs nothing, since the landing page and static mode
can be built first and neither depends on the engine.

The risk is prototype code becoming shipped code by default. That is an
acceptable outcome here if it is chosen deliberately — but it must be chosen.
Mark the prototype as disposable in its README, and revisit this ADR once the
movement feels right rather than letting the decision lapse.

The larger risk is that art, not engine, is the critical path. No engine choice
mitigates the cost of a consistent sprite set for a character, a garage, a
kitchen, and a recognisable motorcycle.

## Sources

- [Top JavaScript Game Engines & Libraries (2026)](https://codersera.com/blog/top-javascript-game-engines-and-libraries/)
- [11 Best Web Game Engines for 2026](https://app.cinevva.com/guides/web-game-engines-comparison.html)
- [JS game rendering benchmark](https://github.com/Shirajuki/js-game-rendering-benchmark)
