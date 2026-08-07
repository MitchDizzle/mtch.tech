# Vision

## The problem with the obvious version

A personal site with four tiles - Software, Games, Motorcycles, Baking - is the
default move. It reads as a menu rather than as a person, and it walls the
interests off from each other. The interesting part of this particular set of
hobbies is that they overlap: a carburetor rebuild and a distributed system are
both debugging, bread is a chemistry-and-timing problem, game modding is
software. The site should let those touch rather than partition them.

## The concept

The landing page is deliberately plain. It does one thing: name the site, then
offer the visitor a choice of how they want to experience it.

Two modes, presented as equals:

- **Interactive** - the site rendered as a 2D game. Navigation is movement.
- **Static** - the same content as a conventional, fast, accessible website.

The fork is the idea. Most portfolio sites that go heavy on interaction either
punish visitors who just want the résumé, or hedge so hard the interaction is
pointless. Offering the choice up front removes that tension: the game can be
genuinely game-like because nobody is trapped in it, and the static version can
be genuinely plain because it isn't carrying the personality burden alone.

## Audience

Not yet settled. The two-mode fork partially defuses the question - the static
mode serves recruiters, the interactive mode serves everyone else including
Mitch. But it should still be named explicitly before content is written, since
it determines tone.

## Platform priority

Mobile-first. The landing animation, the mode selection, and the game controls
are all designed at small-screen size and scaled up. Desktop at 1080p is the
scale-up case, not the design target.

## Future scope

A bakery ordering system for selling baked goods from home is a longer-term
goal. It is not part of this rebuild, but the architecture should not make it
painful later - specifically, the site should be able to gain a dynamic,
authenticated, stateful section without the static-site generator becoming an
obstacle. See `decisions/` when that decision is taken.

## Open questions

- Primary audience.
- Does the mode choice persist across visits, and if so, how is it reset?
- Does the interactive mode contain content the static mode does not? (Leaning
  no - content parity keeps both honest and keeps the static version crawlable.)
