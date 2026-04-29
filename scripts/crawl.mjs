import { XMLParser } from "fast-xml-parser";
import fs from "./fs.mjs";
import pLimit from "p-limit";
import { chromium } from "playwright";
import path from "path";
import { getProjectPaths } from "./utils.mjs";

const CONCURRENCY = 5;
const MAX_CRAWL_PAGES = 120;
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 2200 },
  { name: "mobile", width: 390, height: 844 },
];

function getSlug(url) {
  return String(url || "")
    .replace(/^https?:\/\//, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function getSitemapUrls(browser, sitemapUrl) {
  const parser = new XMLParser();
  const visited = new Set();

  async function readSitemap(currentSitemapUrl) {
    if (visited.has(currentSitemapUrl)) return [];
    visited.add(currentSitemapUrl);

    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    console.log(`Fetching sitemap: ${currentSitemapUrl}`);
    await page.goto(currentSitemapUrl, { waitUntil: "networkidle" });
    const content = await page.content();
    await page.close();

    const xmlMatch = content.match(
      /<(urlset|sitemapindex)[\s\S]*<\/(urlset|sitemapindex)>/i,
    );
    const xml = xmlMatch ? xmlMatch[0] : content;
    const json = parser.parse(xml);

    if (json.urlset && json.urlset.url) {
      const urls = Array.isArray(json.urlset.url)
        ? json.urlset.url.map((u) => u.loc)
        : [json.urlset.url.loc];
      return urls.filter(Boolean);
    }

    if (json.sitemapindex && json.sitemapindex.sitemap) {
      const childSitemaps = Array.isArray(json.sitemapindex.sitemap)
        ? json.sitemapindex.sitemap.map((s) => s.loc)
        : [json.sitemapindex.sitemap.loc];

      const nestedResults = await Promise.all(
        childSitemaps.filter(Boolean).map((child) => readSitemap(child)),
      );
      return nestedResults.flat();
    }

    throw new Error(
      "Invalid sitemap format: could not find urlset or sitemapindex",
    );
  }

  return readSitemap(sitemapUrl);
}

function normalizeUrl(baseUrl, rawUrl) {
  try {
    const normalized = new URL(rawUrl, baseUrl);
    normalized.hash = "";
    return normalized.toString();
  } catch {
    return null;
  }
}

function isCrawlableUrl(url, hostname) {
  const candidate = new URL(url);
  return (
    candidate.hostname === hostname &&
    !/\.(pdf|zip|jpg|jpeg|png|webp|gif|svg|mp4|webm)$/i.test(
      candidate.pathname,
    )
  );
}

function canonicalizeUrl(url) {
  const candidate = new URL(url);
  // Remove common tracking params to reduce duplicate pages in crawl output.
  const trackingParams = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "gclid",
    "fbclid",
  ];
  for (const key of trackingParams) {
    candidate.searchParams.delete(key);
  }
  return candidate.toString().replace(/\/$/, "");
}

function getCrawlTargets(websiteUrl, urls) {
  const base = new URL(websiteUrl);
  const deduped = new Set();

  for (const rawUrl of urls) {
    const normalized = normalizeUrl(websiteUrl, rawUrl);
    if (!normalized) continue;
    if (!isCrawlableUrl(normalized, base.hostname)) continue;
    deduped.add(canonicalizeUrl(normalized));
    if (deduped.size >= MAX_CRAWL_PAGES) break;
  }

  return Array.from(deduped);
}

async function discoverLinksFromHomepage(browser, websiteUrl) {
  const base = new URL(websiteUrl);
  const queue = [websiteUrl];
  const queued = new Set(queue);
  const seen = new Set();
  const discovered = [];

  while (queue.length > 0 && discovered.length < MAX_CRAWL_PAGES) {
    const current = queue.shift();
    if (!current || seen.has(current)) continue;
    seen.add(current);
    discovered.push(current);

    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    try {
      await page.goto(current, { waitUntil: "networkidle" });
      const links = await page.$$eval("a[href]", (anchors) =>
        anchors.map((a) => a.getAttribute("href")).filter(Boolean),
      );

      const normalized = links
        .map((link) => normalizeUrl(current, link))
        .filter(Boolean)
        .filter((link) => isCrawlableUrl(link, base.hostname))
        .map(canonicalizeUrl);

      for (const link of normalized) {
        if (
          !seen.has(link) &&
          !queued.has(link) &&
          queue.length < MAX_CRAWL_PAGES
        ) {
          queue.push(link);
          queued.add(link);
        }
      }
    } catch (error) {
      console.warn(`Discovery failed on ${current}: ${error.message}`);
    } finally {
      await page.close();
    }
  }

  return getCrawlTargets(websiteUrl, discovered);
}

async function ensureDirs(htmlDir, screenshotDir) {
  await fs.ensureDir(htmlDir);
  await fs.ensureDir(screenshotDir);
  for (const viewport of VIEWPORTS) {
    await fs.ensureDir(path.join(screenshotDir, viewport.name));
  }
}

async function scrollToLoadFullPage(page) {
  await page.evaluate(async () => {
    const getDocHeight = () =>
      Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
      );

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const isScrollable = (el) => {
      if (!el) return false;
      const style = window.getComputedStyle(el);
      const overflowY = style.overflowY;
      return (
        (overflowY === "auto" || overflowY === "scroll") &&
        el.scrollHeight - el.clientHeight > 120
      );
    };

    const scrollElementSlowly = async (el) => {
      const step = Math.max(
        180,
        Math.floor((el.clientHeight || window.innerHeight) * 0.65),
      );
      let y = 0;
      while (y < el.scrollHeight) {
        el.scrollTo(0, y);
        y += step;
        await sleep(90);
      }
      el.scrollTo(0, el.scrollHeight);
      await sleep(150);
      el.scrollTo(0, 0);
      await sleep(80);
    };

    let previousHeight = 0;
    let stableRounds = 0;

    // Slow, incremental scroll so lazy-loaded mobile sections get a chance to render.
    for (let round = 0; round < 6; round += 1) {
      const currentHeight = getDocHeight();
      const step = Math.max(220, Math.floor(window.innerHeight * 0.65));
      let y = 0;

      while (y < currentHeight) {
        window.scrollTo(0, y);
        y += step;
        await sleep(120);
      }

      window.scrollTo(0, currentHeight);
      await sleep(450);

      const newHeight = getDocHeight();
      if (newHeight === previousHeight) {
        stableRounds += 1;
      } else {
        stableRounds = 0;
      }
      previousHeight = newHeight;

      if (stableRounds >= 2) break;
    }

    // Some apps render main content in an inner scroll container instead of body.
    const allNodes = Array.from(document.querySelectorAll("*"));
    const scrollContainers = allNodes
      .filter(isScrollable)
      .sort((a, b) => b.scrollHeight - a.scrollHeight)
      .slice(0, 8);

    for (const container of scrollContainers) {
      await scrollElementSlowly(container);
    }

    // Ensure lazy images/videos have one more chance to resolve.
    const media = Array.from(document.querySelectorAll("img, video"));
    await Promise.allSettled(
      media.map(async (el) => {
        if (el.tagName === "IMG") {
          if (el.complete) return;
          await new Promise((resolve) => {
            el.addEventListener("load", resolve, { once: true });
            el.addEventListener("error", resolve, { once: true });
            setTimeout(resolve, 1200);
          });
          return;
        }

        if (el.tagName === "VIDEO") {
          await new Promise((resolve) => {
            el.addEventListener("loadeddata", resolve, { once: true });
            el.addEventListener("error", resolve, { once: true });
            setTimeout(resolve, 1200);
          });
        }
      }),
    );

    window.scrollTo(0, 0);
    await sleep(350);
  });
}

async function captureTrulyFullPageScreenshot(page, targetPath) {
  const client = await page.context().newCDPSession(page);
  const metrics = await client.send("Page.getLayoutMetrics");
  const contentWidth = Math.ceil(metrics.contentSize.width);
  const contentHeight = Math.ceil(metrics.contentSize.height);

  await client
    .send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
      clip: {
        x: 0,
        y: 0,
        width: contentWidth,
        height: contentHeight,
        scale: 1,
      },
    })
    .then(async ({ data }) => {
      await fs.outputFile(targetPath, Buffer.from(data, "base64"));
    });
}

async function captureScreenshots(page, screenshotDir, slug) {
  const screenshotPaths = {};
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await page.waitForTimeout(300);
    await scrollToLoadFullPage(page);
    const targetPath = path.join(screenshotDir, viewport.name, `${slug}.png`);
    await captureTrulyFullPageScreenshot(page, targetPath);
    screenshotPaths[viewport.name] = targetPath;
  }
  return screenshotPaths;
}

async function processPage(browser, url, htmlDir, screenshotDir) {
  const page = await browser.newPage();
  const slug = getSlug(url);
  console.log(`Processing: ${url}`);

  try {
    await page.setViewportSize({ width: 1440, height: 2200 });
    await page.goto(url, { waitUntil: "networkidle" });
    await scrollToLoadFullPage(page);

    const html = await page.content();
    const htmlPath = path.join(htmlDir, `${slug}.html`);
    await fs.outputFile(htmlPath, html);

    const screenshotPaths = await captureScreenshots(page, screenshotDir, slug);

    const title = await page.title();

    return {
      url,
      title,
      htmlPath,
      screenshotPath: screenshotPaths.desktop,
      screenshotDesktopPath: screenshotPaths.desktop,
      screenshotMobilePath: screenshotPaths.mobile,
    };
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
      "Usage: node scripts/crawl.mjs <website_url> [sitemap_url_optional]",
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
      const sitemapUrls = await getSitemapUrls(browser, sitemapUrl);
      urls = getCrawlTargets(websiteUrl, sitemapUrls);
      console.log(`Found ${urls.length} URLs in sitemap`);
    } catch (err) {
      console.warn(
        `Sitemap fetch failed (${err.message}), falling back to homepage discovery`,
      );
    }
  }

  if (!urls.length) {
    urls = await discoverLinksFromHomepage(browser, websiteUrl);
    console.log(
      `Discovered ${urls.length} internal links from recursive discovery`,
    );
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
// test
main();
