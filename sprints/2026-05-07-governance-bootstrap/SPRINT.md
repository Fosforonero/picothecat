# Sprint: 2026-05-07 — Governance Bootstrap

## Sprint Goal
Rendere il progetto **production-safe e agent-operable** creando governance minima, handoff e guardrail, senza toccare feature UI.

## Why Now
Esiste un deploy script reale (`deploy/push-ui.sh`) che può aggiornare produzione. Senza guardrail (docs + hygiene) il rischio regressioni è troppo alto.

## Scope (in)
- Creazione dei documenti di governance (v1 minimal).
- Creazione di `.claude/agents` e `.claude/memory`.
- Creazione della cartella sprint con checklist.
- Hardening del root `.gitignore` per evitare segreti/rumore.

## Anti-goals (out)
- Nessuna modifica a `code/ui/src/**`.
- Nessuna modifica a `deploy/push-ui.sh`.
- Nessuna nuova dipendenza, nessun refactor, nessun lavoro “feature”.

## Files to Inspect
- `deploy/push-ui.sh`
- `code/ui/README.md`
- Root `.gitignore`

## Files Allowed to Modify
- Root: `CLAUDE.md`, `CURRENT_HANDOFF.md`, `ROADMAP.md`, `CHANGELOG.md`, `PRODUCT_STRATEGY.md`, `LEGAL.md`, `LAUNCH_AUDIT.md`, `DESIGN.md`
- Root: `.gitignore`
- `.claude/**`
- `sprints/2026-05-07-governance-bootstrap/**`

## Files Forbidden
- `code/ui/src/**`
- `deploy/push-ui.sh`

## Risks
- Over-documentation: mantenere tutto breve e operativo.
- Ignore rules sbagliate: rischiano di nascondere artefatti utili o leakare segreti.

## Anti-Regression Requirements
- Policy segreti esplicita (mai committare `.env*` reali, chiavi, `push-ui.local.env`).
- Release checklist minima in `LAUNCH_AUDIT.md`.
- Confini autonomia chiari in `CLAUDE.md`.

## QA Steps
- Verificare che tutti i file richiesti esistano.
- Verificare che root `.gitignore` ignori `node_modules/`, `dist/`, `.env*` e rumore OS.

## GO / NO-GO
- **GO**: governance completa + sprint doc + `.gitignore` root sano.
- **NO-GO**: qualsiasi cambio di feature o deploy pipeline.

## Expected Deliverables
- Governance v1 (root docs) + `.claude/memory`.
- Sprint folder completo e pronto per esecuzione.

## What Claude MUST NOT do
- Non toccare UI code (`code/ui/src/**`).
- Non modificare deploy script.
- Non installare dipendenze.

