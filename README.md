# AI Website Builder Pipeline

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
