---
title: "mtch.tech"
date: 2026-02-24
description: "Personal portfolio site built with Eleventy. Cards, tag filtering, dark theme."
tags:
  - web
  - devops
featured: true
github_url: "https://github.com/mitchdizzle/mtch.tech"
live_url: "https://mtch.tech"
---

This site — a personal portfolio rebuilt from a bare GitHub Pages template into a proper Eleventy-powered static site.

## What it does

- **Projects** and **Blog** listings driven by Markdown frontmatter
- Card-based grid with vanilla JS tag filtering (no framework)
- Single layout source of truth — nav, header, footer defined once
- Responsive dark theme using CSS custom properties

## Tech stack

- [Eleventy (11ty)](https://www.11ty.dev/) — static site generator
- Nunjucks — templating
- Vanilla CSS with custom properties
- GitHub Pages — hosting

## Why I built it

The old site was a GitHub Pages scaffold with placeholder text on every page. Rather than fill in static HTML across multiple files (and copy-paste nav changes forever), I migrated to Eleventy so content and layout are cleanly separated.
