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
