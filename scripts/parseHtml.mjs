import fs from "./fs.mjs";
import path from "path";
import { getProjectPaths } from "./utils.mjs";

function cleanHtml(html) {
  return (
    html
      // remove script tags
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      // remove style tags
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
      // remove comments
      .replace(/<!--[\s\S]*?-->/g, "")
      // remove inline base64 (very large blobs)
      .replace(/data:image\/[^;]+;base64,[^"]+/g, "")
      // keep only body content if present
      .replace(/^[\s\S]*?<body[^>]*>/i, "")
      .replace(/<\/body>[\s\S]*$/i, "")
      .trim()
  );
}

async function main() {
  const websiteUrl = process.argv[2];

  if (!websiteUrl) {
    console.error("Usage: node parseHtml.mjs <website_url>");
    process.exit(1);
  }

  const projectPaths = getProjectPaths(websiteUrl);
  const PAGES_FILE = projectPaths.pagesFile;
  const PARSED_DIR = projectPaths.parsedHtmlDir;

  await fs.ensureDir(PARSED_DIR);

  const pages = await fs.readJson(PAGES_FILE);

  for (const page of pages) {
    if (!page.htmlPath) continue;

    try {
      const html = await fs.readFile(page.htmlPath, "utf-8");
      const cleaned = cleanHtml(html);

      const fileName = path.basename(page.htmlPath);
      const outputPath = path.join(PARSED_DIR, fileName);

      await fs.writeFile(outputPath, cleaned);

      console.log("✅ Parsed:", page.url);
    } catch (err) {
      console.log("❌ Failed:", page.url);
    }
  }

  console.log("🎉 Parsed HTML saved in:", PARSED_DIR);
}

main();
