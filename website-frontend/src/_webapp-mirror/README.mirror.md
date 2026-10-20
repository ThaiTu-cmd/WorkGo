# _webapp-mirror — website-frontend/src/_webapp-mirror

- Originally copied from `web-app/src` @ 04babc0 (2026-10-16). The `web-app/`
  Vite project has since been removed from the repo, so this folder is now the
  only copy of that UI and is edited directly. `MANIFEST.json` describes the
  original snapshot only.
- Mounted in Next.js through `src/components/webapp-bridge/webapp-shell.tsx`;
  the leading `_` keeps it out of App Router routing.
- ESLint ignores this folder (see `eslint.config.mjs`).
