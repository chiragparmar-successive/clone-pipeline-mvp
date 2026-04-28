# 02 Parse HTML Agent

## Objective

Transform crawled raw HTML into sanitized, analysis-friendly page snapshots.

## Inputs

- `website_url`
- `output/<site>/docs/pages.json`

## Outputs

- `output/<site>/docs/parsed-html/*.html`

## Execution

Run:

`node scripts/parseHtml.js {{website_url}}`

## Quality Checks

- Parsed directory exists and contains files.
- Scripts/styles/comments are removed from parsed HTML.
- Parsed file count is consistent with crawled pages that had HTML.
- Failures are reported per page without crashing the entire step.

## Return Contract

```json
{
  "status": "success",
  "parsed_count": 27,
  "skipped_count": 3,
  "output_dir": "output/<site>/docs/parsed-html"
}
```
