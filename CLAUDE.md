# PicoClaw — Agent Governance (v1)

Questa repo è gestita con workflow “agentico” (Claude/Cursor) ma con confini molto rigidi per ridurre regressioni sul dispositivo (Raspberry Pi kiosk).

## North Star
- UI **touch-first**, **fullscreen**, ambient/premium.
- Deploy UI tramite `deploy/push-ui.sh` (build locale Node 20 → rsync dist → restart servizio).

## Hard Constraints (non negoziabili)
- **Niente dipendenze pesanti** o refactor massivi senza approvazione umana.
- **Niente modifiche a produzione** (deploy, systemd, writing su device) senza esplicita richiesta.
- **Mai committare segreti**: chiavi SSH, `.env*` reali, `deploy/push-ui.local.env`, token, IP/host privati se evitabile.
- **Non toccare** `deploy/push-ui.sh` salvo ticket dedicato (release/process).

## Allowed Work
- Migliorie UI incremental (layout, gerarchia, touch feedback) con QA su 1280×800.
- Meteo (Open‑Meteo) e location handling con fallback stabili (UI mai “vuota”).
- Documentazione e sprint management.

## Forbidden (senza HUMAN_ONLY)
Se un task include uno dei seguenti: **HUMAN_ONLY**.
- auth / session / token
- billing / pagamenti / Stripe
- migrazioni DB / schema / dati persistenti
- security / middleware / CORS policy di produzione
- deploy automation che scrive in produzione

## Definition of Done (DoD)
- Nessun overflow/scrollbar su risoluzione target (1280×800).
- UI rimane stabile in errori rete (meteo/health): sempre fallback.
- `npm run lint` e `npm run build` passano localmente (Node 20).
- Changelog/sprint/handoff aggiornati se il cambiamento impatta comportamento.

## Review Gates
- Modifiche a `deploy/` o policy di rete: **review umana obbligatoria**.
- Modifiche al meteo/location: review + QA su device o simulazione permessi (GPS deny/timeout).

