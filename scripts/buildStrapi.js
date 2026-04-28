const fs = require("fs-extra");
const path = require("path");
const { spawnSync } = require("child_process");
const { getProjectPaths } = require("./utils");

async function writeComponentSchemas(strapiDir, components) {
  for (const [name, schema] of Object.entries(components)) {
    const target = path.join(
      strapiDir,
      "src/components/generated",
      `${name}.json`,
    );
    await fs.outputJson(target, schema, { spaces: 2 });
  }
}

async function writeContentType(strapiDir, pageSchema) {
  const target = path.join(
    strapiDir,
    "src/api/page/content-types/page/schema.json",
  );
  await fs.outputJson(target, pageSchema, { spaces: 2 });
}

async function writeSeedFile(strapiDir, normalized) {
  const records = (normalized.pages || []).map((p) => ({
    title: p.url === "/" ? "Home" : p.url.replace(/\//g, " ").trim(),
    sourceUrl: p.sourceUrl,
    sections: (p.layout || []).map((componentName) => ({
      component: componentName,
      props: normalized.components?.[componentName]?.props || [],
    })),
  }));

  await fs.outputJson(path.join(strapiDir, "seed/pages.json"), records, {
    spaces: 2,
  });
}

async function writeReadme(strapiDir) {
  const readme = `# Generated Strapi Project

Install and run:

1. npm install
2. npm run dev

Then import \`seed/pages.json\` into the \`Page\` collection type using the admin UI.
`;
  await fs.writeFile(path.join(strapiDir, "README.md"), readme);
}

async function main() {
  const websiteUrl = process.argv[2];
  if (!websiteUrl) {
    console.error("Usage: node scripts/buildStrapi.js <website_url>");
    process.exit(1);
  }

  const projectPaths = getProjectPaths(websiteUrl);
  const schema = await fs.readJson(projectPaths.schemaFile);
  const normalized = await fs.readJson(projectPaths.normalizedFile);
  const strapiDir = projectPaths.cmsDir;

  await fs.remove(strapiDir);
  const createResult = spawnSync(
    "npx",
    [
      "create-strapi-app@latest",
      strapiDir,
      "--js",
      "--use-npm",
      "--non-interactive",
      "--skip-cloud",
      "--no-run",
      "--no-example",
      "--dbclient",
      "sqlite",
      "--dbfile",
      ".tmp/data.db",
    ],
    { stdio: "inherit" },
  );
  if (createResult.status !== 0) {
    throw new Error("Failed to bootstrap Strapi project");
  }

  await writeComponentSchemas(strapiDir, schema.components || {});
  await writeContentType(strapiDir, schema.contentTypes.page);
  await writeSeedFile(strapiDir, normalized);
  await writeReadme(strapiDir);

  console.log(`Strapi project scaffold generated at ${strapiDir}`);
}

main();
