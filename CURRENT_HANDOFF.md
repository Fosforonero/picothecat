# CURRENT HANDOFF — PicoClaw (UI)

## Snapshot (oggi)
- Repo contiene `deploy/`, `code/` (con `ui/`), `docs/` (vuota), `experiments/`, `backups/`.
- Deploy UI esistente: `deploy/push-ui.sh`:
  - `nvm use 20`
  - `npm run build` in `code/ui`
  - `rsync dist/` su Raspberry
  - `sudo systemctl restart picoclaw-ui`
  - HTTP check su porta 3000

## Stato reale del versioning
- Attualmente **non esiste storia git** (0 commit). Prima di sprint di prodotto: creare baseline e lavorare per piccoli cambi.

## Stato UI (code/ui)
- Stack: Vite + React.
- Meteo: Open‑Meteo con normalizzazione e forecast 7 giorni; gestione label/override in `localStorage`.
- Assistente: UI placeholder (non ancora connesso a backend conversazionale).

## Rischi principali
- **Process risk**: senza baseline git/governance, regressioni non tracciabili.
- **Env drift**: deploy reale usa build statica; dev usa proxy; attenzione a `VITE_BACKEND_BASE` e health endpoint.

## Next (ordine consigliato)
1) Sprint 0 (governance + hygiene + baseline).
2) Sprint prodotto: meteo/location UX (GPS assistito in settings) + QA su device.
3) Sprint prodotto: “assistant wiring” (solo dopo contratto API/health stabile).

## QA quick checklist (prima di deploy UI)
- Node 20 attivo
- `npm run lint`
- `npm run build`
- Smoke test: avvio UI e verifica fullscreen 1280×800 (no overflow)
- Meteo: stato loading/error non rompe UI; forecast panel apre e mostra contenuti

