const axios = require("axios");
const { XMLParser } = require("fast-xml-parser");
const fs = require("fs-extra");
const { chromium } = require("playwright");
const pLimit = require("p-limit");
const path = require("path");
const slugify = require("slugify");
const { getProjectPaths } = require("./utils");

const CONCURRENCY = 5;
const MAX_DISCOVERED_LINKS = 30;

function getSlug(url) {
  return slugify(url.replace(/^https?:\/\//, ""), {
    lower: true,
    strict: true,
  });
}

async function getSitemapUrls(browser, sitemapUrl) {
  const page = await browser.newPage();
  console.log(`Fetching sitemap: ${sitemapUrl}`);
  await page.goto(sitemapUrl, { waitUntil: "networkidle" });
  const content = await page.content();
  
  // Playwright might wrap XML in HTML/pre tags
  const xmlMatch = content.match(/<urlset[\s\S]*<\/urlset>/i);
  const xml = xmlMatch ? xmlMatch[0] : content;

  const parser = new XMLParser();
  const json = parser.parse(xml);
  await page.close();
  
  if (!json.urlset || !json.urlset.url) {
    throw new Error("Invalid sitemap format: could not find urlset.url");
  }

  const urls = Array.isArray(json.urlset.url) 
    ? json.urlset.url.map((u) => u.loc)
    : [json.urlset.url.loc];

  return urls;
}

function normalizeUrl(baseUrl, rawUrl) {
  try {
    return new URL(rawUrl, baseUrl).toString().split("#")[0];
  } catch {
    return null;
  }
}

async function discoverLinksFromHomepage(browser, websiteUrl) {
  const page = await browser.newPage();
  await page.goto(websiteUrl, { waitUntil: "networkidle" });

  const links = await page.$$eval("a[href]", (anchors) =>
    anchors.map((a) => a.getAttribute("href")).filter(Boolean),
  );

  await page.close();

  const base = new URL(websiteUrl);
  const normalized = links
    .map((link) => normalizeUrl(websiteUrl, link))
    .filter(Boolean)
    .filter((link) => {
      const candidate = new URL(link);
      return candidate.hostname === base.hostname;
    });

  const unique = [...new Set([websiteUrl, ...normalized])];
  return unique.slice(0, MAX_DISCOVERED_LINKS);
}

async function ensureDirs(htmlDir, screenshotDir) {
  await fs.ensureDir(htmlDir);
  await fs.ensureDir(screenshotDir);
}

async function processPage(browser, url, htmlDir, screenshotDir) {
  const page = await browser.newPage();
  const slug = getSlug(url);
  console.log(`Processing: ${url}`);

  try {
    await page.goto(url, { waitUntil: "networkidle" });

    const html = await page.content();
    const htmlPath = path.join(htmlDir, `${slug}.html`);
    await fs.outputFile(htmlPath, html);

    const screenshotPath = path.join(screenshotDir, `${slug}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    const title = await page.title();

    return { url, title, htmlPath, screenshotPath };
  } catch (err) {
    console.error(`Error processing ${url}:`, err.message);
    return { url, error: true };
  } finally {
    await page.close();
  }
}

async function main() {
  const websiteUrl = process.argv[2];
  const sitemapUrl = process.argv[3];

  if (!websiteUrl) {
    console.error(
      "Usage: node scripts/crawl.js <website_url> [sitemap_url_optional]",
    );
    process.exit(1);
  }

  const projectPaths = getProjectPaths(websiteUrl);
  const HTML_DIR = projectPaths.htmlDir;
  const SCREENSHOT_DIR = projectPaths.screenshotDir;
  const PAGES_FILE = projectPaths.pagesFile;

  await ensureDirs(HTML_DIR, SCREENSHOT_DIR);

  const browser = await chromium.launch();

  let urls = [];
  if (sitemapUrl) {
    try {
      urls = await getSitemapUrls(browser, sitemapUrl);
      console.log(`Found ${urls.length} URLs in sitemap`);
    } catch (err) {
      console.warn(
        `Sitemap fetch failed (${err.message}), falling back to homepage discovery`,
      );
    }
  }

  if (!urls.length) {
    urls = await discoverLinksFromHomepage(browser, websiteUrl);
    console.log(`Discovered ${urls.length} internal links from homepage`);
  }

  const limit = pLimit(CONCURRENCY);

  const tasks = urls.map((url) =>
    limit(() => processPage(browser, url, HTML_DIR, SCREENSHOT_DIR)),
  );

  const results = await Promise.all(tasks);

  await browser.close();

  await fs.writeJson(PAGES_FILE, results, { spaces: 2 });

  console.log("Crawl complete");
}

main();
