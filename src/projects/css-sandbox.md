---
title: "Sandbox Build (CS:S)"
date: 2026-09-12
description: "A community sandbox for Counter-Strike: Source, with prop-building tools, saved creations, and an arena for player-built forts."
category: Gaming
keywords: [CS:S, Counter-Strike, SourcePawn, EventScripts, MySQL, sandbox, gamemode, plugin]
featured: true
image: "/assets/img/projects/css-sandbox/snbx2.jpg"
imageAlt: "A large sailing ship assembled from props in Sandbox Build."
gallery:
  - src: "/assets/img/projects/css-sandbox/snbx2.jpg"
    alt: "A sailing ship built from props, with curved sails, a raised deck, and cannons along its sides."
    caption: "A ship build showing how individual props could become a much larger creation."
  - src: "/assets/img/projects/css-sandbox/snbx3.jpg"
    alt: "A green tank assembled from props, with the Sandbox building menu visible on the left."
    caption: "A tank build alongside the menu for rotating, moving, deleting, and coloring props."
  - src: "/assets/img/projects/css-sandbox/snbx1.jpg"
    alt: "A wooden house and deck beside a sandy platform in a blue building area."
    caption: "A house and deck built in the sandbox."
  - src: "/assets/img/projects/css-sandbox/snbx4.jpg"
    alt: "A first-person view from a buggy with a mounted weapon, with the customization menu visible."
    caption: "A buggy view with the server's customization menu open."
  - src: "/assets/img/projects/css-sandbox/snbx5.jpg"
    alt: "A giant green turtle beside a wall of transparent panels, with a pet-selection menu visible."
    caption: "A giant turtle and the pet-selection menu: another side of the server's playful atmosphere."
---

Sandbox Build was a building game mode for Counter-Strike: Source that grew into a community. Players used props from the Source engine to create, save, and share their own builds. Despite the engine's limitations, I was able to host a 12-player server that was regularly full.

I started the project in 2009, originally using EventScripts, and later rewrote it in SourcePawn for more efficient entity tracing. Early versions relied on `sv_cheats 1`. As I learned to program, I replaced that dependency with game-mode features, so the server could run without enabling cheats for everyone.

The community helped test new features, and seeing what players created with the tools I gave them was the most rewarding part. Each addition gave them another way to experiment, and gave me a reason to keep learning.

[Steam Community Group](https://steamcommunity.com/groups/SnBx)

**Skills I developed:** programming, community management, web and game-server administration, database design, and resource management.

## Building and playing

Players could spawn props from a menu, then rotate, move, and color them to create their own structures. Saving and loading meant they could return to a build later and show it to other players.

The arena added a combat side to building. Players could construct forts with windows and entrances, then test them in deathmatch and team battles.

## Working within the engine's limits

We were working with a limit of roughly 2,000 entities. That constrained the server to around 10–12 players: too many props could crash the server and lose unsaved builds.

Because I also created the maps, I could remove unnecessary map entities to leave more room for player creations. In later maps, I moved teleport-hub behavior into repeating game-mode logic and removed the original teleport entities on map load. Those maps consequently depended on the game mode to function as intended.

The hub moved players through a transition area so their clients could load props more gradually, rather than receiving over 1,000 networked entities at once.

I also introduced player tiers and prop limits. New players had restricted access to large props that were easy to spam. Administrators could use higher limits for ambitious builds, but we shared that capacity rather than assuming everyone would build at their maximum at the same time. Managing those limits helped make room for more players.

## Saving and loading builds

The first save system stored builds in text files using Valve's KeyValues format. As those files accumulated, I learned MySQL and moved build storage into a database. That made backups easier to manage and gave me recovery options when someone needed a build restored.

Loading used database transactions and a delayed prop-spawning sequence. A build with over 200 props would load gradually instead of appearing all at once and lagging the server. The player could not add more props until the loading sequence finished.

That overhaul also gave me more room to develop the server's statistics tracking.

## Media

Screenshots from the server show the range of things players could create.

{% projectGallery %}

[Watch the Sandbox Build video on YouTube](https://www.youtube.com/watch?v=Q_RsP-1dXL4).
