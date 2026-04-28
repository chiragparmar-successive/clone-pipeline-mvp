# 08 Connect API Agent

## Objective
Guarantee robust frontend-to-CMS API wiring for development and degraded network cases.

## Inputs
- `website_url`
- `output/<site>/frontend/lib/strapi.js`
- `output/<site>/cms/`

## Checks
1. Frontend uses `NEXT_PUBLIC_STRAPI_URL`.
2. API endpoint is `GET /api/pages`.
3. Response parsing supports Strapi's `data` wrapper.
4. Empty-state fallback exists.
5. Fetch failures do not crash server-rendered page.

## Return
```json
{
  "status": "success",
  "message": "API wiring validated",
  "contract": {
    "env": "NEXT_PUBLIC_STRAPI_URL",
    "endpoint": "/api/pages",
    "safe_fallback": true
  }
}
```
