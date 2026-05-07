# LAUNCH AUDIT (v1)

Checklist operativa pre-release per UI PicoClaw.

## Build / quality
- [ ] Node 20 attivo (`nvm use 20`)
- [ ] `npm run lint` (in `code/ui`)
- [ ] `npm run build` (in `code/ui`)

## Kiosk / device
- [ ] Fullscreen 1280×800: nessun overflow/scrollbar
- [ ] Touch: feedback premium, nessun elemento “minuscolo”
- [ ] Idle / deep idle: leggibilità al buio (contrasto non aggressivo)

## Network resilience
- [ ] Meteo: se offline/timeout → UI non vuota (fallback chiaro)
- [ ] Forecast: overlay/panel non vuoto, mostra stato loading/error

## Deploy process
- [ ] Eseguire `deploy/push-ui.sh`
- [ ] Verificare HTTP OK su porta 3000
- [ ] Verificare `systemctl status picoclaw-ui` sul Pi se qualcosa non va

