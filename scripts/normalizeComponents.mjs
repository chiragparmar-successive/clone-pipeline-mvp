import fs from "./fs.mjs";
import path from "path";
import { getProjectPaths } from "./utils.mjs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function toPagePath(rawUrl) {
  try {
    const u = new URL(rawUrl);
    return u.pathname || "/";
  } catch {
    return rawUrl;
  }
}

async function main() {
  const websiteUrl = process.argv[2];

  if (!websiteUrl) {
    console.error("Usage: node normalizeComponents.mjs <website_url>");
    process.exit(1);
  }

  const projectPaths = getProjectPaths(websiteUrl);
  const COMPONENTS_FILE = projectPaths.componentsFile;
  const OUTPUT_FILE = projectPaths.normalizedFile;

  const PROMPT_FILE = path.join(
    __dirname,
    "../prompts/normalize-components.txt",
  );

  const components = await fs.readJson(COMPONENTS_FILE);
  const basePrompt = await fs.readFile(PROMPT_FILE, "utf-8");

  const prompt = basePrompt.replace(
    "{{COMPONENTS}}",
    JSON.stringify(components, null, 2).slice(0, 20000),
  );

  const componentMap = {};
  const pages = [];

  for (const pageResult of components) {
    const layout = [];
    for (const component of pageResult.components || []) {
      if (!component.type) continue;
      if (!componentMap[component.type]) {
        componentMap[component.type] = { props: [] };
      }

      const merged = new Set([
        ...componentMap[component.type].props,
        ...(component.props || []),
      ]);
      componentMap[component.type].props = [...merged];
      layout.push(component.type);
    }

    pages.push({
      url: toPagePath(pageResult.page),
      sourceUrl: pageResult.page,
      layout: [...new Set(layout)],
    });
  }

  await fs.writeJson(
    OUTPUT_FILE,
    {
      generatedBy: "normalizeComponents.js",
      promptUsed: prompt,
      components: componentMap,
      pages,
    },
    { spaces: 2 },
  );

  console.log("normalized.json created");
}

main();
