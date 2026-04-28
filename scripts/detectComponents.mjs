import fs from "./fs.mjs";
import * as cheerio from "cheerio";
import path from "path";
import { getProjectPaths } from "./utils.mjs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function detectType(tagName, className = "", id = "") {
  const label = `${tagName} ${className} ${id}`.toLowerCase();
  if (label.includes("nav") || tagName === "nav") return "navbar";
  if (label.includes("hero")) return "hero";
  if (label.includes("footer") || tagName === "footer") return "footer";
  if (label.includes("faq")) return "faq";
  if (label.includes("testimonial")) return "testimonial";
  if (label.includes("feature")) return "feature-section";
  if (label.includes("card")) return "card-grid";
  if (label.includes("gallery")) return "gallery";
  if (label.includes("contact")) return "contact-section";
  if (label.includes("banner")) return "banner";
  return "section";
}

function inferProps(type, section) {
  const text = section.text().trim();
  const hasHeading = section.find("h1,h2,h3,h4").length > 0;
  const hasImage = section.find("img,picture").length > 0;
  const hasLinks = section.find("a").length > 0;
  const hasList = section.find("ul,ol").length > 0;

  const props = new Set();
  if (hasHeading) props.add("title");
  if (text.length > 0) props.add("description");
  if (hasImage) props.add("image");
  if (hasLinks) props.add("cta");
  if (hasList) props.add("items");

  if (type === "faq") {
    props.add("items");
    props.add("question");
    props.add("answer");
  }

  if (type === "testimonial") {
    props.add("quote");
    props.add("author");
  }

  return [...props];
}

async function main() {
  const websiteUrl = process.argv[2];

  if (!websiteUrl) {
    console.error("Usage: node detectComponents.mjs <website_url>");
    process.exit(1);
  }

  const projectPaths = getProjectPaths(websiteUrl);
  const PAGES_FILE = projectPaths.pagesFile;
  const OUTPUT_FILE = projectPaths.componentsFile;

  const PROMPT_FILE = path.join(__dirname, "../prompts/detect-components.txt");

  const basePrompt = await fs.readFile(PROMPT_FILE, "utf-8");
  const pages = await fs.readJson(PAGES_FILE);

  const results = [];

  for (const page of pages) {
    if (!page.htmlPath) continue;

    const parsedPath = page.htmlPath.replace(
      `${path.sep}html${path.sep}`,
      `${path.sep}parsed-html${path.sep}`,
    );
    const html = await fs.readFile(parsedPath, "utf-8");
    const $ = cheerio.load(html);
    const componentMap = new Map();

    $("header, nav, main section, footer, section, article").each((_, node) => {
      const el = $(node);
      const type = detectType(node.tagName || "section", el.attr("class"), el.attr("id"));
      const props = inferProps(type, el);
      if (!props.length) return;

      if (!componentMap.has(type)) {
        componentMap.set(type, new Set());
      }
      props.forEach((p) => componentMap.get(type).add(p));
    });

    if (componentMap.size === 0) {
      componentMap.set("section", new Set(["title", "description"]));
    }

    const components = [...componentMap.entries()].map(([type, props]) => ({
      type,
      props: [...props],
    }));

    const prompt = basePrompt
      .replace("{{URL}}", page.url)
      .replace("{{HTML}}", html.slice(0, 12000));

    results.push({
      page: page.url,
      promptUsed: prompt,
      components,
    });
  }

  await fs.writeJson(OUTPUT_FILE, results, { spaces: 2 });

  console.log("components.json created");
}

main();
