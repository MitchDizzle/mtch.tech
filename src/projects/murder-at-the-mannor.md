---
title: "MatM (TF2 Murder)"
date: 2026-02-26
description: "TF2 Gamemode were selected players are covert killers"
tags:
  - gaming
  - tf2
  - source
  - plugin
  - gamemode
featured: true
github_url: "https://github.com/mitchdizzle/MurderAtTheMannor"
---

Murder at the Mannor is a Fast paced gamemode for Team-Fortress 2 where all players are spies and must find out who is on the opposite team, the Murderers. A select few are chosen at the start of the round for conceal carry a gun, the Sheriffs. It's their job to find the Murderers and kill them before they wipe out the bystanders. However if a sheriff dies hope is not lost, as a bystander can then pick up the gun that dropped to the ground. 'Artifacts' around the map are spawned in during the round and can heal and if enough are collected will give a bystander a gun to defend themselves. The guns only had one bullet

## Gameplay Loop

- All players are spawned in randomly around the map and set to the Red team. This gives time for the players to navigate around the map and to get familiar with the Artifact spawn positions.

## Karma System & Role Selection

The role selection relied on the karma of a player, a value assigned to the player and saved inbetween sessions. This value would prevent a player from being selected to start off as a sheriff role, and in more extreme cases prevent them from being selected as a Murderer. The karma would be impacted on bad shots by the sheriff, while these can be accidents we would get newer players that did not read how to play and shoot teammates. Shooting a bystander is a quick way to confirm if they are not a murderer, however in a smaller player count this can ruin the gameplay loop. Players could check their karma status, and only regular players could see the actual value. Each round they play through it would slowly increase the karma.

The role selection was karma weighted, so the 'higher' amount of karma the player had then they had a better chance to be selected. This weight also includes if they have been a special role recently to prevent from from being selected often, however it is still possible by luck of the draw. Players could change a preference to reduce the amount they are a special role.

## Murderer Classes



## Why I built it

This gamemode was initially supposed to be TTT (Trouble in Terrorist Town) remake for TF2, however a GMod gamemode 'Murder' had more interest in the game. Due to the ability of the gamemode to administrate itself for the most part it was a benefit. There was already a Murder gamemode that was created however there were some glaring issues with exploits and hit registration that encouraged writing the gamemode from scratch. 


## Media

YouTube Videos:
Screenshots: 