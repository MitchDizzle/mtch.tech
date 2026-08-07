# 0002 - Keep Eleventy as the build tool

- **Status:** Accepted
- **Date:** 2026-08-02

## Context

The site is being rebuilt around a hand-authored panel component, custom CSS, and
eventually a canvas game. That raised a fair question: is a Node-based static
site generator still earning its place, or is the repo carrying tooling it no
longer needs?

## Decision

Keep Eleventy 3.

## Reasoning

**Eleventy is a build-time tool that ships no runtime.** The deployed artifact is
already plain HTML, CSS, and JS with zero framework code in the browser. Removing
Eleventy would not make the output more static; it would only move work from the
build step to hand-authoring. "Node.js project" describes the development
machine, not the site.

**The panel wraps every page.** Without templates, changing the panel markup or
the border treatment means editing every HTML file by hand. This is precisely the
duplication templates exist to prevent, and the panel is the site's signature
component - it will change.

**There is markdown content and there will be more.** Posts and projects already
exist as markdown collections. Hand-authoring article HTML is the thing people
build static site generators to stop doing.

**The street layout manifest wants a data file.** The plan in
[../04-world-map.md](../04-world-map.md) is for storefront order, positions,
detail tiers, and door-to-section mappings to live in one manifest that both the
game and the static navigation read. An Eleventy `_data` file is exactly that,
and it can emit JSON for the game at build time.

## Repo state at time of decision

Checked and healthy - no restructuring needed:

- `node_modules` and `_site` are gitignored and untracked.
- Build runs clean in roughly 5 seconds.
- Total template code is ~308 lines across 13 files.

One bug found and fixed: `.eleventy.js` required `luxon` while `package.json`
did not declare it. It resolved only because Eleventy pulls luxon in
transitively, which would break on a fresh install or an Eleventy version bump.
Added as an explicit devDependency.

## Cleanup still outstanding

Content and templates from the previous iteration are being scrapped per the
project brief, but that is content work, not restructuring. Candidates:

- `src/_data/skills.json` - a skills-grid list from the old design. Keep only if
  a skills display survives into the new one.
- Existing layouts and partials will mostly be replaced by the panel component
  rather than edited.

## Consequences

The build step stays, which means deploys need a Node environment or a host that
runs one. Every static host worth using does this natively.

## Future: bakery ordering system

A static site generator does not block this. The ordering system will be a
separate dynamic service - serverless functions or a small API with its own
database - that the static pages talk to. Eleventy renders the storefront; it
does not need to render the orders. Revisit as its own ADR when that work starts.
