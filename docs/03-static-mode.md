# Static mode

The conventional version of the site. Fast, accessible, linkable, crawlable.

## Framing

Static mode is not a degraded fallback and should not read as one. It is the
version that gets linked from a résumé, indexed by search engines, opened on a
train with one bar of signal, and used by anyone on assistive technology. It
will almost certainly receive more traffic than the game.

Treating it as the serious version is what makes the interactive version free to
be strange. If the static site is thin, the game has to carry the whole site,
and then the game can never be optional.

## Requirements

- Every piece of content on the site has a stable URL here.
- No JavaScript required to read anything.
- Works fully at `prefers-reduced-motion: reduce`.
- Reachable directly without passing through the landing page choice.

## Relationship to the existing site

The current `reimagined` branch is an Eleventy 3 site with `posts` and
`projects` collections, a tag filter, and page/post/project layouts. That
structure is a reasonable base for static mode — it mostly needs the content
model extended so an item can declare which domain it belongs to (software,
games, motorcycles, baking) and, later, where it sits in the game world.

Adding a `domain` field to front matter and deriving collections from it is
cheaper than building four parallel section trees, and it keeps cross-domain
items possible — a piece can belong to more than one.

## Open questions

- Does static mode use the same navigation structure for all four domains, or
  does the software section stay the front door?
- Is the writing one blog with domain tags, or four separate streams?
- What does the landing page look like for someone who arrives at a deep URL and
  never saw the mode choice?
