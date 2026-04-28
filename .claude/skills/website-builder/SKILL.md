---
name: website-builder
description: >
  Run a full website reconstruction pipeline from URL (+ optional sitemap) to
  runnable Next.js frontend and Strapi CMS with auditable docs artifacts.
argument-hint: "website_url=<url> [sitemap_url=<url>]"
user-invocable: true
---

# Website Builder

You are the orchestration foreman for a deterministic, auditable build pipeline.
Execute all steps in order, enforce quality gates, and never claim success unless
all runnable outputs are generated.

## Invocation

- `/website-builder website_url=https://example.com`
- `/website-builder website_url=https://example.com sitemap_url=https://example.com/sitemap.xml`

Required:
- `website_url`

Optional:
- `sitemap_url`

If `website_url` is missing or invalid, stop and ask for a valid URL.

## Primary Objective

Build a complete output package under `output/<site>/`:
- `docs/` for extraction/build artifacts
- `frontend/` runnable Next.js app
- `cms/` runnable Strapi app

## Execution Contract

1. Validate inputs.
2. Run each pipeline step and capture step status.
3. Stop on hard failure unless the `auto-fix` step can recover.
4. Persist intermediary artifacts after every step.
5. Perform startup smoke-check expectations for generated apps.
6. Return structured final status.

## Step Plan

1. Crawl site:
   - `node scripts/crawl.js <website_url> [sitemap_url]`
2. Parse HTML:
   - `node scripts/parseHtml.js <website_url>`
3. Detect components:
   - `node scripts/detectComponents.js <website_url>`
4. Normalize components:
   - `node scripts/normalizeComponents.js <website_url>`
5. Generate schema:
   - `node scripts/generateSchema.js <website_url>`
6. Build CMS:
   - `node scripts/buildStrapi.js <website_url>`
7. Build frontend:
   - `node scripts/buildFrontend.js <website_url>`
8. Validate API contract + startup reliability:
   - ensure frontend handles CMS unavailable state
9. Run auto-fix checks for common failures.

## Quality Gates

- `docs/pages.json` exists and has at least one successfully crawled page.
- `docs/parsed-html/` exists with parsed artifacts.
- `docs/components.json`, `docs/normalized.json`, `docs/schema.json` are valid JSON.
- `cms/package.json` exists with Strapi scripts.
- `frontend/package.json` exists with Next scripts.
- frontend fetch logic is fail-safe (no hard crash if CMS unavailable).

## Failure Policy

- Hard fail on:
  - missing required input
  - crawl producing zero usable pages
  - schema generation failure
  - frontend/cms generation failure
- Soft fail (warning + continue if recoverable):
  - sitemap URL unavailable (fallback to homepage discovery)
  - partial page crawl errors

## Final Response Format

Return:
- Step-by-step status table (success/failure + short reason)
- Output paths:
  - `output/<site>/docs`
  - `output/<site>/frontend`
  - `output/<site>/cms`
- Run commands:
  - `cd output/<site>/cms && npm run develop`
  - `cd output/<site>/frontend && npm run dev`
- Any remaining known risks or manual actions.
