# Project Facts (source of truth)

## Repository structure
- `code/ui`: Vite + React UI
- `deploy/push-ui.sh`: deploy UI via build locale + rsync + systemctl restart

## Deploy (UI)
- Build locale (Node 20 via `nvm use 20`) → `npm run build` in `code/ui`
- Sync: `rsync dist/` → `/home/matteo/picoclaw-ui/dist/` on Raspberry
- Restart: `sudo systemctl restart picoclaw-ui`
- Check: HTTP su porta 3000

## Non-negotiables
- No heavy deps, no massive refactors.
- UI must remain fullscreen (1280×800), touch-first, stable under network errors.
- Secrets must never be committed (`deploy/push-ui.local.env`, real `.env*`, keys, tokens).

