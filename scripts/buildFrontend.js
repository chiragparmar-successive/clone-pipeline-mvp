const fs = require("fs-extra");
const path = require("path");
const { spawnSync } = require("child_process");
const { getProjectPaths } = require("./utils");

function renderPageComponent() {
  return `export default function PageRenderer({ page }) {
  if (!page) return null;

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>{page.title}</h1>
      {Array.isArray(page.sections) &&
        page.sections.map((section, index) => (
          <section key={index} style={{ marginTop: "1.5rem", padding: "1rem", border: "1px solid #eee", borderRadius: 10 }}>
            <h2 style={{ textTransform: "capitalize" }}>{section.component}</h2>
            <ul>
              {(section.props || []).map((prop) => (
                <li key={prop}>{prop}</li>
              ))}
            </ul>
          </section>
        ))}
    </main>
  );
}
`;
}

function renderApiClient() {
  return `const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

export async function fetchPages() {
  try {
    const res = await fetch(\`\${STRAPI_URL}/api/pages\`, { cache: "no-store" });
    if (!res.ok) {
      return [];
    }
    const json = await res.json();
    return (json.data || []).map((item) => item.attributes || item);
  } catch {
    return [];
  }
}
`;
}

function renderHomePage() {
  return `import { fetchPages } from "../lib/strapi";
import PageRenderer from "../components/PageRenderer";

export default async function HomePage() {
  const pages = await fetchPages();
  const home = pages[0];

  if (!home) {
    return <main style={{ padding: 24 }}>No content found in Strapi yet.</main>;
  }

  return <PageRenderer page={home} />;
}
`;
}

function renderLayout() {
  return `export const metadata = {
  title: "Generated Website",
  description: "Generated from source website and Strapi schema",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "Inter, Arial, sans-serif", margin: 0 }}>{children}</body>
    </html>
  );
}
`;
}

async function main() {
  const websiteUrl = process.argv[2];
  if (!websiteUrl) {
    console.error("Usage: node scripts/buildFrontend.js <website_url>");
    process.exit(1);
  }

  const projectPaths = getProjectPaths(websiteUrl);
  const frontendDir = projectPaths.frontendDir;

  await fs.remove(frontendDir);

  const createResult = spawnSync(
    "npx",
    [
      "create-next-app@latest",
      frontendDir,
      "--js",
      "--app",
      "--use-npm",
      "--yes",
      "--no-tailwind",
      "--eslint",
      "--import-alias",
      "@/*",
    ],
    { stdio: "inherit" },
  );
  if (createResult.status !== 0) {
    throw new Error("Failed to bootstrap Next.js project");
  }

  const packageJsonPath = path.join(frontendDir, "package.json");
  const packageJson = await fs.readJson(packageJsonPath);
  packageJson.scripts = packageJson.scripts || {};
  packageJson.scripts.dev = "next dev --webpack";
  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

  await fs.outputFile(path.join(frontendDir, "app/page.js"), renderHomePage());
  await fs.outputFile(path.join(frontendDir, "app/layout.js"), renderLayout());
  await fs.outputFile(
    path.join(frontendDir, "components/PageRenderer.js"),
    renderPageComponent(),
  );
  await fs.outputFile(path.join(frontendDir, "lib/strapi.js"), renderApiClient());
  await fs.outputFile(
    path.join(frontendDir, ".env.example"),
    "NEXT_PUBLIC_STRAPI_URL=http://localhost:1337\n",
  );

  console.log(`Next.js project scaffold generated at ${frontendDir}`);
}

main();
