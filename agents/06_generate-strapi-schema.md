## 06 Build Strapi Agent

### Objective
Generate a fully bootstrapped, runnable Strapi project and inject generated schemas/seed data.

### Inputs
- `website_url`
- `output/<site>/docs/schema.json`
- `output/<site>/docs/normalized.json`

### Execution
Run:

`node scripts/buildStrapi.js {{website_url}}`

### Output
- `output/<site>/cms/`
  - `src/components/generated/*.json`
  - `src/api/page/content-types/page/schema.json`
  - `seed/pages.json`
  - bootstrapped Strapi app files

### Quality Gates
- Strapi project bootstrapped (not partial scaffold).
- Generated schema files present in expected paths.
- `package.json` includes Strapi scripts.

### Return
```json
{
  "status": "success",
  "message": "Strapi app generated",
  "output": "output/<site>/cms"
}
```
