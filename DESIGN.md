# DESIGN (v1)

## Principi
- **Gerarchia forte**: l’orologio è la funzione primaria in idle.
- **Ambient premium**: niente UI “cheap” o troppo digitale; contrasto controllato.
- **Touch-first**: target grandi, feedback immediato, niente hover-dependent UX.
- **Always-on friendly**: anti burn‑in (solo dove richiesto) + deep idle discreto.

## Layout invariants
- Target principale: **1280×800** (Raspberry touchscreen).
- Nessun contenuto deve “uscire” dallo schermo (no overflow nascosto come hack).
- Evitare scroll in idle.

## Meteo
- Temperatura protagonista; icone leggibili a colpo d’occhio.
- Errori rete: fallback stabile, mai “—” ovunque.
- Location: GPS quando possibile; override manuale persistente.

