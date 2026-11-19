---
title: "IT Dungeon"
date: 2026-11-18
description: "A phone-first roguelite: defend a breached network with a weapon made of real Python, with an optional Security+, Networking, or Linux question each turn."
category: Gaming
keywords: [JavaScript, Python, roguelite, game design, Security+, networking, Linux, spaced repetition, Claude Code]
featured: true
image: "/assets/img/projects/it-dungeon/cover.webp"
imageAlt: "IT Dungeon's share card: a hooded defender at a laptop, the title, \"Defend the network with real Python\", and a network with an infection spreading through it."
live_url: "https://mtch.tech/itdungeon/"
# Written 2026-11-18 from the ITDungeon repo's README and docs. Still yours to
# write: why you built it. The repo is private, so there's no github_url.
gallery:
  - src: "/assets/img/projects/it-dungeon/fight.webp"
    alt: "A fight on a grid battlefield: a keylogger and a spam bot above, the hooded defender with 46 HP below, and attack(), patch() and snipe() in the dock beside End turn."
    caption: "A fight. Each function costs CPU, the icon over an enemy is its next move, and the striped end of the HP bar is what ending the turn will cost."
    width: 1280
    height: 720
  - src: "/assets/img/projects/it-dungeon/map.webp"
    alt: "Floor 1, The Inbox: a tree of folders from /mail down to a botnet boss, with a dashed symlink, and the next two fights listed below."
    caption: "Each floor is a directory tree you cd down. Dashed lines are symlinks, and the infection starts spreading after two moves."
    width: 1280
    height: 720
  - src: "/assets/img/projects/it-dungeon/title-incident-room.webp"
    alt: "The title screen in the Incident Room look: a live threat map above the title and a Start a run button."
    caption: "The title in the Incident Room look, the default."
    width: 1280
    height: 720
  - src: "/assets/img/projects/it-dungeon/title-terminal.webp"
    alt: "The title screen in the Terminal look: green text on black, a boot log, and the menu as shell commands."
    caption: "The Terminal look boots like an old PC, and the menu is shell commands."
    width: 1280
    height: 720
  - src: "/assets/img/projects/it-dungeon/title-dungeon.webp"
    alt: "The title screen in the Dungeon look: a stone wall with torches, the defender in a doorway, and a gold pixel logo."
    caption: "The Dungeon look: stone, torchlight, and a gold pixel logo."
    width: 1280
    height: 720
---

IT Dungeon is a turn-based roguelite I'm building to play in a phone's browser. A network has been breached, and you fight off real threats: phishers, worms, SQL injectors, cryptojackers, ransomware, a rootkit that hides from your loops, a DNS spoofer that redirects your hits, a zero-day nothing touches until you patch, an insider your shield doesn't stop, and a wiper that erases lines of your code.

Your weapon is real Python. You collect functions and run them with CPU each turn, and between fights you write a `main()` that spends whatever CPU you leave. Bad code costs you: a loop burns CPU for every enemy, and a missing indent is a real `IndentationError` that stops `main()` from running.

## How a run plays

- Five classes build toward crits, thorns, elements (Volt, Heat, Chill, Corrosion), automation, or luck with `randint()` dice. The first two are open from the start, and the rest unlock through achievements.
- Each floor is a map of folders you `cd` down. Routes split and merge, symlinks are shortcuts, `?` folders hold incidents, and an infection spreads a folder every move.
- Every enemy shows its next move, and the HP bar shows what ending the turn will cost.

## Quiz mode

Quiz mode puts one question at the start of each turn, from the pack you pick: Security+, Networking, or Linux. Right and fast makes it a crit turn. Wrong spawns a Bug in the fight. New facts come first, misses come back, and it aims for about 85% right. Every fact carries a short reason, checked against a real source, because a learning game that teaches something wrong is worse than none.

## How it's built

Plain JavaScript, HTML, and CSS, with no libraries and no build step. The rules never touch the page, so the tests and a stand-in player run them in Node. The stand-in plays whole runs and reports win rates for each class, which is how I check the balance. Every number lives in JSON: the tuning, the gear, the dungeon, and the question packs (93 Security+ facts, 41 Networking, 27 Linux). The code on the gear is the code that runs, in a subset of Python the game interprets, and a check parses every piece. A fight fits one phone screen with no scrolling.

There are three looks (Incident Room, Terminal, and a 16-bit Dungeon), an intro, music that follows the fight, and pixel-art icons drawn in code. I'm building it with Claude Code, working from written plans and a list of open decisions I answer as I play it.

## Media

{% projectGallery %}
