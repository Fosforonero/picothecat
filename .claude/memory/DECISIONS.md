# Decisions (ADR-lite)

## 2026-05-07 — Deploy UI via push-ui.sh
- **Decision**: mantenere deploy UI con build locale Node 20 + rsync dist + restart servizio.
- **Why**: Raspberry può non avere npm/node installati; build ripetibile su Mac.
- **Guardrail**: non modificare `deploy/push-ui.sh` senza review umana dedicata.

## 2026-05-07 — Governance-first
- **Decision**: prima sprint di prodotto, creare governance minima (handoff, sprint, audit).
- **Why**: repo senza commit/history e senza docs → alto rischio regressioni e drift.

