const slugify = require("slugify");
const path = require("path");

function getSiteName(url) {
  const domain = new URL(url).hostname;
  return slugify(domain, { lower: true });
}

function inferFieldType(prop) {
  const p = String(prop || "").toLowerCase();
  if (p.includes("image") || p.includes("icon") || p.includes("logo")) {
    return "media";
  }
  if (p.includes("description") || p.includes("content") || p.includes("body")) {
    return "text";
  }
  if (p.includes("items") || p.endsWith("list")) {
    return "json";
  }
  if (p.includes("url") || p.includes("link")) {
    return "string";
  }
  if (p.startsWith("is") || p.startsWith("has") || p.includes("enabled")) {
    return "boolean";
  }
  return "string";
}

function getProjectPaths(websiteUrl) {
  const siteName = getSiteName(websiteUrl);
  const rootDir = path.join(__dirname, `../output/${siteName}`);
  const docsDir = path.join(rootDir, "docs");

  return {
    siteName,
    rootDir,
    docsDir,
    htmlDir: path.join(docsDir, "html"),
    screenshotDir: path.join(docsDir, "screenshots"),
    parsedHtmlDir: path.join(docsDir, "parsed-html"),
    pagesFile: path.join(docsDir, "pages.json"),
    componentsFile: path.join(docsDir, "components.json"),
    normalizedFile: path.join(docsDir, "normalized.json"),
    schemaFile: path.join(docsDir, "schema.json"),
    frontendDir: path.join(rootDir, "frontend"),
    cmsDir: path.join(rootDir, "cms"),
  };
}

module.exports = {
  getSiteName,
  inferFieldType,
  getProjectPaths,
};
