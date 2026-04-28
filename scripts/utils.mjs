import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function toSlug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getSiteName(url) {
  const domain = new URL(url).hostname;
  return toSlug(domain);
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
    frontendDir: path.join(rootDir, "frontend"),
    cmsDir: path.join(rootDir, "cms"),
  };
}

export {
  getSiteName,
  getProjectPaths,
};
