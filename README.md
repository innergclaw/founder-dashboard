# Founder Dashboard

Private operating dashboard for Nasirr G. Mayo across OWNYOURWEB, INNERGINTEL, and SHOPNASGFX.

## What it tracks

- Priority project snapshot with live and repository links
- Active Codex reminder schedules
- Founder-only cloud job queue
- GitHub repository freshness and Supabase sync status

## Security model

GitHub Pages serves the static interface. Supabase Auth protects access, and Row Level Security restricts all dashboard rows to the founder account ID. No secret or service-role key is shipped to the browser.

## Local development

```sh
npm install
npm run dev
```

## Validation

```sh
npm run verify
npm run build
```
