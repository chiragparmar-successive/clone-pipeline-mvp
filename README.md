# AI Website Builder Pipeline test

This repository now provides an end-to-end URL-to-project pipeline.

Input:
- `website_url` (required)
- `sitemap_url` (optional)

Output:
- Generated Next.js frontend scaffold
- Generated Strapi scaffold
- API integration contract (`frontend` -> `cms /api/pages`)

## Pipeline

```text
website_url + optional sitemap_url
  -> crawl
  -> parse HTML
  -> detect components
  -> normalize components
  -> generate schema
  -> build Strapi scaffold
  -> build Next.js scaffold
```

## Run

Install dependencies:

`npm install`

Execute via local slash skill:

`/website-builder website_url=https://example.com sitemap_url=https://example.com/sitemap.xml`

If no sitemap:

`/website-builder website_url=https://example.com`

Run crawl + parse + docs validation directly:

`npm run pipeline -- https://example.com https://example.com/sitemap.xml`

Generate Playwright test cases from artifacts:

`npm run tests:generate -- https://example.com`

Run Playwright regression after frontend is built/running:

`npm run playwright:regression -- https://example.com http://localhost:3000 output/<site>/docs/ai-tests/test-cases.json output/<site>/docs/ai-tests`

## Output Folder

Generated files are placed in:

`output/<site>/`

`<site>` is a stable slug from the website name/hostname (for example, `example.com`).

Folder layout:
- `docs/` (crawl + build artifacts such as screenshots, html, parsed html, and JSON files)
- `frontend/` (fully bootstrapped Next.js app)
- `cms/` (fully bootstrapped Strapi app)

## Start Generated Projects

Strapi:
- `cd output/<site>/cms`
- `npm run dev`

Next.js:
- `cd output/<site>/frontend`
- `cp .env.example .env.local`
- `npm run dev`

## Notes

- The pipeline is deterministic by default and also stores rich prompts in outputs for AI-assisted refinement.
- If sitemap is missing or invalid, crawler falls back to homepage internal-link discovery.
- Frontend uses `NEXT_PUBLIC_STRAPI_URL` and gracefully handles empty API responses.
- Local skill command is `/website-builder` from `.claude/skills/website-builder/SKILL.md`.

## Simple Quality Flow

1. Create test cases from input URL artifacts:
   - `npm run tests:generate -- https://example.com`
2. Build CMS + frontend.
3. Run Playwright comparison on output frontend:
   - `npm run playwright:regression -- https://example.com http://localhost:3000 output/<site>/docs/ai-tests/test-cases.json output/<site>/docs/ai-tests`

Only mark complete when critical Playwright checks pass.
