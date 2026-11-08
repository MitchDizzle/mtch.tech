# Writing projects with images

Keep each write-up in `src/projects/<project-slug>.md`. Put its media in
`src/assets/img/projects/<project-slug>/`. This keeps existing URLs and automatic
project discovery intact. For example:

```text
src/projects/murder-at-the-mannor.md
src/assets/img/projects/murder-at-the-mannor/overview.webp
src/assets/img/projects/murder-at-the-mannor/karma-menu.webp
```

Copy `docs/project-template.md` into `src/projects/` with your project's filename
to start a new entry. The template has optional fields commented out so missing
images do not appear on the site. Fill in the writing prompts before publishing.

## Categories and search

Use one broad `category` per project: `Gaming`, `Web`, or `Software` are useful
starting points. Add a new category only when it helps group several projects.
`keywords: [TF2, SourcePawn, plugin]` supplies optional search terms without extra
badges. Search matches the title, description, category, and keywords; it does not
search the full write-up. Existing `tags` still work as search terms, with a broad
category inferred while you migrate older files.

## Details worth writing down

- When you originally built it, separately from when you wrote the article.
- Whether it is maintained, archived, or still playable, and what it needs to run.
- The idea that excited you and what made your version different.
- One creative mechanic, with a concrete example of how it changed a player's experience.
- Your contribution versus collaborators' work, including asset credits.
- A limitation or surprising bug, how you responded, and what you learned.
- Screenshots, clips, community feedback, or other evidence you still have; exact usage numbers are optional.
- What you would keep or change if you rebuilt it today.

These can be prose sections; no additional frontmatter fields are required.

## Cover and optional slideshow

`image` is the thumbnail for the Projects listing. It is not automatically placed
in the article. Use an inline image or the slideshow tag wherever the image belongs
in your story. Gallery entries are independent of the cover.

Add a list to the Markdown frontmatter, using the order you want shown:

```yaml
gallery:
  - src: "/assets/img/projects/murder-at-the-mannor/overview.webp"
    alt: "Players gathered at the start of a TF2 Murder round."
    caption: "The start of a round."
    width: 1600
    height: 900
  - src: "/assets/img/projects/murder-at-the-mannor/karma-menu.webp"
    alt: "The in-game menu displaying a player's karma status."
    caption: "Karma influences which roles a player can receive."
```

The paths above are examples; add your own files before enabling them. Width and
height are optional and should be the image's actual pixel dimensions. Every
image should have descriptive `alt` text. Captions explain why an image matters.

Place this tag on its own line, with blank lines around it, wherever you want the
slideshow to appear (after a summary, in Media, or at the end):

```njk
{% projectGallery %}
```

The tag uses this project's `gallery` list. Without the tag, no slideshow is
inserted. With no gallery images, the tag produces no visible content.

Two or more images get a compact Previous / Pause–Play / Next tab over the bottom
center of the image. Clicking the image also toggles playback. The top-right
expand icon opens the gallery fullscreen when supported, or opens the current
image file as a fallback. The slide count is available to screen readers without a
visible label. Slides advance every five seconds, pausing on hover, keyboard
focus, while offscreen, or when the browser tab is hidden. Reduced-motion
preferences start the slideshow paused; Play can explicitly enable it. Arrow keys
work when focus is inside the slideshow. Centered, muted captions sit below the
image without an enclosing box. Images fit inside a
consistent frame without cropping. Without
JavaScript, all images remain readable in order. One image has no extra controls;
omitting `gallery` creates no empty slideshow.

## Inline images

Ordinary Markdown images resize to the article width and retain their proportions:

```markdown
![The karma menu showing role eligibility.](/assets/img/projects/murder-at-the-mannor/karma-menu.webp)
```

For captions, use this shortcode on its own line, with blank lines around it:

```njk
{% projectImage "/assets/img/projects/murder-at-the-mannor/karma-menu.webp", "The karma menu showing role eligibility.", "Players can check their standing between rounds." %}
```

Use the optional `"small"` argument for a narrow screenshot or diagram:

```njk
{% projectImage "/assets/img/projects/murder-at-the-mannor/karma-menu.webp", "The karma menu.", "Role eligibility at a glance.", "small" %}
```

Inline figures are centered with subtle borders and matching caption typography.
They do not float beside text, so the reading order stays predictable on phones.
The shortcode accepts local `/assets/` paths and plain-text captions.

## Other media and publishing

- Add ordinary Markdown links for videos, playable demos, downloadable files, or source code. Video embedding is not part of this image component.
- Choose meaningful filenames, such as `karma-menu.webp`, rather than `image-04.webp`.
- Resize and compress large originals before adding them; the site copies images without automatic optimization. WebP works for photos/screenshots; PNG is useful for fine text or transparency.
- Run `npm start` to preview locally, then `npm run build` when ready to upload `_site/`.
- These features are available immediately, but existing projects will not gain a slideshow until you add their media and frontmatter.
