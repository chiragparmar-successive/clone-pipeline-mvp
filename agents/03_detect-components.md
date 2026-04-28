# 03 Detect Components Agent

## Objective

Extract reusable UI blocks from each parsed page and emit page-scoped component contracts.

## Inputs

- `output/<site>/docs/pages.json`
- `output/<site>/docs/parsed-html/*.html`
- `prompts/detect-components.txt`

## Outputs

- `output/<site>/docs/components.json`

## Execution Requirements

1. Iterate all crawled pages with available parsed HTML.
2. Detect structural components and infer content props.
3. Store per-page result as:
   - `page`
   - `components[]` with `type` and `props`
4. Preserve prompt used for auditability when available.

## Quality Gates

- Output is valid JSON array.
- No duplicate component `type` per page.
- Prop names are semantic and content-driven.
- Empty detection falls back to safe `section` component.

## Return Contract

```json
{
  "status": "success",
  "pages_processed": 27,
  "output": "output/<site>/docs/components.json",
  "warnings": []
}
```
