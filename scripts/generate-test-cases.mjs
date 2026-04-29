import path from "node:path";
import fs from "./fs.mjs";
import { getProjectPaths } from "./utils.mjs";

function slugFromHtmlPath(htmlPath, fallback = "home") {
  const file = path.basename(htmlPath || "");
  const stem = file.replace(/\.html$/i, "");
  return stem || fallback;
}

function routeFromUrl(url, websiteUrl) {
  try {
    const route = new URL(url).pathname || "/";
    return route === "" ? "/" : route;
  } catch {
    try {
      const route = new URL(url, websiteUrl).pathname || "/";
      return route === "" ? "/" : route;
    } catch {
      return "/";
    }
  }
}

function toTestCase(page, websiteUrl, index) {
  const id = `route-${index + 1}-${slugFromHtmlPath(page.htmlPath, "page")}`;
  const route = routeFromUrl(page.url, websiteUrl);
  const severity = route === "/" ? "critical" : "major";

  return {
    id,
    route,
    severity,
    waitFor: { selector: "body", timeoutMs: 10000 },
    checks: [
      { type: "selector_visible", selector: "body" },
      { type: "title_contains", text: String(page.title || "").trim() || " " },
    ],
  };
}

async function main() {
  const websiteUrl = process.argv[2];
  if (!websiteUrl) {
    console.error("Usage: node scripts/generate-test-cases.mjs <website_url>");
    process.exit(1);
  }

  const projectPaths = getProjectPaths(websiteUrl);
  const pages = await fs.readJson(projectPaths.pagesFile);
  const usablePages = pages.filter((page) => page && page.url && !page.error);

  if (!usablePages.length) {
    throw new Error("No usable pages found in docs/pages.json");
  }

  const aiTestsDir = path.join(projectPaths.docsDir, "ai-tests");
  const testCasesPath = path.join(aiTestsDir, "test-cases.json");
  await fs.ensureDir(aiTestsDir);

  const testCases = usablePages.map((page, index) =>
    toTestCase(page, websiteUrl, index),
  );

  await fs.writeJson(testCasesPath, { tests: testCases }, { spaces: 2 });

  console.log(
    JSON.stringify(
      {
        websiteUrl,
        testCasesPath,
        totalTests: testCases.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Failed to generate test cases:", error.message);
  process.exit(1);
});
