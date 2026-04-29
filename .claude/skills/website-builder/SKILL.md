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

Build a complete output package under `output/<site>/` where `<site>` is derived from the website name/hostname:
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

## Claude Advanced Orchestration

Use Claude as an orchestrator, not as a single-shot generator:

1. Skill-first execution: always run this skill flow before ad-hoc prompting.
2. Artifact-first context: consume `docs/` artifacts before live crawling/extraction.
3. Parallel agents only for bounded tasks:
   - Good: isolated component builds, schema segment generation, focused fixes
   - Bad: "build entire project" in one delegated prompt
4. Explicit handoff contracts:
   - every delegated task gets exact input artifacts, target paths, and success checks
   - every delegated task returns structured output (what changed, what passed, what failed)
5. Deterministic verification after each merge:
   - typecheck/build/runtime health checks
   - API contract checks against generated manifests
6. Recovery loop discipline:
   - capture failure evidence
   - apply minimal fix
   - rerun only impacted checks first, then full gate before final success

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

### Phase 3: Generate Test Cases From Input URL

Goal:
- Create test cases from input URL artifacts before building CMS/frontend.

Required artifacts:
- `docs/ai-tests/test-cases.json`

Requirements:
- Test cases are derived from source URL artifacts (`pages.json`, parsed HTML, screenshots).
- Cover structure, content, interaction behavior, and visual composition.
- Include per-route assertions and severity (`critical`, `major`, `minor`).

### Phase 4: Build CMS via AI Agent (No script)

Run:
- Use AI agent with extracted artifacts in `docs/`
- Use exact CMS prompt file `prompts/build-cms.txt`

Required artifacts:
- `cms/` runnable Strapi app
- page content-type generated directly from extracted artifacts
- `seed/pages.json` generated from crawl + parsed HTML outputs

### Phase 5: Build Frontend via AI Agent (No script)

Run:
- Use AI agent with exact prompt file `prompts/build-frontend.txt`

Required artifacts:
- `frontend/` runnable Next.js app
- API client + renderer wiring for direct page payloads

### Phase 6: Integration Validation

Validate:
- env contract (`NEXT_PUBLIC_STRAPI_URL`)
- endpoint contract (consume `cms/docs/api-spec/endpoint-manifest.json`, do not assume fixed routes)
- graceful fallback behavior for CMS downtime
- section contract alignment (`cms/docs/api-spec/section-map.json` is consumed by frontend)

### Phase 7: Auto-Fix Loop

Apply deterministic fixes for known failures and rerun impacted checks.

### Phase 8: Run Playwright Tests On Output Frontend

Run:
- After frontend is created and running, execute stored test cases with Playwright:
  - `npm run playwright:regression -- <source_url> <output_url> output/<site>/docs/ai-tests/test-cases.json output/<site>/docs/ai-tests`

Required artifacts:
- `docs/ai-tests/output-run.json`
- `docs/ai-tests/comparison-report.json`
- `docs/ai-tests/comparison-report.md`

Hard rule:
- Do not declare success until Playwright critical tests pass and output frontend matches expected behavior/content from source URL.

## Quality Gates

- `docs/pages.json` exists and has at least one successfully crawled page.
- desktop + mobile screenshots exist for crawled pages.
- `docs/parsed-html/` exists.
- Playwright baseline artifacts exist in `docs/ai-tests/`.
- `cms` is a real bootstrapped app (not partial scaffold).
- `frontend` is a real bootstrapped app (not partial scaffold).
- frontend fetch logic is fail-safe (no hard crash if CMS unavailable).
- frontend has real reusable components under `src/components/` (not only monolithic `app/*/page.tsx` files).
- CMS + frontend both run, and at least one list route + one detail route render real CMS-backed data.
- Playwright comparison report exists and all `critical` tests pass.

## Failure Policy

- Hard fail on:
  - missing required input
  - crawl producing zero usable pages
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
- Playwright test artifacts:
  - `output/<site>/docs/ai-tests/test-cases.json`
  - `output/<site>/docs/ai-tests/comparison-report.md`
- Run commands:
  - `cd output/<site>/cms && npm run develop`
  - `cd output/<site>/frontend && npm run dev`
- Known gaps / manual follow-ups (if any)
