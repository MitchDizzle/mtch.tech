# mtch.tech

Mitch Gardner's personal site, branded as Mitchtopia. Built with Eleventy 3,
Nunjucks, Markdown, vanilla JavaScript, and CSS. No Vue or Vite build is used.

## Local development

Install Node.js (the installed Eleventy version requires Node 18 or newer), then:

```sh
npm ci
npm start
```

Eleventy builds the site, watches for changes, and serves it locally. Use the URL
printed in the terminal (normally http://localhost:8080).

```sh
npm run build
```

This removes the previous `_site/` output and generates a fresh production build.
`npm run clean` removes only `_site/`.

## Project structure

- `.eleventy.js`: collections, template filters, asset copying, SVG icon sprite.
- `src/index.njk`: title card, introduction, and main navigation.
- `src/site.njk`, `src/projects.njk`, `src/contact.njk`: main site pages.
- `src/projects/`: project Markdown and shared project layout/permalink defaults.
- `src/posts/`: blog Markdown and shared post defaults.
- `src/_data/`: site identity, social links, navigation, and skills.
- `src/_includes/`: layouts, reusable panels, and partials.
- `src/assets/`: CSS, JavaScript, icons, and images.
- `src/play.njk` and `src/assets/js/game/`: existing game prototype; replanning is pending.
- `src/overlay/`: OBS browser-source overlays.
- `stream-control/`: separate Node application; see its own README.
- `docs/`: design notes and decisions; start with `docs/10-audit-follow-up.md` for the latest direction.
- `_site/`: generated output; do not edit directly.

## Adding projects and posts

Create a Markdown file in `src/projects/` or `src/posts/`. The directory's JSON
file supplies the layout and permalink. Example project:

```yaml
---
title: "Project name"
date: 2026-09-10
description: "What the project does."
tags: [web, tooling]
featured: true
github_url: "https://github.com/mitchdizzle/repository"
---
```

Write the body below the frontmatter, using `##` for sections: the layout supplies
the page's `h1`. Projects may also specify `live_url` and `image`.
Posts use `title`, `date`, `description`, and `tags`; `image` is optional.
Listings are discovered automatically and sorted newest first.

## Metadata and styling

Public layouts share `src/_includes/partials/metadata.njk` for page titles,
descriptions, canonical URLs, Open Graph, and Twitter card metadata. Site-wide
fallbacks come from `src/_data/site.json`.

Previews currently provide text metadata. To add a preview image, place a PNG or
JPEG in `src/assets/img/` and set `socialImage: "/assets/img/your-preview.png"`
and `socialImageAlt` in page frontmatter, or as JSON fields in `site.json` for a
site-wide default. Use an actual raster image; the SVG wordmark is not used as a
social preview image.

Panel page titles use `h1`; dialogs use `h2`. Their appearance is controlled by
`.panel__title` in `src/assets/css/panel.css`, independently of heading level.
The homepage keeps its SVG wordmark inside an `h1` with image alternative text.

## Deployment

Run `npm run build` and upload the contents of `_site/` to the web root, including
`.htaccess`. The Apache configuration provides redirects, the custom 404 page,
compression, caching, and headers when supported by the host.

No deployment workflow is included in this checkout. Deployment automation must
be configured separately. Upload generated output only, not the repository,
`node_modules/`, or the separate stream-control application. For other hosts,
configure equivalents for the Apache rules as needed.
