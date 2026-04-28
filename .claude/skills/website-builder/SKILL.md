---
name: website-builder
description: >
  Reverse-engineer a live website from URL (+ optional sitemap) into a complete
  output package: docs artifacts, runnable Next.js frontend, runnable Strapi CMS,
  and resilient API integration.
argument-hint: "website_url=<url> [sitemap_url=<url>]"
user-invocable: true
---

# Website Builder

You are a pipeline foreman, not a one-shot generator. Run an auditable,
phase-based build where extraction quality controls generation quality.

## Input Contract

- `/website-builder website_url=https://example.com`
- `/website-builder website_url=https://example.com sitemap_url=https://example.com/sitemap.xml`

Required:
- `website_url`

Optional:
- `sitemap_url`

Rules:
1. `website_url` is mandatory.
2. `sitemap_url` is optional.
3. If `website_url` is missing or malformed, stop and ask for a valid URL.
4. If `sitemap_url` fails, continue using recursive internal link discovery.

## Output Contract

Build a complete output package under `output/<site>/`:
- `docs/` for extraction/build artifacts
- `frontend/` runnable Next.js app
- `cms/` runnable Strapi app

Only mark success when all three subfolders are generated and validation passes.

## Non-Negotiable Principles

1. Completeness over speed.
2. Deterministic handoffs between steps.
3. No silent failures.
4. Runtime resilience (frontend must tolerate CMS unavailability).
5. Proof of runnability.

## Execution Contract

1. Validate inputs.
2. Run each phase and persist artifacts before moving forward.
3. Record status for each phase (success/failure + reason).
4. Stop on hard failures unless auto-fix formally recovers.
5. Validate startup behavior for generated `cms` and `frontend`.
6. Return structured completion report with outputs and risks.

## Phase Plan

### Phase 1: Crawl + Discovery

Run:
- `node scripts/crawl.mjs <website_url> [sitemap_url]`

Required artifacts:
- `docs/pages.json`
- `docs/html/*.html`
- `docs/screenshots/desktop/*.png`
- `docs/screenshots/mobile/*.png`

Requirements:
- full-page desktop and mobile screenshots
- pre-capture scroll pass to load lazy content
- nested sitemap handling when available
- recursive internal-link fallback discovery

### Phase 2: Parse HTML

Run:
- `node scripts/parseHtml.mjs <website_url>`

Required artifacts:
- `docs/parsed-html/*.html`

### Phase 3: Detect Components

Run:
- `node scripts/detectComponents.mjs <website_url>`

Required artifacts:
- `docs/components.json`

### Phase 4: Normalize Components

Run:
- `node scripts/normalizeComponents.mjs <website_url>`

Required artifacts:
- `docs/normalized.json`

### Phase 5: Generate CMS Schema

Run:
- `node scripts/generateSchema.mjs <website_url>`

Required artifacts:
- `docs/schema.json`

### Phase 6: Build CMS

Run:
- `node scripts/buildStrapi.mjs <website_url>`

Required artifacts:
- `cms/` bootstrapped Strapi app
- generated schemas + seed files

### Phase 7: Build Frontend

Run:
- `node scripts/buildFrontend.mjs <website_url>`

Required artifacts:
- `frontend/` bootstrapped Next.js app
- API client + renderer wiring

### Phase 8: Integration Validation

Validate:
- env contract (`NEXT_PUBLIC_STRAPI_URL`)
- endpoint contract (`GET /api/pages`)
- graceful fallback behavior for CMS downtime

### Phase 9: Auto-Fix Loop

Apply deterministic fixes for known failures and rerun impacted checks.

## Quality Gates

- `docs/pages.json` exists and has at least one successfully crawled page.
- desktop + mobile screenshots exist for crawled pages.
- `docs/parsed-html/` exists.
- `docs/components.json`, `docs/normalized.json`, `docs/schema.json` are valid JSON.
- `cms` is a real bootstrapped app (not partial scaffold).
- `frontend` is a real bootstrapped app (not partial scaffold).
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

## Anti-Patterns (Do Not Do)

- Do not declare success if only docs are generated.
- Do not generate partial cms/frontend file sets.
- Do not crash render path on API network errors.
- Do not skip output existence checks.
- Do not silently ignore failed steps.

## Completion Report Format

Return:

- Input summary (`website_url`, sitemap mode used)
- Step-by-step status table
- Output paths:
  - `output/<site>/docs`
  - `output/<site>/frontend`
  - `output/<site>/cms`
- Run commands:
  - `cd output/<site>/cms && npm run develop`
  - `cd output/<site>/frontend && npm run dev`
- Known gaps / manual follow-ups (if any)
