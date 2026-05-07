# Agents (roles) — PicoClaw

Questa cartella descrive ruoli. Non è integrazione tecnica con tool specifici.

## frontend-ui-reviewer
- Controlla layout 1280×800, overflow, gerarchia, touch targets, stati loading/error.

## kiosk-ops-reviewer
- Controlla URL kiosk (localhost), flags Chromium, geolocation secure context, anti burn‑in.

## release-readiness-reviewer
- Verifica checklist `LAUNCH_AUDIT.md`, guardrail `CLAUDE.md`, e che non si tocchi `deploy/push-ui.sh` senza motivo.

