# Controls

## Movement model

Beat-em-up locomotion: 8-directional movement on a ground plane with a shallow
depth band. The player walks left/right along the street and up/down within that
band. Draw order sorts by Y so walking "behind" a lamp post works.

No gravity, no jump, no platform collision. Collision is AABB overlap against a
walkable region plus solid props.

Movement must be frame-rate independent — fixed timestep, velocity in units per
second, never per frame.

## Verbs

The control set is deliberately small. Everything a visitor needs must be
reachable with movement plus one button.

| Verb | Purpose | Required in v1 |
| --- | --- | --- |
| Move | Walk the street and rooms | Yes |
| Interact | Doors, NPCs, objects, minigames, advancing dialogue | Yes |
| Pause / menu | Settings, hat inventory, exit to static mode | Yes |
| Attack | Optional combat texture | No — later |

`Interact` is context-sensitive: one button, meaning derived from what is in
range. Never require the player to choose between interaction types.

## Interaction prompt

When the player enters range of an interactable, show a prompt above it —
the button glyph plus a verb ("Enter", "Talk", "Read", "Play"). The prompt must
name the action, since it is the only affordance telling a non-gamer that
anything is possible.

Only one interactable can be prompted at a time. If ranges overlap, pick the
nearest by centre distance and do not flicker between them — add hysteresis so
standing on the boundary does not strobe the prompt.

## Desktop

- Movement: arrow keys and WASD, both live simultaneously.
- Interact: `E` and `Space` and `Enter`. All three. Different people reach for
  different keys and there is no cost to accepting all of them.
- Pause: `Escape`.
- Gamepad via the Gamepad API is cheap to add and worth doing, but not a v1
  blocker.

## Mobile

Handheld-style layout: directional control bottom-left, action buttons
bottom-right, framing the play area rather than covering it where screen height
allows.

Hard requirements:

- **Multi-touch.** Moving and interacting at once must work. Use pointer events
  with captured pointer IDs; naive `touchstart` handlers drop the second input.
  Test with two thumbs on a real device, not in a desktop emulator.
- **Touch targets** at least 44px, and the directional control larger — 100px+
  of active area with a smaller visual footprint is fine and feels better.
- **Analogue or 8-way, not 4-way.** A d-pad that only does cardinals makes the
  depth band frustrating.
- **Suppress default browser behaviour** over the play area: `touch-action: none`
  to kill scroll and double-tap zoom, `user-select: none`, and disable the iOS
  long-press callout. Pull-to-refresh firing mid-game is a guaranteed complaint.
- **Safe areas.** Respect `env(safe-area-inset-*)`. Controls must not sit under a
  home indicator or a notch.
- **Landscape and portrait.** Decide one. Locking to landscape is reasonable for
  a side-scroller but must be communicated, not enforced silently.

## Accessibility

- Full keyboard operability on desktop, including the pause menu and any
  minigame. No mouse-only interaction anywhere.
- Nothing may depend on reaction speed to reach site content. Minigames may be
  timed; doors, NPCs, and reading may not.
- Respect `prefers-reduced-motion` inside the game too: it should disable screen
  shake, camera bob, and parallax intensity, not just the landing page.
- Exit to static mode reachable from the pause menu at all times, including
  mid-minigame.

## Open questions

- Landscape lock, or support both orientations?
- Does the pause menu stop simulation, or is it a non-blocking overlay?
- Is there a run/sprint? The street may be long enough to want one — but it adds
  a second movement state to animate.
