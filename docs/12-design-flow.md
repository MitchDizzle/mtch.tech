# Site design and reading flow

Confirmed September 12, 2026. These preferences supersede earlier gallery layout notes.

- Mitchtopia is a personal site. Keep the SVG title card and the compact fantasy-panel design.
- Keep existing window animation speed. The homepage entrance timing was shortened separately.
- Project pages start with the project title and the author's introduction. Do not force a hero image, slideshow, publication date, or category ahead of the writing.
- The `image` field supplies the listing thumbnail. The author chooses inline image and slideshow placement in Markdown.
- Insert a slideshow using `{% projectGallery %}` on a separate line. Sandbox places it in its Media section.
- Use a small translucent playback tab over the bottom center of the image: previous, pause/play, next. Put the expand/fullscreen icon at the top right. Keep centered SVG icons and comfortable click targets.
- Clicking the image toggles playback. Keep full-size viewing as a separate action.
- Current content direction: homepage keeps the title card with a short professional summary; About tells the longer story, including game-server origins, current work, working style, and personal interests. A portrait is optional. Final wording is still to be written by the user.
- No visible image count is needed. A screen-reader status may announce manual slide changes.
- Captions are centered, muted, and borderless, with a small gap beneath the image. Keep their height stable across slides and avoid nesting another box below the photograph.
- Expand and playback controls share the same warm accent and translucent hover/focus highlight.
- Keep section headings in the existing font, with warm accent color, stronger weight, and a subtle underline divider.
- Place publication date and category at the end of the article. Label the date Published; do not imply it is the project date. Keywords are for search, not badges in the article.
- Before completing a visual change, check the opening paragraph, surrounding sections, media controls, captions, and footer together. Verify both desktop and phone layouts, keyboard actions, and playback behavior.

Skills can package reusable workflows across projects. For this site's ongoing
preferences, the root `AGENTS.md` points here so future work starts with the same
context. Keep this document brief and update it when preferences change.
