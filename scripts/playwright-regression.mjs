import path from "node:path";
import { chromium } from "playwright";
import fs from "./fs.mjs";

function parseTestCases(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.tests)) return raw.tests;
  throw new Error("Invalid test-cases.json format. Expected array or { tests: [] }.");
}

function normalizeBaseUrl(value) {
  return String(value || "").replace(/\/+$/, "");
}

async function evaluateCheck(page, check) {
  const type = check?.type;

  if (type === "selector_visible") {
    const locator = page.locator(check.selector);
    const count = await locator.count();
    if (!count) return { pass: false, detail: `Missing selector: ${check.selector}` };
    const visible = await locator.first().isVisible();
    return {
      pass: visible,
      detail: visible ? "visible" : `Not visible: ${check.selector}`,
    };
  }

  if (type === "text_contains") {
    const text = await page.locator(check.selector).first().textContent();
    const pass = Boolean(text && text.includes(check.text));
    return {
      pass,
      detail: pass
        ? "text matched"
        : `Expected "${check.text}" in ${check.selector}`,
    };
  }

  if (type === "count_at_least") {
    const count = await page.locator(check.selector).count();
    const minimum = Number(check.min ?? 1);
    const pass = count >= minimum;
    return {
      pass,
      detail: pass ? `count=${count}` : `count=${count}, expected>=${minimum}`,
    };
  }

  if (type === "title_contains") {
    const title = await page.title();
    const pass = title.includes(check.text || "");
    return {
      pass,
      detail: pass ? "title matched" : `Title "${title}" missing "${check.text}"`,
    };
  }

  if (type === "url_includes") {
    const url = page.url();
    const pass = url.includes(check.text || "");
    return {
      pass,
      detail: pass ? "url matched" : `URL "${url}" missing "${check.text}"`,
    };
  }

  return { pass: false, detail: `Unsupported check type: ${type}` };
}

async function runSuite({ browser, baseUrl, tests, outputDir, targetName }) {
  const page = await browser.newPage();
  const results = [];
  const screenshotsDir = path.join(outputDir, "screenshots", targetName);
  await fs.ensureDir(screenshotsDir);

  for (const test of tests) {
    const id = test.id || `${targetName}-${results.length + 1}`;
    const route = test.route || test.path || "/";
    const fullUrl = `${normalizeBaseUrl(baseUrl)}${route.startsWith("/") ? route : `/${route}`}`;
    const checks = Array.isArray(test.checks) ? test.checks : [];

    const record = {
      id,
      route,
      severity: test.severity || "major",
      pass: true,
      failures: [],
      checks: [],
      url: fullUrl,
    };

    try {
      const response = await page.goto(fullUrl, {
        waitUntil: "networkidle",
        timeout: 45000,
      });
      if (!response || !response.ok()) {
        record.pass = false;
        record.failures.push(`Navigation failed (${response?.status() ?? "no response"})`);
      }

      if (test.waitFor?.selector) {
        await page.waitForSelector(test.waitFor.selector, {
          timeout: Number(test.waitFor.timeoutMs ?? 10000),
        });
      }

      for (const check of checks) {
        const outcome = await evaluateCheck(page, check);
        record.checks.push({ check, ...outcome });
        if (!outcome.pass) {
          record.pass = false;
          record.failures.push(outcome.detail);
        }
      }
    } catch (error) {
      record.pass = false;
      record.failures.push(error.message);
    }

    const screenshotPath = path.join(screenshotsDir, `${id}.png`);
    try {
      await page.screenshot({ path: screenshotPath, fullPage: true });
      record.screenshot = screenshotPath;
    } catch {
      // Non-blocking: screenshot failures should not hide check outcomes.
    }

    results.push(record);
  }

  await page.close();
  return results;
}

function compareRuns(sourceBaseline, outputRun) {
  const sourceById = new Map(sourceBaseline.map((item) => [item.id, item]));
  const comparisons = outputRun.map((item) => {
    const baseline = sourceById.get(item.id);
    const baselinePass = baseline?.pass ?? null;
    const delta =
      baselinePass === null ? "no-baseline" : baselinePass === item.pass ? "same" : baselinePass ? "regressed" : "improved";
    return {
      id: item.id,
      route: item.route,
      severity: item.severity,
      baselinePass,
      outputPass: item.pass,
      delta,
      failures: item.failures,
    };
  });

  const summary = {
    total: comparisons.length,
    critical: comparisons.filter((c) => c.severity === "critical").length,
    major: comparisons.filter((c) => c.severity === "major").length,
    minor: comparisons.filter((c) => c.severity === "minor").length,
    regressions: comparisons.filter((c) => c.delta === "regressed").length,
    criticalRegressions: comparisons.filter(
      (c) => c.delta === "regressed" && c.severity === "critical",
    ).length,
  };

  return { summary, comparisons };
}

function asMarkdown(comparison) {
  const lines = [
    "# Playwright Comparison Report",
    "",
    `- Total tests: ${comparison.summary.total}`,
    `- Regressions: ${comparison.summary.regressions}`,
    `- Critical regressions: ${comparison.summary.criticalRegressions}`,
    "",
    "## Regressions",
    "",
  ];

  const regressions = comparison.comparisons.filter((c) => c.delta === "regressed");
  if (!regressions.length) {
    lines.push("- No regressions found.");
    return `${lines.join("\n")}\n`;
  }

  for (const item of regressions) {
    lines.push(
      `- [${item.severity}] \`${item.id}\` \`${item.route}\`: ${item.failures.join("; ") || "failed"}`,
    );
  }

  return `${lines.join("\n")}\n`;
}

async function main() {
  const sourceUrl = process.argv[2];
  const outputUrl = process.argv[3];
  const testCasesPath = process.argv[4];
  const outputDir = process.argv[5];

  if (!sourceUrl || !outputUrl || !testCasesPath || !outputDir) {
    console.error(
      "Usage: node scripts/playwright-regression.mjs <source_url> <output_url> <test_cases_json> <output_dir>",
    );
    process.exit(1);
  }

  const testCasesRaw = await fs.readJson(testCasesPath);
  const tests = parseTestCases(testCasesRaw);
  await fs.ensureDir(outputDir);

  const browser = await chromium.launch();
  try {
    const sourceBaseline = await runSuite({
      browser,
      baseUrl: sourceUrl,
      tests,
      outputDir,
      targetName: "source",
    });

    const outputRun = await runSuite({
      browser,
      baseUrl: outputUrl,
      tests,
      outputDir,
      targetName: "output",
    });

    const comparison = compareRuns(sourceBaseline, outputRun);
    const comparisonMd = asMarkdown(comparison);

    await fs.writeJson(path.join(outputDir, "source-baseline.json"), sourceBaseline, {
      spaces: 2,
    });
    await fs.writeJson(path.join(outputDir, "output-run.json"), outputRun, {
      spaces: 2,
    });
    await fs.writeJson(path.join(outputDir, "comparison-report.json"), comparison, {
      spaces: 2,
    });
    await fs.outputFile(path.join(outputDir, "comparison-report.md"), comparisonMd);

    if (comparison.summary.criticalRegressions > 0) {
      console.error(
        `Playwright regression failed: ${comparison.summary.criticalRegressions} critical regressions`,
      );
      process.exit(2);
    }

    console.log("Playwright regression checks passed.");
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error("Playwright regression failed:", error.message);
  process.exit(1);
});
