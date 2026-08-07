const { DateTime } = require("luxon");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

module.exports = function (eleventyConfig) {
  // Passthrough copies
  eleventyConfig.addPassthroughCopy("src/assets");

  // Server config files. Dotfiles need an explicit mapping — Eleventy will
  // not pick up .htaccess from a directory glob.
  eleventyConfig.addPassthroughCopy({ "src/.htaccess": ".htaccess" });
  eleventyConfig.addPassthroughCopy("src/robots.txt");

  // Cache busting.
  //
  // Appends a short content hash to an asset URL, so a changed file gets a
  // new URL and browsers and CDNs are forced to refetch it. Without this,
  // shipping a CSS change is invisible to anyone who has already visited —
  // the classic "it works locally but not on the live site" failure.
  //
  // The hash is content-based, not a timestamp, so rebuilding without
  // changing a file leaves its URL alone and the cache stays warm.
  const hashCache = new Map();
  eleventyConfig.addFilter("bust", (url) => {
    if (!url || typeof url !== "string") return url;
    if (hashCache.has(url)) return hashCache.get(url);

    const file = path.join(__dirname, "src", url.replace(/^\//, ""));
    let out = url;
    try {
      const hash = crypto
        .createHash("sha1")
        .update(fs.readFileSync(file))
        .digest("hex")
        .slice(0, 8);
      out = `${url}?v=${hash}`;
    } catch (err) {
      // Missing file: ship the plain URL rather than failing the build.
      console.warn(`[bust] could not hash ${file}`);
    }
    hashCache.set(url, out);
    return out;
  });

  // ---------------------------------------------------------------------
  // Icon sprite
  //
  // Every .svg in src/assets/icons/ becomes a <symbol id="i-<filename>">,
  // usable as <use href="#i-<filename>">. Drop a file in, use it; no path
  // data is ever copied by hand.
  //
  // Downloaded icons are not safe to inline verbatim, so each one is
  // normalised first — see the steps inline below.
  // ---------------------------------------------------------------------
  const ICON_DIR = path.join(__dirname, "src", "assets", "icons");

  function buildSymbol(file) {
    const name = path.basename(file, ".svg");
    let svg = fs.readFileSync(path.join(ICON_DIR, file), "utf8");

    // 1. Strip everything that cannot live inside a <symbol>.
    svg = svg
      .replace(/<\?xml[\s\S]*?\?>/gi, "")
      .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "");

    // 2. Pull the viewBox off the root <svg>. Without it the symbol has no
    //    coordinate system and renders at the wrong scale or not at all.
    const open = svg.match(/<svg\b[^>]*>/i);
    if (!open) return "";
    const viewBox = (open[0].match(/viewBox\s*=\s*["']([^"']+)["']/i) || [])[1];

    // Fall back to width/height when viewBox is missing, which is common in
    // exports from design tools.
    let vb = viewBox;
    if (!vb) {
      const w = (open[0].match(/\bwidth\s*=\s*["']?([\d.]+)/i) || [])[1];
      const h = (open[0].match(/\bheight\s*=\s*["']?([\d.]+)/i) || [])[1];
      vb = w && h ? `0 0 ${w} ${h}` : "0 0 24 24";
    }

    // 3. Inner markup only.
    let inner = svg
      .replace(/^[\s\S]*?<svg\b[^>]*>/i, "")
      .replace(/<\/svg>[\s\S]*$/i, "");

    // 4. <title> and <desc> would surface as tooltips and be announced by
    //    screen readers, duplicating the label the link already provides.
    inner = inner
      .replace(/<title\b[\s\S]*?<\/title>/gi, "")
      .replace(/<desc\b[\s\S]*?<\/desc>/gi, "");

    // 5. Namespace internal ids. Two icons that both define id="a" for a
    //    gradient or clipPath will silently collide once inlined on the same
    //    page, and the second one wins for both.
    inner = inner
      .replace(/\bid\s*=\s*["']([^"']+)["']/g, (m, id) => `id="${name}-${id}"`)
      .replace(/url\(\s*#([^)\s]+)\s*\)/g, (m, id) => `url(#${name}-${id})`)
      .replace(/(href|xlink:href)\s*=\s*["']#([^"']+)["']/g,
        (m, attr, id) => `${attr}="#${name}-${id}"`);

    // 6. Hardcoded black fills stop the icon inheriting the link's colour.
    //    fill="none" is left alone — it is structural on stroked icons.
    inner = inner.replace(
      /\bfill\s*=\s*["'](#0{3,8}|black|rgb\(0,\s*0,\s*0\))["']/gi,
      'fill="currentColor"'
    );

    return `<symbol id="i-${name}" viewBox="${vb}">${inner.trim()}</symbol>`;
  }

  eleventyConfig.addShortcode("iconSprite", () => {
    if (!fs.existsSync(ICON_DIR)) return "";
    return fs
      .readdirSync(ICON_DIR)
      .filter((f) => f.toLowerCase().endsWith(".svg"))
      .sort()
      .map(buildSymbol)
      .join("\n  ");
  });

  // True if an asset exists in src/. Lets a template use a hand-made file
  // when it is present and fall back to markup when it is not, without a
  // manual flag to remember to flip.
  eleventyConfig.addFilter("hasAsset", (url) => {
    if (!url || typeof url !== "string") return false;
    return fs.existsSync(path.join(__dirname, "src", url.replace(/^\//, "")));
  });

  // Filters
  eleventyConfig.addFilter("readableDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("LLLL d, yyyy");
  });

  eleventyConfig.addFilter("htmlDateString", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("yyyy-LL-dd");
  });

  eleventyConfig.addFilter("allTags", (collection) => {
    const tagSet = new Set();
    for (const item of collection) {
      for (const tag of (item.data.tags || [])) {
        tagSet.add(tag);
      }
    }
    return [...tagSet].sort();
  });

  // Collections
  eleventyConfig.addCollection("posts", (collectionApi) => {
    return collectionApi
      .getFilteredByGlob("src/posts/*.md")
      .sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("projects", (collectionApi) => {
    return collectionApi
      .getFilteredByGlob("src/projects/*.md")
      .sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("featuredProjects", (collectionApi) => {
    return collectionApi
      .getFilteredByGlob("src/projects/*.md")
      .filter((item) => item.data.featured === true)
      .sort((a, b) => b.date - a.date)
      .slice(0, 3);
  });

  eleventyConfig.addCollection("recentPosts", (collectionApi) => {
    return collectionApi
      .getFilteredByGlob("src/posts/*.md")
      .sort((a, b) => b.date - a.date)
      .slice(0, 3);
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    templateFormats: ["njk", "md", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
};
