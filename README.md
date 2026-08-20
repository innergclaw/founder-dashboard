# Founder Dashboard

Private operating dashboard for Nasirr G. Mayo across OWNYOURWEB, INNERGINTEL, and SHOPNASGFX.

## What it tracks

- Priority project snapshot with live and repository links
- Active Codex reminder schedules
- Founder-only cloud job queue
- GitHub repository freshness and Supabase sync status
- Hourly cloud briefing engine that prepares alerts before check-in
- Morning, midday, and evening briefing preferences
- Telegram and email delivery when configured, plus on-device browser notifications
- Apple Messages shown as pending until an approved connector is available

## Security model

GitHub Pages serves the static interface. Supabase Auth protects access, and Row Level Security restricts all dashboard rows to the founder account ID. No secret or service-role key is shipped to the browser.

## Cloud rhythm

GitHub Actions refreshes project health and runs the briefing engine at 11 minutes past every hour. The engine records due work, project-health changes, schedules, and daily summaries in Supabase, then delivers scheduled or urgent briefings through enabled channels. Opening the dashboard also performs a private refresh without sending duplicate messages.

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
