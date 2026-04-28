# 01 Crawl Site Agent

## Objective

Discover and crawl all in-scope pages from the target site, then persist deterministic artifacts under `output/<site>/docs`.

## Inputs

- `website_url` (required)
- `sitemap_url` (optional)

## Outputs

- `output/<site>/docs/html/*.html`
- `output/<site>/docs/screenshots/*.png`
- `output/<site>/docs/pages.json`

## Execution

Run:

`node scripts/crawl.js {{website_url}} {{sitemap_url_optional}}`

## Validation Checklist

- Crawl command exits successfully.
- `pages.json` exists and is valid JSON.
- At least one page item has `htmlPath` and `screenshotPath`.
- HTML and screenshot files referenced by `pages.json` exist on disk.

## Failure Policy

- If sitemap fails, fallback discovery is allowed.
- If zero usable pages are crawled, return error and stop downstream stages.

## Return Contract

Success:

```json
{
  "status": "success",
  "total_pages": 30,
  "usable_pages": 28,
  "output_docs_dir": "output/<site>/docs",
  "notes": ["sitemap_used|homepage_fallback"]
}
```

Error:

```json
{
  "status": "error",
  "message": "<root cause>",
  "recoverable": true
}
```
