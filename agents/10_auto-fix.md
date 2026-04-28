# 10 Auto Fix Agent

## Objective
Apply deterministic recovery actions for common pipeline failures and rerun impacted checks.

## Auto-fix Strategy
1. If `pages.json` empty -> fallback to homepage-only crawl.
2. If `components.json` empty -> inject safe default section component.
3. If frontend fetch fails -> render empty-state instead of crashing.
4. If schema generation misses fields -> infer from normalized props.
5. If Next.js dev Turbopack root errors occur -> prefer webpack dev command.
6. If running server is invalidated during regeneration -> restart service after build completion.

## Return
```json
{
  "status": "success",
  "message": "Auto-fix pass completed",
  "applied_fixes": [
    "fix_id_1"
  ],
  "remaining_manual_actions": []
}
```
