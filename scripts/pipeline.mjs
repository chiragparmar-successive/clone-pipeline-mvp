import { spawn } from "node:child_process";
import fs from "./fs.mjs";
import { getProjectPaths } from "./utils.mjs";

function runStep(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} failed with code ${code}`));
    });
  });
}

async function listFiles(dirPath) {
  try {
    const entries = await fs.readdir(dirPath);
    return entries;
  } catch {
    return [];
  }
}

async function validateOutputs(projectPaths) {
  const pages = await fs.readJson(projectPaths.pagesFile);
  const usablePages = pages.filter(
    (page) => page.htmlPath && page.screenshotDesktopPath && !page.error,
  );
  if (!usablePages.length) {
    throw new Error("No usable pages in docs/pages.json");
  }

  const desktopShots = await listFiles(
    `${projectPaths.screenshotDir}/desktop`,
  );
  const mobileShots = await listFiles(`${projectPaths.screenshotDir}/mobile`);
  const parsedHtml = await listFiles(projectPaths.parsedHtmlDir);

  if (!desktopShots.length || !mobileShots.length) {
    throw new Error("Missing desktop/mobile screenshots");
  }

  if (!parsedHtml.length) {
    throw new Error("Parsed HTML directory is empty");
  }

  return {
    totalPages: pages.length,
    usablePages: usablePages.length,
    parsedPages: parsedHtml.length,
    desktopScreenshots: desktopShots.length,
    mobileScreenshots: mobileShots.length,
  };
}

async function main() {
  const websiteUrl = process.argv[2];
  const sitemapUrl = process.argv[3];

  if (!websiteUrl) {
    console.error(
      "Usage: node scripts/pipeline.mjs <website_url> [sitemap_url_optional]",
    );
    process.exit(1);
  }

  const projectPaths = getProjectPaths(websiteUrl);
  const crawlArgs = ["scripts/crawl.mjs", websiteUrl];
  if (sitemapUrl) crawlArgs.push(sitemapUrl);

  console.log("Phase 1: crawl");
  await runStep("node", crawlArgs);

  console.log("Phase 2: parse html");
  await runStep("node", ["scripts/parseHtml.mjs", websiteUrl]);

  console.log("Phase 3: validate docs artifacts");
  const stats = await validateOutputs(projectPaths);

  console.log("Pipeline checks passed");
  console.log(
    JSON.stringify(
      {
        websiteUrl,
        site: projectPaths.siteName,
        docsDir: projectPaths.docsDir,
        stats,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Pipeline failed:", error.message);
  process.exit(1);
});
