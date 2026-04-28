# 05 Generate CMS Schema Agent

## Objective

Translate normalized components into Strapi component schemas and page content-type definition.

## Inputs

- `website_url`
- `output/<site>/docs/normalized.json`
- `prompts/generate-schema.txt`

## Outputs

- `output/<site>/docs/schema.json`

## Execution

Run:

`node scripts/generateSchema.js {{website_url}}`

## Quality Gates

- Output JSON contains:
  - `components`
  - `contentTypes.page`
- Every normalized component has a corresponding schema object.
- Page content type includes `title`, `slug`, `sourceUrl`, `sections`.

## Return Contract

```json
{
  "status": "success",
  "components_generated": 12,
  "output": "output/<site>/docs/schema.json"
}
```
