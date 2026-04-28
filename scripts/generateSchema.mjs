import fs from "./fs.mjs";
import path from "path";
import { inferFieldType, getProjectPaths } from "./utils.mjs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function buildStrapiAttributes(props) {
  const attributes = {};
  for (const prop of props) {
    attributes[prop] = { type: inferFieldType(prop) };
  }
  return attributes;
}

async function main() {
  const websiteUrl = process.argv[2];
  if (!websiteUrl) {
    console.error("Usage: node scripts/generateSchema.mjs <website_url>");
    process.exit(1);
  }

  const projectPaths = getProjectPaths(websiteUrl);
  const normalizedFile = projectPaths.normalizedFile;
  const outputFile = projectPaths.schemaFile;
  const promptFile = path.join(__dirname, "../prompts/generate-schema.txt");

  const normalized = await fs.readJson(normalizedFile);
  const prompt = (await fs.readFile(promptFile, "utf-8")).replace(
    "{{NORMALIZED}}",
    JSON.stringify(normalized, null, 2).slice(0, 20000),
  );

  const components = {};
  for (const [name, data] of Object.entries(normalized.components || {})) {
    const schemaName = String(name).replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase();
    components[schemaName] = {
      collectionName: `components_${schemaName}`,
      info: { displayName: schemaName },
      attributes: buildStrapiAttributes(data.props || []),
    };
  }

  const pageAttributes = {
    title: { type: "string" },
    slug: { type: "uid", targetField: "title" },
    sourceUrl: { type: "string" },
    sections: { type: "json" },
  };

  const schema = {
    generatedBy: "generateSchema.js",
    promptUsed: prompt,
    components,
    contentTypes: {
      page: {
        kind: "collectionType",
        collectionName: "pages",
        info: { singularName: "page", pluralName: "pages", displayName: "Page" },
        options: { draftAndPublish: true },
        attributes: pageAttributes,
      },
    },
  };

  await fs.writeJson(outputFile, schema, { spaces: 2 });
  console.log("schema.json generated");
}

main();
