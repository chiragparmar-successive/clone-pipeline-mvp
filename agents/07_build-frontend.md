# 07 Build Frontend Agent

## Objective
Generate a fully bootstrapped Next.js app with resilient Strapi data integration.

## Inputs
- `website_url`
- `output/<site>/docs/normalized.json`

## Execution
Run:

`node scripts/buildFrontend.mjs {{website_url}}`

## Output
- `output/<site>/frontend/`
  - `app/layout.mjs`
  - `app/page.mjs`
  - `lib/strapi.mjs`
  - `components/PageRenderer.mjs`
  - bootstrapped Next.js app files

## Quality Gates
- Next.js app created via standard bootstrap.
- `npm run dev` starts.
- API client returns fallback `[]` on network/API failure.
- Home page renders empty-state when no CMS data exists.

## Return
```json
{
  "status": "success",
  "message": "Frontend app generated",
  "output": "output/<site>/frontend"
}
```
