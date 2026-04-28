# 04 Normalize Components Agent

## Objective

Merge page-level detections into a global design-system map and route layout map.

## Inputs

- `website_url`
- `output/<site>/docs/components.json`
- `prompts/normalize-components.txt`

## Outputs

- `output/<site>/docs/normalized.json`

## Execution Rules

1. Merge duplicate/similar component types.
2. Union compatible props while removing style-only props.
3. Build stable route-to-layout mapping for all pages.
4. Keep deterministic naming to support schema and frontend generation.

## Quality Gates

- All `pages[].layout` entries map to existing components.
- No duplicate component keys.
- URLs are normalized route paths.
- Output includes both `components` and `pages`.

## Return Contract

```json
{
  "status": "success",
  "components_count": 12,
  "pages_count": 27,
  "output": "output/<site>/docs/normalized.json"
}
```
