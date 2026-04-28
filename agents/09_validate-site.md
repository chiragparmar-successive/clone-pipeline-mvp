# 09 Validate Site Agent

## Objective
Validate runnability and functional correctness of generated frontend + CMS outputs.

## Inputs
- Generated frontend
- Generated Strapi content model

## Validation
1. Home page renders with content.
2. Section list from CMS appears in UI.
3. No runtime fetch crash when API is unavailable.
4. CMS app starts and serves admin/API routes.
5. Frontend app starts and returns HTTP 200 for `/`.

## Return
```json
{
  "status": "success",
  "message": "Validation completed",
  "checks": {
    "cms_start": "pass|fail",
    "frontend_start": "pass|fail",
    "api_binding": "pass|fail"
  }
}
```
