# Interactive mode

The site rendered as a 2D game. Navigation is movement; sections of the site are
places.

## Feasibility

Both a platformer and a beat-em-up are well within what HTML5 does. A 2D game of
this scale is a solved problem on the web - canvas rendering, sprite animation,
a fixed-timestep loop, tile collision, audio, and gamepad/touch input are all
standard browser capability, and mature engines package all of it. The hard part
of this project is not technical feasibility. It is content and scope.

## Genre - side-scrolling hub, beat-em-up presentation

**Decided in principle.** The deciding argument is art, not mechanics: the
motorcycle and the garage need to be recognisable, and a bike only reads as a
bike in side profile. Top-down turns it into a blob; a platformer reduces it to
scenery you run past. Side view puts it at the centre of a scene.

The structure is a single side-scrolling level acting as the site's hub. The
domains - software, games, motorcycles, baking - are places within it. Optional
secret areas branch off the main path and hold minigames.

### Why beat-em-up locomotion rather than platformer physics

This is cheaper, not more expensive. Beat-em-up movement is 8-directional travel
on a ground plane with faked depth (Final Fight, Streets of Rage): the character
walks left/right and also up/down within a shallow band, with draw order sorted
by Y.

What that removes: gravity, jump arcs, variable jump height, coyote time, ledge
detection, one-way platforms, fall damage, respawn logic. These are precisely the
systems that feel wrong when they are 90% right, and they are the bulk of what
makes a platformer hard to get feeling good.

What it adds: a foreground/background axis, which is better staging for a garage
or a kitchen than a platformer's single flat plane.

### Scope discipline

What is being built is a side-scrolling hub with beat-em-up *presentation* and
*optional* combat - not a beat-em-up in the full sense. This distinction is the
budget. It means the project does not owe anyone enemy variety, combo systems,
juggling, difficulty curves, or balance passes. Combat is a texture, not a
system. If combat becomes load-bearing, scope has escaped.

### Critical path rule

Projects, writing, and contact must be reachable on the main path without
finding anything. Secret areas hold minigames and bonus material only. If a
visitor has to discover a hidden door to reach the portfolio, static mode is
doing all the real work and the game is decoration.

### Parked ideas

- **Top-down roguelite.** Genuinely interesting, and a better fit for a
  roguelite than a side view is. Parked as a separate future project that
  happens to live on the same domain. It will be better if it does not also
  carry navigation duty. Possible candidate for one of the secret-area
  minigames later, at much smaller scale.

## Settings gate

A settings panel appears **before** the game starts. Non-negotiable, and
especially important on mobile where an unexpected burst of audio is hostile.

Must include:

- Music volume and SFX volume as separate controls, defaulting to off or very
  low. Never full volume on first load.
- Reduced motion / screen shake toggle.
- Control scheme selection where relevant.
- A visible, always-available exit to static mode. Someone who opens the game and
  immediately regrets it must not be stuck.

Settings persist for the session and ideally across visits, and should be
reachable again from a pause menu once play begins.

## Mobile controls

On-screen controls in the style of a handheld - d-pad on the left, action
buttons on the right, framing the play area rather than overlapping it where
screen height allows.

Constraints:

- Touch targets at least 44px, larger for the d-pad.
- Multi-touch required: moving and jumping simultaneously must work. This needs
  explicit pointer-event handling; naive touch handlers drop the second input.
- The controls must not sit where a thumb naturally rests over content.
- Suppress the browser's default touch behaviours over the play area - double-tap
  zoom, pull-to-refresh, text selection, and the iOS callout menu will all fire
  otherwise.
- Keyboard is the desktop path. Gamepad support is a nice-to-have, cheap to add
  via the Gamepad API, and not a priority.

## Performance and loading

- The game bundle and its assets must not load on the landing page. They load
  only after the visitor chooses interactive mode.
- Assume a mid-range phone on cellular data. Budget accordingly and show real
  loading progress rather than an indeterminate spinner.
- Frame-rate-independent movement via a fixed timestep. Do not tie physics to
  frame delivery.

## Content parity

Anything reachable in the game must also exist in static mode at a stable URL.
The game is a presentation layer, not a content silo. This keeps the site
crawlable, linkable, and honest.

## Open questions

- Engine - see [decisions/0001-game-engine.md](decisions/0001-game-engine.md).
  Genre is now settled, so this is unblocked.
- Art: pixel art is the obvious fit, but sourcing or making a consistent sprite
  set is the single largest unestimated cost in this whole project. The bike and
  garage are the pieces most worth spending effort on, since they are the reason
  the genre was chosen.
- Is there combat at all in v1, or does it arrive later once the hub works?
- How many secret areas, and how are they hinted? A secret nobody finds is
  wasted work.
- Does the level have an end, or does it loop / stay open?
- How does a visitor get from inside the game to a specific piece of writing -
  does the page open as an overlay, or does the game hand off to the static site?
- Does the player character represent Mitch, or is it deliberately anonymous?
